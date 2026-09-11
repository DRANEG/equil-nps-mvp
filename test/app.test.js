import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { openDb, createCampaign, upsertContact, createInvite } from '../src/db.js';
import { createApp } from '../src/server.js';
import { sessionValue } from '../src/http.js';
import { parseContacts } from '../src/routes/admin.js';

const ADMIN_TOKEN = 'parola-test';
let server;
let base;
let db;
let campaign;
let invite;

before(async () => {
  db = openDb(':memory:');
  campaign = createCampaign(db, { name: 'Test NPS', slug: 'test-nps' });
  const contact = upsertContact(db, { email: 'ana@client.ro', name: 'Ana', segment: 'Enterprise' });
  invite = createInvite(db, campaign.id, contact.id);
  server = createServer(createApp({ db, adminToken: ADMIN_TOKEN, publicUrl: 'http://localhost' }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const authHeaders = () => ({ cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` });

test('sondajul public se incarca dupa slug', async () => {
  const res = await fetch(`${base}/s/test-nps`);
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /Test NPS/);
  assert.match(body, /name="score" value="10"/);
});

test('linkul personalizat afiseaza numele si preselecteaza scorul din email', async () => {
  const res = await fetch(`${base}/r/${invite.token}?scor=9`);
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /Salut, Ana!/);
  assert.match(body, /value="9" required checked/);
});

test('linkul invalid intoarce 404', async () => {
  assert.equal((await fetch(`${base}/r/token-inexistent`)).status, 404);
  assert.equal((await fetch(`${base}/s/campanie-inexistenta`)).status, 404);
});

test('trimiterea formularului salveaza raspunsul si redirectioneaza', async () => {
  const res = await fetch(`${base}/raspunde`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: invite.token, score: '9', comment: 'Merge bine' }),
    redirect: 'manual',
  });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/multumim?scor=9');

  const row = db.prepare('SELECT * FROM responses WHERE invite_id = ?').get(invite.id);
  assert.equal(row.score, 9);
  assert.equal(row.category, 'promoter');
  assert.equal(row.comment, 'Merge bine');
  const updated = db.prepare('SELECT responded_at FROM invites WHERE id = ?').get(invite.id);
  assert.ok(updated.responded_at);
});

test('al doilea raspuns pe acelasi link il actualizeaza pe primul', async () => {
  await fetch(`${base}/raspunde`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: invite.token, score: '4', comment: '' }),
    redirect: 'manual',
  });
  const rows = db.prepare('SELECT * FROM responses WHERE invite_id = ?').all(invite.id);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].score, 4);
  assert.equal(rows[0].category, 'detractor');
  assert.equal(rows[0].comment, 'Merge bine', 'comentariul vechi se pastreaza daca noul e gol');
});

test('API-ul JSON accepta raspunsuri anonime si respinge scoruri invalide', async () => {
  const ok = await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'test-nps', score: 10, comment: 'din widget' }),
  });
  assert.equal(ok.status, 201);
  const payload = await ok.json();
  assert.equal(payload.category, 'promoter');

  const bad = await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'test-nps', score: 42 }),
  });
  assert.equal(bad.status, 400);
  assert.equal((await bad.json()).ok, false);
});

test('campania inchisa nu mai primeste raspunsuri', async () => {
  const closed = createCampaign(db, { name: 'Inchisa', slug: 'inchisa' });
  db.prepare('UPDATE campaigns SET active = 0 WHERE id = ?').run(closed.id);
  assert.equal((await fetch(`${base}/s/inchisa`)).status, 410);
  const res = await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'inchisa', score: 9 }),
  });
  assert.equal(res.status, 400);
});

test('zona admin cere autentificare', async () => {
  const res = await fetch(`${base}/admin`, { redirect: 'manual' });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get('location'), '/admin/login');

  const bad = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: 'gresit' }),
    redirect: 'manual',
  });
  assert.equal(bad.headers.get('location'), '/admin/login?eroare=1');

  const good = await fetch(`${base}/admin/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ token: ADMIN_TOKEN }),
    redirect: 'manual',
  });
  assert.equal(good.headers.get('location'), '/admin');
  assert.match(good.headers.get('set-cookie'), /HttpOnly/);
});

test('dashboardul afiseaza scorul si comentariile', async () => {
  const res = await fetch(`${base}/admin`, { headers: authHeaders() });
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(body, /Scor NPS/);
  assert.match(body, /Merge bine/);
  assert.match(body, /Enterprise/);
});

test('exportul CSV contine antetul si raspunsurile', async () => {
  const res = await fetch(`${base}/admin/raspunsuri.csv`, { headers: authHeaders() });
  const body = await res.text();
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-disposition'), /raspunsuri-nps\.csv/);
  assert.match(body.split('\n')[0], /^data,campanie,scor,categorie/);
  assert.match(body, /ana@client\.ro/);
});

test('adaugarea contactelor genereaza linkuri unice', async () => {
  const res = await fetch(`${base}/admin/campanii/${campaign.id}/invitatii`, {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ contacts: 'nou@client.ro, Nou Client, Firma SRL, IMM\ninvalid-fara-email' }),
    redirect: 'manual',
  });
  assert.equal(res.status, 302);
  const row = db
    .prepare('SELECT i.token FROM invites i JOIN contacts c ON c.id = i.contact_id WHERE c.email = ?')
    .get('nou@client.ro');
  assert.ok(row.token.length > 10);
});

test('parseContacts ignora liniile fara email', () => {
  const parsed = parseContacts('a@b.ro, Ana, Firma, IMM\n\nfara-email\nc@d.ro');
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], { email: 'a@b.ro', name: 'Ana', company: 'Firma', segment: 'IMM' });
  assert.equal(parsed[1].email, 'c@d.ro');
});

test('escapeHtml previne injectarea din comentarii', async () => {
  await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'test-nps', score: 2, comment: '<script>alert(1)</script>' }),
  });
  const body = await (await fetch(`${base}/admin/raspunsuri`, { headers: authHeaders() })).text();
  assert.ok(!body.includes('<script>alert(1)</script>'));
  assert.match(body, /&lt;script&gt;/);
});
