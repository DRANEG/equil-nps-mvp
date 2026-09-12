import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDbDate, formatDateTime, formatDate, formatMonth, timeAgo, plural,
  normalizePhone, formatPhone,
} from '../src/format.js';

test('data din baza (UTC) se afișează pe ora României', () => {
  // Iarna România e UTC+2, vara UTC+3.
  assert.equal(formatDateTime('2026-01-15 05:30:00'), '15.01.2026, 07:30');
  assert.equal(formatDateTime('2026-07-15 05:30:00'), '15.07.2026, 08:30');
  assert.equal(formatDate('2026-09-12 21:10:00'), '13.09.2026', 'după miezul nopții e deja ziua următoare');
});

test('valorile lipsă sau stricate nu produc erori', () => {
  for (const valoare of [null, undefined, '', 'text aiurea']) {
    assert.equal(formatDateTime(valoare), '');
    assert.equal(formatDate(valoare), '');
    assert.equal(timeAgo(valoare), '');
  }
  assert.equal(parseDbDate('2026-09-12 10:00:00').toISOString(), '2026-09-12T10:00:00.000Z');
});

test('luna se scrie scurt, românește', () => {
  assert.match(formatMonth('2026-09'), /sept\.? 26/);
  assert.equal(formatMonth('aiurea'), 'aiurea');
});

test('timpul relativ folosește formele corecte de plural', () => {
  const acum = new Date('2026-09-12T12:00:00Z');
  const cu = (minute) => timeAgo(new Date(acum.getTime() - minute * 60000), acum);
  assert.equal(cu(0.2), 'acum câteva secunde');
  assert.equal(cu(1), 'acum 1 minut');
  assert.equal(cu(5), 'acum 5 minute');
  assert.equal(cu(25), 'acum 25 de minute');
  assert.equal(cu(60), 'acum 1 oră');
  assert.equal(cu(180), 'acum 3 ore');
  assert.equal(cu(60 * 24), 'ieri');
  assert.equal(cu(60 * 24 * 3), 'acum 3 zile');
  assert.equal(cu(60 * 24 * 25), 'acum 25 de zile');
  assert.equal(cu(60 * 24 * 200), '24.02.2026', 'mai vechi de o lună: data exactă');
});

test('pluralul românesc: 1 / 2 / 20 de', () => {
  assert.equal(plural(1, 'zi', 'zile', 'de zile'), 'zi');
  assert.equal(plural(3, 'zi', 'zile', 'de zile'), 'zile');
  assert.equal(plural(19, 'zi', 'zile', 'de zile'), 'zile');
  assert.equal(plural(20, 'zi', 'zile', 'de zile'), 'de zile');
  assert.equal(plural(101, 'zi', 'zile', 'de zile'), 'de zile');
});

test('numerele de telefon românești ajung la forma +40', () => {
  for (const scris of ['0721234567', '0721 234 567', '0721.234.567', '+40721234567', '0040721234567', '+40 721 234 567']) {
    assert.equal(normalizePhone(scris), '+40721234567', scris);
  }
  assert.equal(formatPhone('0721234567'), '+40 721 234 567');
  assert.equal(normalizePhone('+33612345678'), '+33612345678', 'alt prefix de țară rămâne neatins');
  assert.equal(normalizePhone('123'), null);
  assert.equal(normalizePhone(''), null);
  assert.equal(formatPhone(null), '');
});

test('exportul CSV e gata pentru Excel românesc', async () => {
  const { toCsv } = await import('../src/http.js');
  const csv = toCsv([
    { data: '12.09.2026, 08:30', nume: 'Ion Popescu', comentariu: 'Bun; dar scump', scor: 9 },
    { data: '13.09.2026, 09:00', nume: 'Ană Ștefănescu', comentariu: 'Zice "merge"', scor: 3 },
  ]);

  assert.equal(csv.charCodeAt(0), 0xfeff, 'BOM, ca diacriticele să nu se strice');
  const linii = csv.split('\r\n');
  assert.equal(linii[0], '﻿data;nume;comentariu;scor');
  assert.equal(linii[1], '12.09.2026, 08:30;Ion Popescu;"Bun; dar scump";9');
  assert.match(linii[2], /Ană Ștefănescu/);
  assert.match(linii[2], /"Zice ""merge"""/);
  assert.equal(csv.endsWith('\r\n'), true);
  assert.equal(toCsv([]), '﻿');
});
