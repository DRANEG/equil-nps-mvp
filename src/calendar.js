// Cand NU trimitem emailuri: noaptea, in weekend si de sarbatorile legale din
// Romania. Un sondaj primit duminica la 2 noaptea sau in prima zi de Paste nu
// primeste raspuns, dar lasa impresia proasta.
import { TIMEZONE } from './format.js';

const partsFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
});

// Momentul, vazut pe ceasul din Romania: { zi: '2026-09-12', ora: 8, zileSaptamana: 6 }
export function localParts(date = new Date()) {
  const parts = Object.fromEntries(
    partsFormat.formatToParts(date).map((p) => [p.type, p.value]),
  );
  const zileSaptamana = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return {
    zi: `${parts.year}-${parts.month}-${parts.day}`,
    an: Number(parts.year),
    ora: Number(parts.hour) % 24,
    minut: Number(parts.minute),
    zileSaptamana, // 0 = duminica, 6 = sambata
  };
}

// Pastele ortodox, dupa algoritmul lui Meeus pentru calendarul iulian, adus in
// calendarul gregorian prin adaugarea diferentei de 13 zile (valabil 1900-2099).
export function orthodoxEaster(year) {
  const a = year % 4;
  const b = year % 7;
  const c = year % 19;
  const d = (19 * c + 15) % 30;
  const e = (2 * a + 4 * b - d + 34) % 7;
  const month = Math.floor((d + e + 114) / 31); // 3 = martie, 4 = aprilie
  const day = ((d + e + 114) % 31) + 1;
  const iulian = Date.UTC(year, month - 1, day);
  return new Date(iulian + 13 * 24 * 3600 * 1000);
}

const zi = (date) => date.toISOString().slice(0, 10);
const plusZile = (date, n) => new Date(date.getTime() + n * 24 * 3600 * 1000);

// Sarbatorile legale din Codul Muncii (art. 139), inclusiv cele mobile.
export function romanianHolidays(year) {
  const paste = orthodoxEaster(year);
  const fixe = [
    ['01-01', 'Anul Nou'],
    ['01-02', 'Anul Nou'],
    ['01-06', 'Bobotează'],
    ['01-07', 'Sfântul Ion'],
    ['01-24', 'Unirea Principatelor Române'],
    ['05-01', 'Ziua Muncii'],
    ['06-01', 'Ziua Copilului'],
    ['08-15', 'Adormirea Maicii Domnului'],
    ['11-30', 'Sfântul Andrei'],
    ['12-01', 'Ziua Națională'],
    ['12-25', 'Crăciunul'],
    ['12-26', 'Crăciunul'],
  ];

  const zile = new Map();
  // Sarbatorile mobile pot cadea peste cele fixe (in 2026, a doua zi de Rusalii
  // este chiar 1 iunie), asa ca pastram ambele denumiri.
  const adauga = (data, nume) => {
    const existent = zile.get(data);
    zile.set(data, existent ? `${existent} și ${nume}` : nume);
  };

  for (const [md, nume] of fixe) adauga(`${year}-${md}`, nume);
  adauga(zi(plusZile(paste, -2)), 'Vinerea Mare');
  adauga(zi(paste), 'Paștele');
  adauga(zi(plusZile(paste, 1)), 'Paștele (a doua zi)');
  adauga(zi(plusZile(paste, 49)), 'Rusaliile');
  adauga(zi(plusZile(paste, 50)), 'Rusaliile (a doua zi)');
  return zile;
}

export function holidayName(date = new Date()) {
  const { zi: ziLocala, an } = localParts(date);
  return romanianHolidays(an).get(ziLocala) || null;
}

export function sendWindowFromEnv(env = process.env) {
  const [de, pana] = String(env.SEND_HOURS || '9-20')
    .split('-')
    .map((n) => Number(n.trim()));
  return {
    oraStart: Number.isFinite(de) ? de : 9,
    oraStop: Number.isFinite(pana) ? pana : 20,
    saritWeekend: env.SEND_SKIP_WEEKENDS !== '0',
    saritSarbatori: env.SEND_SKIP_HOLIDAYS !== '0',
  };
}

// Intoarce { ok: true } sau motivul pentru care asteptam.
export function canSendNow(date = new Date(), window = sendWindowFromEnv()) {
  const { ora, zileSaptamana } = localParts(date);

  if (ora < window.oraStart || ora >= window.oraStop) {
    return { ok: false, motiv: `în afara intervalului ${window.oraStart}:00–${window.oraStop}:00` };
  }
  if (window.saritWeekend && (zileSaptamana === 0 || zileSaptamana === 6)) {
    return { ok: false, motiv: 'weekend' };
  }
  if (window.saritSarbatori) {
    const sarbatoare = holidayName(date);
    if (sarbatoare) return { ok: false, motiv: `sărbătoare legală: ${sarbatoare}` };
  }
  return { ok: true };
}

export function describeWindow(window = sendWindowFromEnv()) {
  const parti = [`${window.oraStart}:00–${window.oraStop}:00`];
  if (window.saritWeekend) parti.push('fără weekend');
  if (window.saritSarbatori) parti.push('fără sărbători legale');
  return parti.join(', ');
}
