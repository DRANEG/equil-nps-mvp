import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, createCampaign } from '../src/db.js';
import { createApp } from '../src/server.js';
import { resetSubmitLimit } from '../src/routes/public.js';
import { resetLoginLimit } from '../src/routes/admin.js';

const ADMIN_TOKEN = 'parola-lunga-de-test';
let db;
let server;
let base;

before(async () => {
  db = openDb(':memory:');
  createCampaign(db, { name: 'Test', slug: 'test' });
  server = createServer(createApp({ db, adminToken: ADMIN_TOKEN, publicUrl: 'http://localhost' }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const formHeaders = { 'content-type': 'application/x-www-form-urlencoded' };

test('parola de admin nu poate fi ghicită prin încercări repetate', async () => {
  const gresit = () =>
    fetch(`${base}/admin/login`, {
      method: 'POST',
      headers: formHeaders,
      body: new URLSearchParams({ token: 'gresit' }),
      redirect: 'manual',
    });

  for (let i = 0; i < 5; i++) {
    assert.equal((await gresit()).headers.get('location'), '/admin/login?eroare=1', `încercarea ${i + 1}`);
  }

  const blocat = await gresit();
  assert.equal(blocat.headers.get('location'), '/admin/login?eroare=prea-multe');

  // Chiar și cu parola corectă rămâne blocat cât ține pedeapsa.
  const corect = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({ token: ADMIN_TOKEN }),
    redirect: 'manual',
  });
  assert.equal(corect.headers.get('location'), '/admin/login?eroare=prea-multe');

  const pagina = await (await fetch(`${base}/admin/login?eroare=prea-multe`)).text();
  assert.match(pagina, /Prea multe încercări greșite/);
});

test('cookie-ul de sesiune primește Secure doar pe HTTPS', async (t) => {
  // Testul anterior a epuizat încercările pentru acest IP.
  resetLoginLimit();

  const httpsServer = createServer(
    createApp({ db, adminToken: ADMIN_TOKEN, publicUrl: 'https://nps.firma.ro' }),
  );
  await new Promise((r) => httpsServer.listen(0, r));
  t.after(() => httpsServer.close());
  const httpsBase = `http://localhost:${httpsServer.address().port}`;

  const peHttps = await fetch(`${httpsBase}/admin/login`, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({ token: ADMIN_TOKEN }),
    redirect: 'manual',
  });
  const cookie = peHttps.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Secure/, 'pe HTTPS cookie-ul trebuie marcat Secure');

  resetLoginLimit();
  const peHttp = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({ token: ADMIN_TOKEN }),
    redirect: 'manual',
  });
  assert.ok(
    !/Secure/.test(peHttp.headers.get('set-cookie')),
    'pe http://localhost, Secure ar face cookie-ul inutilizabil',
  );
});

test('un cod QR nu poate fi folosit ca să umpli baza cu răspunsuri', async () => {
  resetSubmitLimit();
  const trimite = () =>
    fetch(`${base}/api/raspunsuri`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'test', score: 10 }),
    });

  for (let i = 0; i < 10; i++) {
    assert.equal((await trimite()).status, 201, `răspunsul ${i + 1} trebuie acceptat`);
  }

  const blocat = await trimite();
  assert.equal(blocat.status, 429);
  assert.ok(Number(blocat.headers.get('retry-after')) > 0);
  assert.equal((await blocat.json()).ok, false);

  const dinFormular = await fetch(`${base}/raspunde`, {
    method: 'POST',
    headers: formHeaders,
    body: new URLSearchParams({ slug: 'test', score: '9' }),
    redirect: 'manual',
  });
  assert.equal(dinFormular.status, 429);
  assert.match(await dinFormular.text(), /Prea multe răspunsuri/);

  resetSubmitLimit();
  assert.equal((await trimite()).status, 201, 'după limită, trimiterile normale continuă');
});

test('paginile administrative nu sunt indexate și nu ghicesc tipul conținutului', async () => {
  const res = await fetch(`${base}/s/test`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.match(await res.text(), /<meta name="robots" content="noindex">/);
});

test('comentariile rămân text, nu cod', async () => {
  resetSubmitLimit();
  await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'test', score: 1, comment: '<img src=x onerror=alert(1)>' }),
  });
  const { sessionValue } = await import('../src/http.js');
  const pagina = await (
    await fetch(`${base}/admin/alerte`, { headers: { cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` } })
  ).text();
  assert.ok(!pagina.includes('<img src=x onerror=alert(1)>'));
  assert.match(pagina, /&lt;img src=x onerror=alert\(1\)&gt;/);
  resetSubmitLimit();
});
