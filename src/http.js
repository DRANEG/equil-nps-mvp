import { timingSafeEqual, createHmac } from 'node:crypto';

export function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'text/plain; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

export function html(res, status, body, headers = {}) {
  send(res, status, body, { 'Content-Type': 'text/html; charset=utf-8', ...headers });
}

export function json(res, status, data, headers = {}) {
  send(res, status, JSON.stringify(data), {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
}

export function redirect(res, location, headers = {}) {
  res.writeHead(302, { Location: location, ...headers });
  res.end();
}

export function csv(res, filename, rows) {
  send(res, 200, toCsv(rows), {
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
}

// Excel-ul romanesc asteapta punct-si-virgula ca separator de liste si are
// nevoie de marcajul BOM ca sa citeasca diacriticele. Fara ele, exportul se
// deschide intr-o singura coloana, cu "Ã¢" in loc de "â".
export const CSV_BOM = '\uFEFF';

export function toCsv(rows, { separator = process.env.CSV_SEPARATOR || ';', bom = true } = {}) {
  if (!rows.length) return bom ? CSV_BOM : '';
  const cols = Object.keys(rows[0]);
  const needsQuotes = new RegExp(`["\\n\\r${separator === '\t' ? '\\t' : separator}]`);
  const cell = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return needsQuotes.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [
    cols.join(separator),
    ...rows.map((r) => cols.map((c) => cell(r[c])).join(separator)),
  ];
  // Sfarsit de linie CRLF: asa se asteapta Excel pe Windows.
  return (bom ? CSV_BOM : '') + lines.join('\r\n') + '\r\n';
}

// Corpul unei cereri, limitat ca marime pentru a nu tine memoria ocupata.
export async function readBody(req, limit = 1_000_000) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('Corpul cererii este prea mare');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

export async function readForm(req) {
  const body = await readBody(req);
  const type = req.headers['content-type'] || '';
  if (type.includes('application/json')) {
    try {
      return JSON.parse(body || '{}');
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(body));
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return out;
}

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Cookie-ul de sesiune admin: valoarea nu contine parola, ci un HMAC al ei.
export function sessionValue(adminToken) {
  return createHmac('sha256', adminToken).update('equil-nps-admin-session').digest('hex');
}

export function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
