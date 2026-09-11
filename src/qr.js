// Generator de coduri QR (mod byte, corectie de erori nivel M), scris de la zero
// ca sa nu adaugam dependente. Iese direct SVG: se printeaza la orice marime,
// fara pixeli.
//
// Pasii sunt cei din standardul ISO/IEC 18004: codificare -> coduri de corectie
// Reed-Solomon -> intretesere -> asezare in matrice -> masca cu penalizare minima.

const EC_LEVEL_M = 0b00;

// Pentru fiecare versiune (1-15): coduri de corectie per bloc, apoi structura
// blocurilor (cate blocuri si cate coduri de date au).
const VERSIONS = {
  1:  { ec: 10, blocks: [[1, 16]] },
  2:  { ec: 16, blocks: [[1, 28]] },
  3:  { ec: 26, blocks: [[1, 44]] },
  4:  { ec: 18, blocks: [[2, 32]] },
  5:  { ec: 24, blocks: [[2, 43]] },
  6:  { ec: 16, blocks: [[4, 27]] },
  7:  { ec: 18, blocks: [[4, 31]] },
  8:  { ec: 22, blocks: [[2, 38], [2, 39]] },
  9:  { ec: 22, blocks: [[3, 36], [2, 37]] },
  10: { ec: 26, blocks: [[4, 43], [1, 44]] },
  11: { ec: 30, blocks: [[1, 50], [4, 51]] },
  12: { ec: 22, blocks: [[6, 36], [2, 37]] },
  13: { ec: 22, blocks: [[8, 37], [1, 38]] },
  14: { ec: 24, blocks: [[4, 40], [5, 41]] },
  15: { ec: 24, blocks: [[5, 41], [5, 42]] },
};

const ALIGNMENT = {
  1: [], 2: [6, 18], 3: [6, 22], 4: [6, 26], 5: [6, 30], 6: [6, 34],
  7: [6, 22, 38], 8: [6, 24, 42], 9: [6, 26, 46], 10: [6, 28, 50],
  11: [6, 30, 54], 12: [6, 32, 58], 13: [6, 34, 62], 14: [6, 26, 46, 66],
  15: [6, 26, 48, 70],
};

/* ------------------------------- aritmetica GF(256) ------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(() => {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d; // polinomul generator al campului
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

function generatorPoly(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

function errorCorrection(data, ecCount) {
  const gen = generatorPoly(ecCount);
  const result = new Array(ecCount).fill(0);
  for (const byte of data) {
    const factor = byte ^ result[0];
    result.shift();
    result.push(0);
    for (let i = 0; i < gen.length - 1; i++) {
      result[i] ^= gfMul(gen[i + 1], factor);
    }
  }
  return result;
}

/* ---------------------------------- codificare ---------------------------------- */

function dataCapacity(version) {
  return VERSIONS[version].blocks.reduce((sum, [count, dataCodewords]) => sum + count * dataCodewords, 0);
}

function pickVersion(byteLength) {
  for (let version = 1; version <= 15; version++) {
    const countBits = version < 10 ? 8 : 16;
    const needed = Math.ceil((4 + countBits + byteLength * 8) / 8);
    if (needed <= dataCapacity(version)) return version;
  }
  throw new Error('Textul este prea lung pentru un cod QR (peste versiunea 15)');
}

function encodeData(bytes, version) {
  const bits = [];
  const push = (value, length) => {
    for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
  };

  push(0b0100, 4); // mod byte
  push(bytes.length, version < 10 ? 8 : 16);
  for (const byte of bytes) push(byte, 8);

  const capacityBits = dataCapacity(version) * 8;
  push(0, Math.min(4, capacityBits - bits.length)); // terminator
  while (bits.length % 8 !== 0) bits.push(0);

  const codewords = [];
  for (let i = 0; i < bits.length; i += 8) {
    codewords.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  // Umplutura standard, alternand cele doua octeti, pana la capacitate.
  const padding = [0xec, 0x11];
  while (codewords.length < dataCapacity(version)) {
    codewords.push(padding[(codewords.length - bits.length / 8) % 2]);
  }
  return codewords;
}

// Blocurile se intretes: intai primul octet din fiecare bloc, apoi al doilea etc.
function interleave(codewords, version) {
  const { ec, blocks } = VERSIONS[version];
  const dataBlocks = [];
  const ecBlocks = [];
  let offset = 0;
  for (const [count, dataCodewords] of blocks) {
    for (let i = 0; i < count; i++) {
      const block = codewords.slice(offset, offset + dataCodewords);
      offset += dataCodewords;
      dataBlocks.push(block);
      ecBlocks.push(errorCorrection(block, ec));
    }
  }

  const out = [];
  const maxData = Math.max(...dataBlocks.map((b) => b.length));
  for (let i = 0; i < maxData; i++) {
    for (const block of dataBlocks) if (i < block.length) out.push(block[i]);
  }
  for (let i = 0; i < ec; i++) {
    for (const block of ecBlocks) out.push(block[i]);
  }
  return out;
}

/* ----------------------------------- matricea ----------------------------------- */

function emptyMatrix(size) {
  return {
    modules: Array.from({ length: size }, () => new Array(size).fill(false)),
    reserved: Array.from({ length: size }, () => new Array(size).fill(false)),
    size,
  };
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || cc < 0 || rr >= m.size || cc >= m.size) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6)) || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m.modules[rr][cc] = inRing || inCore;
      m.reserved[rr][cc] = true;
    }
  }
}

function placeAlignment(m, version) {
  const centers = ALIGNMENT[version];
  for (const row of centers) {
    for (const col of centers) {
      // Colturile ocupate de patratele de reper nu primesc marcaj de aliniere.
      if (m.reserved[row][col]) continue;
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          m.modules[row + r][col + c] = Math.max(Math.abs(r), Math.abs(c)) !== 1;
          m.reserved[row + r][col + c] = true;
        }
      }
    }
  }
}

function placeTiming(m) {
  for (let i = 8; i < m.size - 8; i++) {
    const dark = i % 2 === 0;
    if (!m.reserved[6][i]) { m.modules[6][i] = dark; m.reserved[6][i] = true; }
    if (!m.reserved[i][6]) { m.modules[i][6] = dark; m.reserved[i][6] = true; }
  }
}

function reserveFormat(m, version) {
  for (let i = 0; i < 9; i++) {
    m.reserved[8][i] = true;
    m.reserved[i][8] = true;
  }
  for (let i = 0; i < 8; i++) {
    m.reserved[8][m.size - 1 - i] = true;
    m.reserved[m.size - 1 - i][8] = true;
  }
  m.modules[m.size - 8][8] = true; // modulul intotdeauna negru
  m.reserved[m.size - 8][8] = true;

  if (version >= 7) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 3; j++) {
        m.reserved[i][m.size - 11 + j] = true;
        m.reserved[m.size - 11 + j][i] = true;
      }
    }
  }
}

function placeData(m, codewords) {
  const bits = [];
  for (const codeword of codewords) {
    for (let i = 7; i >= 0; i--) bits.push((codeword >> i) & 1);
  }

  let index = 0;
  let upward = true;
  for (let right = m.size - 1; right > 0; right -= 2) {
    if (right === 6) right -= 1; // coloana de sincronizare se sare
    for (let step = 0; step < m.size; step++) {
      const row = upward ? m.size - 1 - step : step;
      for (const col of [right, right - 1]) {
        if (m.reserved[row][col]) continue;
        m.modules[row][col] = index < bits.length ? bits[index] === 1 : false;
        index += 1;
      }
    }
    upward = !upward;
  }
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

function applyMask(m, maskId) {
  const masked = {
    size: m.size,
    reserved: m.reserved,
    modules: m.modules.map((row) => row.slice()),
  };
  for (let r = 0; r < m.size; r++) {
    for (let c = 0; c < m.size; c++) {
      if (!m.reserved[r][c] && MASKS[maskId](r, c)) {
        masked.modules[r][c] = !masked.modules[r][c];
      }
    }
  }
  return masked;
}

function formatBits(maskId) {
  const data = (EC_LEVEL_M << 3) | maskId;
  let value = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((value >> i) & 1) value ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | value) ^ 0b101010000010010;
}

function versionBits(version) {
  let value = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((value >> i) & 1) value ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | value;
}

function placeFormat(m, maskId, version) {
  const bits = formatBits(maskId);
  // Bitii se asaza in ordinea din standard, incepand cu cel mai semnificativ.
  const bit = (i) => ((bits >> (14 - i)) & 1) === 1;

  // Prima copie, in jurul patratului de reper din stanga sus.
  for (let i = 0; i <= 5; i++) m.modules[8][i] = bit(i);
  m.modules[8][7] = bit(6);
  m.modules[8][8] = bit(7);
  m.modules[7][8] = bit(8);
  for (let i = 9; i <= 14; i++) m.modules[14 - i][8] = bit(i);

  // A doua copie: 7 module in jos, la stanga, apoi 8 module spre dreapta sus.
  for (let i = 0; i <= 6; i++) m.modules[m.size - 1 - i][8] = bit(i);
  for (let i = 7; i <= 14; i++) m.modules[8][m.size - 8 + (i - 7)] = bit(i);
  m.modules[m.size - 8][8] = true;

  if (version >= 7) {
    const vBits = versionBits(version);
    for (let i = 0; i < 18; i++) {
      const on = ((vBits >> i) & 1) === 1;
      const row = Math.floor(i / 3);
      const col = m.size - 11 + (i % 3);
      m.modules[row][col] = on;
      m.modules[col][row] = on;
    }
  }
}

// Penalizarile din standard: cu cat mai mici, cu atat codul e mai usor de citit.
function penalty(m) {
  const { size, modules } = m;
  let score = 0;

  const runPenalty = (line) => {
    let run = 1;
    for (let i = 1; i < line.length; i++) {
      if (line[i] === line[i - 1]) {
        run += 1;
      } else {
        if (run >= 5) score += 3 + (run - 5);
        run = 1;
      }
    }
    if (run >= 5) score += 3 + (run - 5);
  };

  for (let r = 0; r < size; r++) runPenalty(modules[r]);
  for (let c = 0; c < size; c++) runPenalty(modules.map((row) => row[c]));

  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = modules[r][c];
      if (v === modules[r][c + 1] && v === modules[r + 1][c] && v === modules[r + 1][c + 1]) score += 3;
    }
  }

  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reversed = [...pattern].reverse();
  const matches = (line, start, target) => target.every((value, i) => line[start + i] === value);
  const scanLine = (line) => {
    for (let i = 0; i + 11 <= line.length; i++) {
      if (matches(line, i, pattern) || matches(line, i, reversed)) score += 40;
    }
  };
  for (let r = 0; r < size; r++) scanLine(modules[r]);
  for (let c = 0; c < size; c++) scanLine(modules.map((row) => row[c]));

  const dark = modules.flat().filter(Boolean).length;
  const ratio = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(ratio - 50) / 5) * 10;

  return score;
}

/* ----------------------------------- interfata ---------------------------------- */

export function qrMatrix(text) {
  const bytes = Array.from(Buffer.from(String(text), 'utf8'));
  const version = pickVersion(bytes.length);
  const codewords = interleave(encodeData(bytes, version), version);
  const size = version * 4 + 17;

  const base = emptyMatrix(size);
  placeFinder(base, 0, 0);
  placeFinder(base, 0, size - 7);
  placeFinder(base, size - 7, 0);
  placeAlignment(base, version);
  placeTiming(base);
  reserveFormat(base, version);
  placeData(base, codewords);

  let best = null;
  for (let maskId = 0; maskId < 8; maskId++) {
    const candidate = applyMask(base, maskId);
    placeFormat(candidate, maskId, version);
    const score = penalty(candidate);
    if (!best || score < best.score) best = { score, maskId, matrix: candidate };
  }

  return { size, version, mask: best.maskId, modules: best.matrix.modules };
}

export function qrSvg(text, { scale = 4, margin = 4, dark = '#000000', light = '#ffffff', title = '' } = {}) {
  const { modules, size } = qrMatrix(text);
  const total = (size + margin * 2) * scale;

  let path = '';
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (modules[r][c]) {
        path += `M${(c + margin) * scale} ${(r + margin) * scale}h${scale}v${scale}h-${scale}z`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${total}" height="${total}" viewBox="0 0 ${total} ${total}" role="img"${title ? ` aria-label="${title}"` : ' aria-hidden="true"'}>
<rect width="${total}" height="${total}" fill="${light}"/>
<path d="${path}" fill="${dark}"/>
</svg>`;
}
