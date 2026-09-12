import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  orthodoxEaster, romanianHolidays, holidayName, canSendNow, localParts, describeWindow,
} from '../src/calendar.js';
import { openDb, createCampaign, upsertContact, createInvite } from '../src/db.js';
import { runSendPass } from '../src/scheduler.js';

// Datele reale ale Paștelui ortodox, pentru mai mulți ani.
const PASTE = {
  2020: '2020-04-19', 2021: '2021-05-02', 2022: '2022-04-24', 2023: '2023-04-16',
  2024: '2024-05-05', 2025: '2025-04-20', 2026: '2026-04-12', 2027: '2027-05-02',
  2028: '2028-04-16', 2029: '2029-04-08', 2030: '2030-04-28',
};

test('Paștele ortodox este calculat corect', () => {
  for (const [an, data] of Object.entries(PASTE)) {
    assert.equal(orthodoxEaster(Number(an)).toISOString().slice(0, 10), data, `Paștele ${an}`);
  }
});

test('sărbătorile legale românești includ zilele fixe și pe cele mobile', () => {
  const zile = romanianHolidays(2026);
  assert.equal(zile.get('2026-01-01'), 'Anul Nou');
  assert.equal(zile.get('2026-01-02'), 'Anul Nou');
  assert.equal(zile.get('2026-01-24'), 'Unirea Principatelor Române');
  assert.equal(zile.get('2026-05-01'), 'Ziua Muncii');
  assert.equal(zile.get('2026-12-01'), 'Ziua Națională');
  assert.equal(zile.get('2026-12-25'), 'Crăciunul');

  // Mobile, raportate la Paștele din 12 aprilie 2026
  assert.equal(zile.get('2026-04-10'), 'Vinerea Mare');
  assert.equal(zile.get('2026-04-12'), 'Paștele');
  assert.equal(zile.get('2026-04-13'), 'Paștele (a doua zi)');
  assert.equal(zile.get('2026-05-31'), 'Rusaliile');
  // În 2026, a doua zi de Rusalii cade exact pe 1 iunie: păstrăm ambele denumiri.
  assert.equal(zile.get('2026-06-01'), 'Ziua Copilului și Rusaliile (a doua zi)');
  assert.equal(zile.get('2026-03-15'), undefined);

  // Într-un an fără suprapunere, denumirile rămân simple.
  assert.equal(romanianHolidays(2027).get('2027-06-01'), 'Ziua Copilului');
});

test('ziua se judecă după ceasul din România, nu după UTC', () => {
  // 23:30 UTC pe 31 decembrie = deja 1 ianuarie în România (UTC+2).
  assert.equal(holidayName(new Date('2025-12-31T23:30:00Z')), 'Anul Nou');
  assert.equal(localParts(new Date('2026-07-15T22:30:00Z')).zi, '2026-07-16', 'vara e UTC+3');
});

const program = { oraStart: 9, oraStop: 20, saritWeekend: true, saritSarbatori: true };

test('robotul trimite doar în timpul zilei, în zile lucrătoare', () => {
  // Vineri, 11 septembrie 2026: ora 10:00 în România (07:00 UTC vara).
  assert.deepEqual(canSendNow(new Date('2026-09-11T07:00:00Z'), program), { ok: true });

  const noaptea = canSendNow(new Date('2026-09-11T01:00:00Z'), program);
  assert.equal(noaptea.ok, false);
  assert.match(noaptea.motiv, /în afara intervalului 9:00–20:00/);

  const seara = canSendNow(new Date('2026-09-11T18:30:00Z'), program); // 21:30 ora României
  assert.equal(seara.ok, false);

  const sambata = canSendNow(new Date('2026-09-12T09:00:00Z'), program);
  assert.equal(sambata.ok, false);
  assert.equal(sambata.motiv, 'weekend');

  const paste = canSendNow(new Date('2026-04-13T09:00:00Z'), program);
  assert.equal(paste.ok, false);
  assert.match(paste.motiv, /Paștele \(a doua zi\)/);
});

test('restricțiile se pot opri din configurare', () => {
  const oricand = { oraStart: 0, oraStop: 24, saritWeekend: false, saritSarbatori: false };
  assert.deepEqual(canSendNow(new Date('2026-12-25T23:00:00Z'), oricand), { ok: true });
  assert.match(describeWindow(program), /9:00–20:00, fără weekend, fără sărbători legale/);
});

test('robotul amână trimiterea în afara programului, butonul manual nu', async () => {
  const db = openDb(':memory:');
  const campanie = createCampaign(db, { name: 'Q1', slug: 'q1' });
  const contact = upsertContact(db, { email: 'ana@client.ro', name: 'Ana' });
  createInvite(db, campanie.id, contact.id);

  const mailer = { mode: 'test', description: 'test', trimise: [], async send(m) { this.trimise.push(m); return { id: '1', transport: 'test' }; } };
  const comun = { mailer, publicUrl: 'https://x', delayMinutes: 0, throttleMs: 0 };
  const craciun = new Date('2026-12-25T10:00:00Z');

  const robot = await runSendPass(db, { ...comun, sendWindow: program, now: craciun });
  assert.equal(robot.invitatii, 0);
  assert.match(robot.oprit, /în afara programului de trimitere \(sărbătoare legală: Crăciunul\)/);
  assert.equal(mailer.trimise.length, 0);

  const manual = await runSendPass(db, { ...comun, onlyAutoSend: false });
  assert.equal(manual.invitatii, 1, 'butonul „Trimite acum” ignoră programul');
});
