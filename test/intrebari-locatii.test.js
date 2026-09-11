import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import {
  openDb, createCampaign, createLocation, setLocationActive, addStandardQuestions,
  addQuestion, listQuestions, moveQuestion, deleteQuestion, listAnswers,
  questionResults, breakdownByLocation, listResponses,
} from '../src/db.js';
import { createApp } from '../src/server.js';
import { sessionValue } from '../src/http.js';

const ADMIN_TOKEN = 'parola-test';
let server;
let base;
let db;
let campaign;
let location;
let questions;

before(async () => {
  db = openDb(':memory:');
  campaign = createCampaign(db, { name: 'Feedback magazin', slug: 'magazin' });
  location = createLocation(db, { name: 'Magazin Unirii', address: 'Bd. Unirii 12' });
  questions = addStandardQuestions(db, campaign.id);
  server = createServer(createApp({ db, adminToken: ADMIN_TOKEN, publicUrl: 'http://localhost' }));
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const authHeaders = () => ({ cookie: `equil_nps_admin=${sessionValue(ADMIN_TOKEN)}` });
const formHeaders = () => ({ 'content-type': 'application/x-www-form-urlencoded' });

test('setul standard acoperă produs, experiență și locație', () => {
  assert.equal(questions.length, 5);
  assert.deepEqual([...new Set(questions.map((q) => q.topic))].sort(), ['experienta', 'locatie', 'produs']);
  assert.deepEqual([...new Set(questions.map((q) => q.kind))].sort(), ['choice', 'rating', 'text']);
  assert.ok(questions.find((q) => q.kind === 'choice').options.includes('Oamenii'));
});

test('sondajul afișează întrebările suplimentare și locația scanată', async () => {
  const body = await (await fetch(`${base}/s/magazin?loc=magazin-unirii`)).text();
  assert.match(body, /Cât de mulțumit ești de produsul în sine\?/);
  assert.match(body, /Ce ți-a plăcut cel mai mult\?/);
  assert.match(body, /Magazin Unirii/);
  assert.match(body, /name="loc" value="magazin-unirii"/);
  // Notele 1-5 pentru fiecare întrebare de tip rating
  assert.equal((body.match(/class="scale scale--5"/g) || []).length, 3);
});

test('răspunsul salvează notele, alegerea, textul și locația', async () => {
  const form = new URLSearchParams({
    slug: 'magazin',
    loc: 'magazin-unirii',
    score: '9',
    comment: 'Totul bine',
    [`q_${questions[0].id}`]: '5',
    [`q_${questions[1].id}`]: '4',
    [`q_${questions[3].id}`]: 'Oamenii',
    [`q_${questions[4].id}`]: 'Mai multe case deschise.',
  });
  const res = await fetch(`${base}/raspunde`, { method: 'POST', headers: formHeaders(), body: form, redirect: 'manual' });
  assert.equal(res.status, 302);

  const response = listResponses(db, {})[0];
  assert.equal(response.score, 9);
  assert.equal(response.source, 'qr', 'un răspuns cu locație vine dintr-un cod QR');
  assert.equal(response.location_id, location.id);

  const answers = listAnswers(db, response.id);
  assert.equal(answers.length, 4, 'întrebarea fără răspuns nu se salvează');
  assert.equal(answers.find((a) => a.question_id === questions[0].id).value, '5');
  assert.equal(answers.find((a) => a.question_id === questions[3].id).value, 'Oamenii');
});

test('API-ul JSON acceptă răspunsurile la întrebări prin obiectul answers', async () => {
  const res = await fetch(`${base}/api/raspunsuri`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      slug: 'magazin',
      loc: 'magazin-unirii',
      score: 4,
      answers: { [questions[0].id]: '2', [questions[3].id]: 'Prețul' },
    }),
  });
  assert.equal(res.status, 201);
  const response = listResponses(db, {})[0];
  assert.equal(response.score, 4);
  assert.deepEqual(
    listAnswers(db, response.id).map((a) => a.value).sort(),
    ['2', 'Prețul'],
  );
});

test('o locație inexistentă sau dezactivată este ignorată, nu blochează răspunsul', async () => {
  const inactiva = createLocation(db, { name: 'Chioșc temporar' });
  setLocationActive(db, inactiva.id, false);

  for (const loc of ['nu-exista', inactiva.slug]) {
    const res = await fetch(`${base}/api/raspunsuri`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'magazin', loc, score: 7 }),
    });
    assert.equal(res.status, 201);
    assert.equal(listResponses(db, {})[0].location_id, null);
  }
});

test('rezultatele se agregă pe întrebare și pe locație', () => {
  const results = questionResults(db, campaign.id);
  const rating = results.find((q) => q.id === questions[0].id);
  assert.equal(rating.total, 2);
  assert.equal(rating.average, 3.5); // notele 5 și 2

  const alegere = results.find((q) => q.kind === 'choice');
  assert.deepEqual(alegere.counts.map((c) => c.value).sort(), ['Oamenii', 'Prețul']);

  const text = results.find((q) => q.kind === 'text');
  assert.equal(text.texts[0].value, 'Mai multe case deschise.');

  const locations = breakdownByLocation(db, campaign.id);
  const unirii = locations.find((l) => l.bucket === 'Magazin Unirii');
  assert.equal(unirii.total, 2);
  assert.ok(locations.find((l) => l.bucket === '(fără locație)'));
});

test('întrebările se pot adăuga, muta și șterge din interfață', async () => {
  const c = createCampaign(db, { name: 'Campanie nouă', slug: 'noua' });

  await fetch(`${base}/admin/campanii/${c.id}/intrebari`, {
    method: 'POST',
    headers: { ...authHeaders(), ...formHeaders() },
    body: new URLSearchParams({ text: 'Cum a fost livrarea?', kind: 'rating', topic: 'experienta', required: '1' }),
    redirect: 'manual',
  });
  await fetch(`${base}/admin/campanii/${c.id}/intrebari`, {
    method: 'POST',
    headers: { ...authHeaders(), ...formHeaders() },
    body: new URLSearchParams({ text: 'Ce ai comandat?', kind: 'choice', options: 'Produs A, Produs B' }),
    redirect: 'manual',
  });

  let lista = listQuestions(db, c.id);
  assert.deepEqual(lista.map((q) => q.text), ['Cum a fost livrarea?', 'Ce ai comandat?']);
  assert.equal(lista[0].required, 1);
  assert.deepEqual(lista[1].options, ['Produs A', 'Produs B']);

  await fetch(`${base}/admin/intrebari/${lista[1].id}/muta`, {
    method: 'POST',
    headers: { ...authHeaders(), ...formHeaders() },
    body: new URLSearchParams({ directie: 'sus' }),
    redirect: 'manual',
  });
  assert.deepEqual(listQuestions(db, c.id).map((q) => q.text), ['Ce ai comandat?', 'Cum a fost livrarea?']);

  await fetch(`${base}/admin/intrebari/${lista[0].id}/sterge`, {
    method: 'POST',
    headers: authHeaders(),
    redirect: 'manual',
  });
  assert.equal(listQuestions(db, c.id).length, 1);
});

test('o întrebare cu alegere fără opțiuni devine text liber', async () => {
  const c = createCampaign(db, { name: 'Fără opțiuni', slug: 'fara-optiuni' });
  await fetch(`${base}/admin/campanii/${c.id}/intrebari`, {
    method: 'POST',
    headers: { ...authHeaders(), ...formHeaders() },
    body: new URLSearchParams({ text: 'Spune-ne mai multe', kind: 'choice', options: '' }),
    redirect: 'manual',
  });
  assert.equal(listQuestions(db, c.id)[0].kind, 'text');
});

test('mutarea în afara listei nu schimbă nimic', () => {
  const c = createCampaign(db, { name: 'Una singură', slug: 'una' });
  const q = addQuestion(db, c.id, { kind: 'text', text: 'Singura întrebare' });
  moveQuestion(db, q.id, 'sus');
  moveQuestion(db, q.id, 'jos');
  assert.equal(listQuestions(db, c.id).length, 1);
  deleteQuestion(db, q.id);
  assert.equal(listQuestions(db, c.id).length, 0);
});

test('pagina de locații arată codul QR, iar afișul se poate printa', async () => {
  const locatii = await (await fetch(`${base}/admin/locatii?campanie=${campaign.id}`, { headers: authHeaders() })).text();
  assert.match(locatii, /Magazin Unirii/);
  assert.match(locatii, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/, 'codul QR e desenat inline');
  assert.match(locatii, /\/s\/magazin\?loc=magazin-unirii/);

  const afise = await (await fetch(`${base}/admin/afise?campanie=${campaign.id}`, { headers: authHeaders() })).text();
  assert.match(afise, /Cum a fost la noi\?/);
  assert.match(afise, /Scanează codul cu telefonul/);
  assert.match(afise, /Magazin Unirii/);
  assert.equal((afise.match(/<svg/g) || []).length, 1, 'un QR pentru fiecare locație activă');

  const svg = await fetch(`${base}/admin/qr.svg?t=${encodeURIComponent('https://exemplu.ro/s/magazin')}`, {
    headers: authHeaders(),
  });
  assert.equal(svg.headers.get('content-type'), 'image/svg+xml; charset=utf-8');
  assert.match(await svg.text(), /^<svg/);
});

test('codurile QR pot fi comutate pe altă campanie', async () => {
  const alta = createCampaign(db, { name: 'Campanie de vară', slug: 'vara' });
  const pagina = await (await fetch(`${base}/admin/locatii?campanie=${alta.id}`, { headers: authHeaders() })).text();
  assert.match(pagina, /\/s\/vara\?loc=magazin-unirii/);
  assert.match(pagina, /Codurile QR trimit către/);
});

test('locațiile și afișele cer autentificare', async () => {
  for (const path of ['/admin/locatii', '/admin/afise', '/admin/qr.svg?t=x']) {
    const res = await fetch(`${base}${path}`, { redirect: 'manual' });
    assert.equal(res.headers.get('location'), '/admin/login', path);
  }
});

test('fișierele aplicației instalabile sunt servite corect', async () => {
  const manifest = await fetch(`${base}/manifest.webmanifest`);
  assert.equal(manifest.headers.get('content-type'), 'application/manifest+json; charset=utf-8');
  const json = await manifest.json();
  assert.equal(json.display, 'standalone');
  assert.equal(json.start_url, '/admin');
  assert.equal(json.icons.length, 3);
  assert.ok(json.icons.some((i) => i.purpose === 'maskable'), 'icoană maskable pentru Android');

  const sw = await fetch(`${base}/sw.js`);
  assert.equal(sw.headers.get('content-type'), 'text/javascript; charset=utf-8');
  assert.equal(sw.headers.get('cache-control'), 'no-cache', 'service worker-ul nu se cachează');

  const icon = await fetch(`${base}/icons/icon-192.png`);
  assert.equal(icon.headers.get('content-type'), 'image/png');
  assert.ok(Number(icon.headers.get('content-length') || 0) > 1000);

  const offline = await fetch(`${base}/offline`);
  assert.match(await offline.text(), /Nu ai conexiune/);
});

test('paginile trimit manifestul și înregistrează service worker-ul', async () => {
  const survey = await (await fetch(`${base}/s/magazin`)).text();
  assert.match(survey, /<link rel="manifest" href="\/manifest\.webmanifest">/);
  assert.match(survey, /<meta name="theme-color" content="#2f5bea">/);
  assert.match(survey, /navigator\.serviceWorker\.register\('\/sw\.js'\)/);
  assert.match(survey, /<script src="\/sondaj\.js" defer><\/script>/);
});
