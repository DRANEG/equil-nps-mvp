import { test } from 'node:test';
import assert from 'node:assert/strict';
import { categorize, summarize, marginOfError, label, isValidScore } from '../src/nps.js';

test('categorize respecta pragurile NPS', () => {
  assert.equal(categorize(0), 'detractor');
  assert.equal(categorize(6), 'detractor');
  assert.equal(categorize(7), 'passive');
  assert.equal(categorize(8), 'passive');
  assert.equal(categorize(9), 'promoter');
  assert.equal(categorize(10), 'promoter');
  assert.throws(() => categorize(11), RangeError);
  assert.throws(() => categorize(-1), RangeError);
  assert.throws(() => categorize(7.5), RangeError);
});

test('isValidScore accepta doar intregi 0-10', () => {
  assert.equal(isValidScore('9'), true);
  assert.equal(isValidScore(0), true);
  assert.equal(isValidScore('abc'), false);
  assert.equal(isValidScore(11), false);
  assert.equal(isValidScore(null), false);
});

test('summarize calculeaza NPS = %promotori - %detractori', () => {
  const s = summarize([{ score: 10 }, { score: 9 }, { score: 8 }, { score: 5 }]);
  assert.equal(s.total, 4);
  assert.equal(s.promoters, 2);
  assert.equal(s.passives, 1);
  assert.equal(s.detractors, 1);
  assert.equal(s.nps, 25); // 50% - 25%
  assert.equal(s.average, 8);
  assert.equal(s.distribution[10], 1);
});

test('summarize ignora scorurile invalide si trateaza lista goala', () => {
  const s = summarize([{ score: 9 }, { score: 42 }, { score: null }]);
  assert.equal(s.total, 1);
  assert.equal(s.nps, 100);

  const empty = summarize([]);
  assert.equal(empty.total, 0);
  assert.equal(empty.nps, null);
  assert.equal(empty.average, null);
});

test('marginOfError creste cand esantionul e mic', () => {
  const small = marginOfError(summarize([{ score: 10 }, { score: 0 }]));
  const big = marginOfError(summarize(Array.from({ length: 200 }, (_, i) => ({ score: i % 2 ? 10 : 0 }))));
  assert.ok(small > big);
  assert.equal(marginOfError(summarize([{ score: 9 }])), null);
});

test('label incadreaza scorul in praguri uzuale', () => {
  assert.equal(label(70), 'excelent');
  assert.equal(label(30), 'bun');
  assert.equal(label(5), 'de îmbunătățit');
  assert.equal(label(-10), 'critic');
  assert.equal(label(null), 'fără date');
});
