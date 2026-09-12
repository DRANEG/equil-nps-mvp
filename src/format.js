// Datele se pastreaza in baza in UTC (asa scrie SQLite cu datetime('now')),
// dar se afiseaza mereu pe ora Romaniei si in formatul de aici: 12.09.2026, 08:30.
export const TIMEZONE = process.env.TIMEZONE || 'Europe/Bucharest';
export const LOCALE = process.env.LOCALE || 'ro-RO';

const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});
const dateFormat = new Intl.DateTimeFormat(LOCALE, {
  timeZone: TIMEZONE, day: '2-digit', month: '2-digit', year: 'numeric',
});
const monthFormat = new Intl.DateTimeFormat(LOCALE, { timeZone: TIMEZONE, month: 'short', year: '2-digit' });

// SQLite intoarce "2026-09-12 05:30:00" (UTC), fara marcaj de fus orar.
export function parseDbDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const text = String(value).trim();
  const iso = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(text)
    ? `${text.replace(' ', 'T')}${text.length === 16 ? ':00' : ''}Z`
    : text;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseDbDate(value);
  return date ? dateTimeFormat.format(date) : '';
}

export function formatDate(value) {
  const date = parseDbDate(value);
  return date ? dateFormat.format(date) : '';
}

// "2026-09" (gruparea lunara din SQL) -> "sep. 26"
export function formatMonth(yearMonth) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(yearMonth || ''));
  if (!match) return String(yearMonth || '');
  return monthFormat.format(new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 15, 12)));
}

// "acum 12 minute" conteaza mai mult decat ora exacta cand cineva tocmai a dat 2/10.
export function timeAgo(value, now = new Date()) {
  const date = parseDbDate(value);
  if (!date) return '';
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);
  if (seconds < 0) return 'chiar acum';
  if (seconds < 60) return 'acum câteva secunde';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `acum ${minutes} ${plural(minutes, 'minut', 'minute', 'de minute')}`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `acum ${hours} ${plural(hours, 'oră', 'ore', 'de ore')}`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'ieri';
  if (days < 30) return `acum ${days} ${plural(days, 'zi', 'zile', 'de zile')}`;
  return formatDate(date);
}

// Romana are trei forme: 1 minut, 2 minute, 20 de minute.
export function plural(n, unu, putine, multe) {
  const abs = Math.abs(n);
  if (abs === 1) return unu;
  if (abs % 100 === 0 || (abs % 100 >= 20 && abs % 100 <= 99) || abs >= 20) return multe;
  return putine;
}

// Numerele de telefon din Romania, aduse la forma internationala: 0721... -> +40721...
export function normalizePhone(value) {
  if (!value) return null;
  const raw = String(value).replace(/[\s.()-]/g, '');
  if (/^\+40\d{9}$/.test(raw)) return raw;
  if (/^0040\d{9}$/.test(raw)) return `+40${raw.slice(4)}`;
  if (/^0\d{9}$/.test(raw)) return `+40${raw.slice(1)}`;
  if (/^\+\d{8,15}$/.test(raw)) return raw; // alt prefix de tara, il lasam asa
  return null;
}

// Forma citibila pentru ecran: +40 721 234 567
export function formatPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return value ? String(value) : '';
  if (!phone.startsWith('+40') || phone.length !== 12) return phone;
  return `+40 ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
}
