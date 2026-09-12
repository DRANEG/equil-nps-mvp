import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  openDb, createCampaign, upsertContact, createInvite, saveResponse, addStandardQuestions,
  saveAnswers, listResponses, getInviteByToken,
} from '../src/db.js';
import {
  operatorFromEnv, operatorConfigurat, findContactByEmail, exportContactData,
  anonymizeContact, eraseComments, runRetention,
} from '../src/gdpr.js';
import { createApp } from '../src/server.js';
import { sessionValue } from '../src/http.js';

const ADMIN_TOKEN = 'parola-test';
let db;
let server;
let base;
let campanie;
let contact;
let invite;

before(async () => {
  db = openDb(':memory:');
  campanie = createCampaign(db, { name: 'NPS', slug: 'nps' });
  const intrebari = addStandardQuestions(db, campanie.id);
  contact = upsertContact(db, {
    email: 'ana@client.ro', name: 'Ana Pop', company: 'Client SRL', phone: '0721234567',
  });
  invite = createInvite(db, campanie.id, contact.id);
  const raspuns = saveResponse(db, {
    campaignId: campanie.id, inviteId: invite.id, contactId: contact.id,
    score: 4, category: 'detractor', comment: 'Sunt Ana de la Client SRL și am o problemă.',
  });
  saveAnswers(db, raspuns.id, [{ questionId: intrebari[0].id, value: '2' }]);

  server = createServer(createApp({ db, adminToken: ADMIN_TOKEN, publicUrl: 'http://localhost' }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const authHeaders = () => ({ cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` });

test('configurarea operatorului se citește din mediu', () => {
  const gol = operatorFromEnv({});
  assert.equal(operatorConfigurat(gol), false);
  assert.equal(gol.luniRetentie, 24);

  const plin = operatorFromEnv({
    OPERATOR_NAME: 'Firma Ta SRL', OPERATOR_CUI: 'RO12345678',
    OPERATOR_EMAIL: 'contact@firma.ro', DATA_RETENTION_MONTHS: '12',
  });
  assert.equal(operatorConfigurat(plin), true);
  assert.equal(plin.luniRetentie, 12);
});

test('nota de informare este publică și acoperă cerințele art. 13', async () => {
  const pagina = await (await fetch(`${base}/confidentialitate`)).text();
  for (const bucata of [
    'Cine prelucrează datele', 'Ce date colectăm', 'De ce le prelucrăm', 'interesul legitim',
    'Cât timp le păstrăm', 'Drepturile tale', 'ANSPDCP', 'dataprotection.ro',
  ]) {
    assert.match(pagina, new RegExp(bucata), bucata);
  }
});

test('exportul de date cuprinde tot ce știm despre o persoană', () => {
  const date = exportContactData(db, contact.id);
  assert.equal(date.contact.email, 'ana@client.ro');
  assert.equal(date.contact.telefon, '+40721234567');
  assert.equal(date.invitatii.length, 1);
  assert.equal(date.raspunsuri.length, 1);
  assert.equal(date.raspunsuri[0].score, 4);
  assert.equal(date.raspunsuri[0].raspunsuri[0].raspuns, '2', 'inclusiv întrebările suplimentare');
});

test('exportul din interfață vine ca fișier JSON', async () => {
  const res = await fetch(`${base}/admin/date-personale/export?email=ana@client.ro`, { headers: authHeaders() });
  assert.equal(res.status, 200);
  // Numele fisierului e curatat de caractere care ar putea deranja sistemul de fisiere.
  assert.match(res.headers.get('content-disposition'), /date-ana_client\.ro\.json/);
  const date = await res.json();
  assert.equal(date.contact.nume, 'Ana Pop');
  assert.ok(date.exportat_la);

  const lipsa = await fetch(`${base}/admin/date-personale/export?email=nimeni@nicaieri.ro`, { headers: authHeaders() });
  assert.equal(lipsa.status, 404);
});

test('ștergerea scoate persoana, dar păstrează statistica', async () => {
  const inainte = listResponses(db, {}).length;
  const res = await fetch(`${base}/admin/date-personale/sterge`, {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ email: 'ana@client.ro' }),
    redirect: 'manual',
  });
  assert.equal(res.status, 302);
  assert.match(decodeURIComponent(res.headers.get('location')), /au fost șterse/);

  assert.equal(findContactByEmail(db, 'ana@client.ro'), undefined, 'contactul nu mai există');
  const raspunsuri = listResponses(db, {});
  assert.equal(raspunsuri.length, inainte, 'răspunsul rămâne pentru statistică');
  assert.equal(raspunsuri[0].contact_id, null);
  assert.equal(raspunsuri[0].email, null);
  assert.equal(raspunsuri[0].source, 'anonimizat');
  assert.equal(getInviteByToken(db, invite.token), undefined, 'linkul personal nu mai funcționează');
});

test('clientul își poate șterge singur datele din linkul primit pe email', async () => {
  const c = upsertContact(db, { email: 'singur@client.ro', name: 'Singur' });
  const i = createInvite(db, campanie.id, c.id);
  saveResponse(db, { campaignId: campanie.id, inviteId: i.id, contactId: c.id, score: 9, category: 'promoter' });

  const pagina = await (await fetch(`${base}/dezabonare/${i.token}`)).text();
  assert.match(pagina, /Șterge-mi datele/);
  assert.match(pagina, /href="\/confidentialitate"/);

  const res = await fetch(`${base}/sterge-date/${i.token}`, { method: 'POST' });
  assert.equal(res.status, 200);
  assert.match(await res.text(), /Datele au fost șterse/);
  assert.equal(findContactByEmail(db, 'singur@client.ro'), undefined);

  // Al doilea apel pe același link nu mai găsește nimic, dar nu crapă.
  assert.equal((await fetch(`${base}/sterge-date/${i.token}`, { method: 'POST' })).status, 404);
});

test('comentariile pot fi șterse separat, la cerere expresă', () => {
  const c = upsertContact(db, { email: 'comentariu@client.ro', name: 'Cu comentariu' });
  const r = saveResponse(db, {
    campaignId: campanie.id, contactId: c.id, score: 3, category: 'detractor',
    comment: 'Mă cheamă Ion Popescu și locuiesc pe strada X.',
  });
  assert.equal(eraseComments(db, c.id), 1);
  assert.equal(db.prepare('SELECT comment FROM responses WHERE id = ?').get(r.id).comment, null);
});

test('curățenia automată anonimizează datele vechi și le lasă pe cele noi', () => {
  const bazaNoua = openDb(':memory:');
  const camp = createCampaign(bazaNoua, { name: 'Vechi', slug: 'vechi' });

  const vechi = upsertContact(bazaNoua, { email: 'vechi@client.ro', name: 'Vechi' });
  const inviteVechi = createInvite(bazaNoua, camp.id, vechi.id);
  const raspunsVechi = saveResponse(bazaNoua, {
    campaignId: camp.id, inviteId: inviteVechi.id, contactId: vechi.id,
    score: 5, category: 'detractor', comment: 'de acum trei ani',
  });
  bazaNoua.prepare("UPDATE responses SET created_at = datetime('now', '-36 months') WHERE id = ?").run(raspunsVechi.id);
  bazaNoua.prepare("UPDATE invites SET created_at = datetime('now', '-36 months') WHERE id = ?").run(inviteVechi.id);

  const nou = upsertContact(bazaNoua, { email: 'nou@client.ro', name: 'Nou' });
  saveResponse(bazaNoua, { campaignId: camp.id, contactId: nou.id, score: 9, category: 'promoter' });

  const rezultat = runRetention(bazaNoua, { months: 24 });
  assert.equal(rezultat.raspunsuri, 1);
  assert.equal(rezultat.invitatii, 1);
  assert.equal(rezultat.contacte, 1);

  assert.equal(findContactByEmail(bazaNoua, 'vechi@client.ro'), undefined);
  assert.ok(findContactByEmail(bazaNoua, 'nou@client.ro'), 'contactul recent rămâne');
  const pastrat = bazaNoua.prepare('SELECT contact_id, score, comment FROM responses ORDER BY id').all();
  assert.equal(pastrat.length, 2, 'ambele răspunsuri rămân pentru statistică');
  assert.equal(pastrat[0].contact_id, null);
  assert.equal(pastrat[0].score, 5);
});

test('curățenia se poate porni și din interfață', async () => {
  const res = await fetch(`${base}/admin/date-personale/retentie`, {
    method: 'POST', headers: authHeaders(), redirect: 'manual',
  });
  assert.equal(res.status, 302);
  assert.match(decodeURIComponent(res.headers.get('location')), /Curățenie făcută/);
});

test('pagina de date personale caută după email și cere autentificare', async () => {
  const c = upsertContact(db, { email: 'cautat@client.ro', name: 'Căutat', company: 'Firma SRL' });
  createInvite(db, campanie.id, c.id);

  const gasit = await (await fetch(`${base}/admin/date-personale?email=cautat@client.ro`, { headers: authHeaders() })).text();
  assert.match(gasit, /Căutat/);
  assert.match(gasit, /Șterge datele personale/);

  const negasit = await (await fetch(`${base}/admin/date-personale?email=nimeni@x.ro`, { headers: authHeaders() })).text();
  assert.match(negasit, /Nicio persoană cu acest email/);

  const res = await fetch(`${base}/admin/date-personale`, { redirect: 'manual' });
  assert.equal(res.headers.get('location'), '/admin/login');
});

test('sondajul și emailurile trimit către nota de informare', async () => {
  const sondaj = await (await fetch(`${base}/s/nps`)).text();
  assert.match(sondaj, /href="\/confidentialitate"/);

  const { invitationEmail } = await import('../src/emails.js');
  const mail = invitationEmail({
    invite: { token: 'T', question: 'Î?', contact_name: 'X', intro: null },
    publicUrl: 'https://nps.firma.ro',
  });
  assert.match(mail.html, /https:\/\/nps\.firma\.ro\/confidentialitate/);
  assert.match(mail.text, /Cum folosim datele: https:\/\/nps\.firma\.ro\/confidentialitate/);
  assert.ok(!/confidentialitate#/.test(mail.html), 'tokenul nu ajunge în linkul notei');
});
