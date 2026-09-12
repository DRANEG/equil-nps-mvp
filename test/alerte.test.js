import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  openDb, createCampaign, createLocation, upsertContact, createInvite, saveResponse,
  listAlertLog, openDetractors, countOpenDetractors, setCampaignAlerts,
} from '../src/db.js';
import { handleNewResponse, flushAlerts, alertConfigFromEnv, alertsEnabled, alertsDescription } from '../src/alerts.js';
import { detractorAlertEmail, detractorAlertText } from '../src/emails.js';
import { createApp } from '../src/server.js';
import { sessionValue } from '../src/http.js';

const ADMIN_TOKEN = 'parola-test';

function colector({ esueaza = false } = {}) {
  const trimise = [];
  return {
    trimise,
    mode: 'test',
    description: 'colector',
    async send(message) {
      if (esueaza) throw new Error('SMTP picat');
      trimise.push(message);
      return { id: String(trimise.length), transport: 'test' };
    },
  };
}

// Server care retine ce primeste, in loc de Slack/Telegram.
function webhookFals({ status = 200 } = {}) {
  const primite = [];
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      primite.push({ tip: req.headers['content-type'], corp: JSON.parse(body || '{}') });
      res.writeHead(status).end('ok');
    });
  });
  return {
    primite,
    server,
    listen: () => new Promise((r) => server.listen(0, () => r(`http://127.0.0.1:${server.address().port}/hook`))),
  };
}

let db;
let campanie;
let locatie;

beforeEach(() => {
  db = openDb(':memory:');
  campanie = createCampaign(db, { name: 'NPS magazin', slug: 'magazin' });
  locatie = createLocation(db, { name: 'Magazin Unirii' });
});

const detractor = (score = 3, comment = 'A durat o oră la casă.') => {
  const contact = upsertContact(db, { email: 'ana@client.ro', name: 'Ana Pop', company: 'Client SRL' });
  return saveResponse(db, {
    campaignId: campanie.id,
    contactId: contact.id,
    score,
    category: score <= 6 ? 'detractor' : score <= 8 ? 'passive' : 'promoter',
    comment,
    locationId: locatie.id,
  });
};

const config = (extra = {}) => ({
  emails: ['sef@firma.ro'], webhookUrl: '', maxScore: 6, maxPerHour: 20, timeoutMs: 2000, ...extra,
});

test('un detractor declanșează alertă pe email, cu tot contextul', async () => {
  const r = detractor(3);
  const mailer = colector();
  const rezultat = await handleNewResponse(db, r.id, { mailer, publicUrl: 'https://nps.test', config: config() });

  assert.equal(rezultat.trimis, true);
  assert.equal(mailer.trimise.length, 1);
  const mesaj = mailer.trimise[0];
  assert.equal(mesaj.to, 'sef@firma.ro');
  assert.match(mesaj.subject, /Detractor 3\/10 — Ana Pop · Magazin Unirii/);
  assert.match(mesaj.html, /A durat o oră la casă\./);
  assert.match(mesaj.html, /mailto:ana@client\.ro/, 'butonul de răspuns direct către client');
  assert.match(mesaj.html, /https:\/\/nps\.test\/admin\/alerte/);
  assert.match(mesaj.text, /Scor: 3\/10/);

  const log = listAlertLog(db);
  assert.equal(log[0].status, 'trimis');
  assert.equal(log[0].channel, 'email');
  assert.equal(log[0].target, 'sef@firma.ro');
});

test('promotorii și pasivii nu declanșează nimic', async () => {
  const mailer = colector();
  for (const scor of [7, 8, 9, 10]) {
    const r = detractor(scor);
    const rezultat = await handleNewResponse(db, r.id, { mailer, publicUrl: 'https://x', config: config() });
    assert.equal(rezultat.trimis, false);
    assert.equal(rezultat.motiv, 'nu e detractor');
  }
  assert.equal(mailer.trimise.length, 0);
});

test('pragul de alertare se poate cobori (doar scoruri foarte mici)', async () => {
  const mailer = colector();
  const sase = detractor(6);
  assert.equal(
    (await handleNewResponse(db, sase.id, { mailer, publicUrl: 'https://x', config: config({ maxScore: 3 }) })).motiv,
    'nu e detractor',
  );
  const doi = detractor(2);
  assert.equal(
    (await handleNewResponse(db, doi.id, { mailer, publicUrl: 'https://x', config: config({ maxScore: 3 }) })).trimis,
    true,
  );
});

test('același răspuns nu alertează de două ori', async () => {
  const r = detractor(4);
  const mailer = colector();
  const ctx = { mailer, publicUrl: 'https://x', config: config() };
  assert.equal((await handleNewResponse(db, r.id, ctx)).trimis, true);
  const aDoua = await handleNewResponse(db, r.id, ctx);
  assert.equal(aDoua.trimis, false);
  assert.equal(aDoua.motiv, 'deja alertat');
  assert.equal(mailer.trimise.length, 1);
});

test('webhookul primește un mesaj gata de afișat în Slack sau Telegram', async () => {
  const hook = webhookFals();
  const url = await hook.listen();
  const r = detractor(2, 'Produsul a venit stricat.');

  const rezultat = await handleNewResponse(db, r.id, {
    mailer: colector(),
    publicUrl: 'https://nps.test',
    config: config({ emails: [], webhookUrl: url }),
  });

  assert.equal(rezultat.trimis, true);
  assert.equal(hook.primite.length, 1);
  const corp = hook.primite[0].corp;
  assert.match(hook.primite[0].tip, /application\/json/);
  assert.match(corp.text, /Detractor 2\/10 — Ana Pop · Magazin Unirii/);
  assert.match(corp.text, /Produsul a venit stricat\./);
  assert.equal(corp.scor, 2);
  assert.equal(corp.locatie, 'Magazin Unirii');
  assert.equal(corp.email, 'ana@client.ro');
  assert.equal(corp.link, 'https://nps.test/admin/alerte');
  hook.server.close();
});

test('un webhook care răspunde cu eroare este notat, iar alerta poate fi reîncercată', async () => {
  const hook = webhookFals({ status: 500 });
  const url = await hook.listen();
  const r = detractor(1);

  const rezultat = await handleNewResponse(db, r.id, {
    mailer: colector(),
    publicUrl: 'https://x',
    config: config({ emails: [], webhookUrl: url }),
  });

  assert.equal(rezultat.trimis, false);
  const log = listAlertLog(db);
  assert.equal(log[0].status, 'eroare');
  assert.match(log[0].detail, /500/);
  assert.equal(
    db.prepare('SELECT alerted_at FROM responses WHERE id = ?').get(r.id).alerted_at,
    null,
    'marcajul se eliberează, ca alerta să poată fi reîncercată',
  );
  hook.server.close();
});

test('dacă un canal merge și altul nu, alerta se consideră trimisă', async () => {
  const hook = webhookFals({ status: 500 });
  const url = await hook.listen();
  const r = detractor(3);
  const mailer = colector();

  const rezultat = await handleNewResponse(db, r.id, {
    mailer, publicUrl: 'https://x', config: config({ webhookUrl: url }),
  });

  assert.equal(rezultat.trimis, true);
  assert.equal(mailer.trimise.length, 1);
  assert.deepEqual(listAlertLog(db).map((a) => a.status).sort(), ['eroare', 'trimis']);
  hook.server.close();
});

test('alertele se opresc per campanie', async () => {
  setCampaignAlerts(db, campanie.id, false);
  const r = detractor(3);
  const rezultat = await handleNewResponse(db, r.id, {
    mailer: colector(), publicUrl: 'https://x', config: config(),
  });
  assert.equal(rezultat.motiv, 'alerte oprite pe campanie');
});

test('limita orară oprește un val de alerte, dar le notează', async () => {
  const mailer = colector();
  const ctx = { mailer, publicUrl: 'https://x', config: config({ maxPerHour: 3 }) };
  for (let i = 0; i < 5; i++) {
    const contact = upsertContact(db, { email: `om${i}@client.ro`, name: `Om ${i}` });
    const invite = createInvite(db, campanie.id, contact.id);
    const r = saveResponse(db, {
      campaignId: campanie.id, inviteId: invite.id, contactId: contact.id,
      score: 2, category: 'detractor', comment: null,
    });
    await handleNewResponse(db, r.id, ctx);
  }
  assert.equal(mailer.trimise.length, 3);
  const sarite = listAlertLog(db).filter((a) => a.status === 'sarit');
  assert.equal(sarite.length, 2);
  assert.match(sarite[0].detail, /peste 3 alerte/);
  assert.equal(countOpenDetractors(db), 5, 'toți rămân în lista de lucru, chiar dacă alerta nu a plecat');
});

test('fără configurare nu se trimite nimic și nu crapă nimic', async () => {
  const r = detractor(3);
  const gol = { emails: [], webhookUrl: '', maxScore: 6, maxPerHour: 20, timeoutMs: 1000 };
  assert.equal(alertsEnabled(gol), false);
  assert.match(alertsDescription(gol), /nicio alertă configurată/);
  assert.equal((await handleNewResponse(db, r.id, { mailer: null, publicUrl: 'https://x', config: gol })).motiv, 'neconfigurat');
});

test('configurarea se citește din variabilele de mediu', () => {
  const c = alertConfigFromEnv({
    ALERT_EMAILS: 'a@b.ro, c@d.ro , gresit',
    ALERT_WEBHOOK_URL: 'https://hooks.slack.com/x',
    ALERT_MAX_SCORE: '4',
    ALERT_MAX_PER_HOUR: '5',
  });
  assert.deepEqual(c.emails, ['a@b.ro', 'c@d.ro']);
  assert.equal(c.maxScore, 4);
  assert.equal(c.maxPerHour, 5);
  assert.match(alertsDescription(c), /email către a@b\.ro, c@d\.ro și webhook/);
});

test('mesajul pentru client anonim, fără comentariu, rămâne lizibil', () => {
  const response = {
    score: 0, comment: null, contact_name: null, email: null, company: null,
    location_name: null, campaign_name: 'Campanie', created_at: '2026-09-11 10:00:00', answers: [],
  };
  const mail = detractorAlertEmail({ response, publicUrl: 'https://x' });
  assert.match(mail.subject, /Detractor 0\/10 — Client anonim/);
  assert.match(mail.html, /DETRACTOR &mdash; SCOR 0\/10/);
  assert.ok(!mail.html.includes('mailto:'), 'fără email nu punem buton de răspuns');
  assert.match(detractorAlertText({ response, publicUrl: 'https://x' }), /\(fără comentariu\)/);
});

/* ------------------------------ fluxul complet ------------------------------- */

let server;
let base;
let mailerHttp;
// Baza de date a serverului e separata de cea refacuta inainte de fiecare test.
let dbHttp;

before(async () => {
  dbHttp = openDb(':memory:');
  createCampaign(dbHttp, { name: 'NPS magazin', slug: 'magazin' });
  createLocation(dbHttp, { name: 'Magazin Unirii' });
  mailerHttp = colector();
  server = createServer(
    createApp({
      db: dbHttp,
      adminToken: ADMIN_TOKEN,
      publicUrl: 'http://localhost',
      mailer: mailerHttp,
      alertConfig: config(),
    }),
  );
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

test('un răspuns 0–6 din sondaj declanșează alerta, fără să încetinească clientul', async () => {
  mailerHttp.trimise.length = 0;
  const res = await fetch(`${base}/raspunde`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ slug: 'magazin', score: '2', comment: 'Nu m-a sunat nimeni înapoi.' }),
    redirect: 'manual',
  });
  assert.equal(res.status, 302, 'clientul primește imediat pagina de mulțumire');

  await flushAlerts();
  assert.equal(mailerHttp.trimise.length, 1);
  assert.match(mailerHttp.trimise[0].subject, /Detractor 2\/10/);
});

test('pagina de alerte listează detractorii deschiși și îi scoate după închiderea buclei', async () => {
  const headers = { cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` };
  let pagina = await (await fetch(`${base}/admin/alerte`, { headers })).text();
  assert.match(pagina, /Nu m-a sunat nimeni înapoi\./);
  assert.match(pagina, /Am rezolvat, închide bucla/);

  const deschisi = openDetractors(dbHttp);
  assert.equal(deschisi.length, 1);

  const inchide = await fetch(`${base}/admin/raspunsuri/${deschisi[0].id}/inchide`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ de: 'alerte' }),
    redirect: 'manual',
  });
  assert.equal(inchide.headers.get('location'), '/admin/alerte');

  pagina = await (await fetch(`${base}/admin/alerte`, { headers })).text();
  assert.match(pagina, /Niciun detractor deschis/);
  assert.equal(countOpenDetractors(dbHttp), 0);
});

test('numărul de detractori deschiși apare în bara de navigare', async () => {
  const headers = { cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` };
  await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ slug: 'magazin', score: 1, comment: 'Din nou prost.' }),
  });
  await flushAlerts();

  const dashboard = await (await fetch(`${base}/admin`, { headers })).text();
  assert.match(dashboard, /Alerte <span class="badge">1<\/span>/);
  assert.match(dashboard, /<a href="\/admin\/alerte">1 de contactat<\/a>/);
});

test('pagina de alerte cere autentificare', async () => {
  const res = await fetch(`${base}/admin/alerte`, { redirect: 'manual' });
  assert.equal(res.headers.get('location'), '/admin/login');
});

test('cu telefon, alerta dă buton de apel și WhatsApp', async () => {
  const contact = upsertContact(dbHttp, {
    email: 'ion@client.ro', name: 'Ion Popescu', phone: '0721 234 567',
  });
  const campanieHttp = dbHttp.prepare('SELECT id FROM campaigns LIMIT 1').get();
  const r = saveResponse(dbHttp, {
    campaignId: campanieHttp.id, contactId: contact.id, score: 2,
    category: 'detractor', comment: 'Nu a venit nimeni.',
  });

  const headers = { cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` };
  const pagina = await (await fetch(`${base}/admin/alerte`, { headers })).text();
  assert.match(pagina, /href="tel:\+40721234567"/);
  assert.match(pagina, /https:\/\/wa\.me\/40721234567\?text=/);
  assert.match(pagina, /\+40 721 234 567/, 'numărul se afișează citibil');

  const mesaj = detractorAlertEmail({
    response: { ...r, contact_name: 'Ion Popescu', phone: contact.phone, campaign_name: 'X', answers: [] },
    publicUrl: 'https://x',
  });
  assert.match(mesaj.html, /href="tel:\+40721234567"/);
  assert.match(mesaj.html, /Sună acum/);
  assert.match(mesaj.text, /Telefon: \+40 721 234 567/);
});

test('un răspuns anonim spune clar că nu ai pe cine suna', async () => {
  const campanieHttp = dbHttp.prepare('SELECT id FROM campaigns LIMIT 1').get();
  saveResponse(dbHttp, { campaignId: campanieHttp.id, score: 0, category: 'detractor', comment: 'Groaznic.' });
  const headers = { cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` };
  const pagina = await (await fetch(`${base}/admin/alerte`, { headers })).text();
  assert.match(pagina, /Răspuns anonim — nu avem pe cine contacta/);
});
