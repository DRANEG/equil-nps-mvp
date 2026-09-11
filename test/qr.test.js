import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { qrMatrix, qrSvg } from '../src/qr.js';

const art = (m) => m.modules.map((row) => row.map((v) => (v ? '#' : '.')).join('')).join('\n');
const hash = (m) => createHash('sha256').update(art(m)).digest('hex').slice(0, 16);

// Matricea de referinta pentru textul "a" (versiunea 1). A fost verificata
// modul cu modul fata de o implementare independenta si decodata cu jsQR.
const FIXTURE_A = `#######..#.##.#######
#.....#.#.##..#.....#
#.###.#.##.#..#.###.#
#.###.#.#.##..#.###.#
#.###.#..#..#.#.###.#
#.....#...##..#.....#
#######.#.#.#.#######
........##...........
#.....#.#.##.##..###.
#..##......###.###..#
..#.###..##.#.##.....
.#.#.#.##..#####.#.#.
##.#..####.##########
........##..#.....#.#
#######..###.#..####.
#.....#...#...#...###
#.###.#..###.#..###..
#.###.#..#.#####.#...
#.###.#..#.###.###.##
#.....#...######.#...
#######.#.#.#..#..##.`;

test('codul QR pentru "a" este identic cu matricea verificata', () => {
  assert.equal(art(qrMatrix('a')), FIXTURE_A);
});

// Hashuri fixate pentru linkurile tipice: prind orice regresie in codificare,
// corectia de erori, masca sau asezarea in matrice.
test('linkurile uzuale produc exact aceleasi coduri ca la verificare', () => {
  const cazuri = [
    ['https://nps.equil.ro/s/demo-nps', 3, 2, '3d9f5757ac3c9cd6'],
    ['https://nps.equil.ro/s/demo-nps?loc=centru-vechi', 4, 2, 'c710fb16edc5bce1'],
    ['ăîâșț diacritice', 2, 7, '8add8f3a5bd788ed'],
  ];
  for (const [text, version, mask, expected] of cazuri) {
    const m = qrMatrix(text);
    assert.equal(m.version, version, `versiune pentru ${text}`);
    assert.equal(m.mask, mask, `masca pentru ${text}`);
    assert.equal(hash(m), expected, `matrice pentru ${text}`);
  }
});

test('versiunea creste cu lungimea textului, iar dimensiunea urmeaza formula', () => {
  const scurt = qrMatrix('x'.repeat(20));
  const lung = qrMatrix('x'.repeat(300));
  assert.ok(lung.version > scurt.version);
  for (const m of [scurt, lung]) {
    assert.equal(m.size, m.version * 4 + 17);
    assert.equal(m.modules.length, m.size);
    assert.equal(m.modules[0].length, m.size);
  }
});

test('cele trei patrate de reper sunt la locul lor', () => {
  const { modules, size } = qrMatrix('https://exemplu.ro');
  const finder = (row, col) => {
    for (const [r, c, asteptat] of [
      [0, 0, true], [0, 3, true], [3, 3, true], [1, 1, false], [3, 1, false], [6, 6, true],
    ]) {
      assert.equal(modules[row + r][col + c], asteptat, `reper la ${row},${col} modul ${r},${c}`);
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);
  // Separatoarele albe din jurul reperelor.
  assert.equal(modules[7][0], false);
  assert.equal(modules[0][7], false);
});

test('textul prea lung este respins explicit', () => {
  assert.throws(() => qrMatrix('x'.repeat(600)), /prea lung/);
});

test('SVG-ul are zona alba de garda si un singur traseu negru', () => {
  const svg = qrSvg('https://exemplu.ro/s/test', { scale: 4, margin: 4 });
  const { size } = qrMatrix('https://exemplu.ro/s/test');
  const latura = (size + 8) * 4;
  assert.match(svg, new RegExp(`width="${latura}" height="${latura}"`));
  assert.match(svg, /<rect width="\d+" height="\d+" fill="#ffffff"\/>/);
  assert.equal((svg.match(/<path/g) || []).length, 1);
  // Primul modul negru nu incepe lipit de margine, ci dupa zona de garda.
  assert.match(svg, /d="M16 16h4/);
});
