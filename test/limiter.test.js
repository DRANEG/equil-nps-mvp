import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLimiter, clientIp } from '../src/limiter.js';

test('limitatorul oprește după numărul stabilit de încercări', () => {
  const l = createLimiter({ max: 3, windowMs: 60_000 });
  const t = 1_000_000;
  assert.equal(l.hit('1.2.3.4', t).ok, true);
  assert.equal(l.hit('1.2.3.4', t + 10).ok, true);
  assert.equal(l.hit('1.2.3.4', t + 20).ok, true);

  const depasit = l.hit('1.2.3.4', t + 30);
  assert.equal(depasit.ok, false);
  assert.ok(depasit.retryAfterSec > 0 && depasit.retryAfterSec <= 60);

  assert.equal(l.hit('5.6.7.8', t + 30).ok, true, 'alt IP nu e afectat');
});

test('fereastra se golește pe măsură ce trece timpul', () => {
  const l = createLimiter({ max: 2, windowMs: 1000 });
  const t = 500_000;
  l.hit('ip', t);
  l.hit('ip', t);
  assert.equal(l.hit('ip', t + 100).ok, false);
  assert.equal(l.hit('ip', t + 1500).ok, true, 'după fereastră, încercările vechi nu mai contează');
});

test('check nu consumă încercări, reset le șterge', () => {
  const l = createLimiter({ max: 1, windowMs: 60_000 });
  assert.equal(l.check('ip').ok, true);
  assert.equal(l.check('ip').ok, true);
  l.hit('ip');
  assert.equal(l.check('ip').ok, false);
  l.reset('ip');
  assert.equal(l.check('ip').ok, true);
});

test('IP-ul din X-Forwarded-For se ia doar când proxy-ul e de încredere', () => {
  const req = {
    headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1' },
    socket: { remoteAddress: '10.0.0.1' },
  };
  assert.equal(clientIp(req, { trustProxy: false }), '10.0.0.1', 'implicit nu credem antetul');
  assert.equal(clientIp(req, { trustProxy: true }), '203.0.113.9');
  assert.equal(clientIp({ headers: {}, socket: {} }), 'necunoscut');
});
