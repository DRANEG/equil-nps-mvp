import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openDb, createCampaign, upsertContact } from '../src/db.js';
import { verificaConfiguratie, verificaMediu, verificaDate, rezumat, scrieRaport } from '../src/verifica.js';

const titluri = (lista) => lista.map((e) => e.titlu);
const contine = (lista, bucata) => lista.some((e) => e.titlu.includes(bucata));

const CONFIG_BUNA = {
  ADMIN_TOKEN: 'QxR7-mnT4vLp90Zy',
  PUBLIC_URL: 'https://nps.equil.ro',
  SMTP_HOST: 'smtp.brevo.com',
  SMTP_USER: 'utilizator',
  SMTP_PASS: 'secret',
  MAIL_FROM: 'Equil <nps@equil.ro>',
  OPERATOR_NAME: 'Equil Retail SRL',
  OPERATOR_EMAIL: 'contact@equil.ro',
  OPERATOR_CUI: 'RO12345678',
  OPERATOR_ADDRESS: 'Str. Lipscani 8, București',
  ALERT_EMAILS: 'sef@equil.ro',
};

test('o configurare completă trece fără probleme', () => {
  const raport = verificaConfiguratie(CONFIG_BUNA);
  assert.deepEqual(raport.blocante, [], `blocante neașteptate: ${titluri(raport.blocante)}`);
  assert.deepEqual(raport.atentionari, [], `atenționări neașteptate: ${titluri(raport.atentionari)}`);
  assert.ok(raport.bune.length >= 4);
});

test('parola de administrare este verificată serios', () => {
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, ADMIN_TOKEN: '' }).blocante, 'ADMIN_TOKEN lipsește'));
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, ADMIN_TOKEN: 'admin' }).blocante, 'parolă de exemplu'));
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, ADMIN_TOKEN: 'Test123' }).blocante, 'parolă de exemplu'));
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, ADMIN_TOKEN: 'scurta123' }).blocante, 'prea scurt'));
});

test('adresa publică trebuie să fie pe HTTPS în producție', () => {
  const faraHttps = verificaConfiguratie({ ...CONFIG_BUNA, PUBLIC_URL: 'http://nps.equil.ro' });
  assert.ok(contine(faraHttps.blocante, 'nu este pe HTTPS'));

  const local = verificaConfiguratie({ ...CONFIG_BUNA, PUBLIC_URL: 'http://localhost:3000' });
  assert.deepEqual(local.blocante, []);
  assert.ok(contine(local.atentionari, 'localhost'));

  const cuBara = verificaConfiguratie({ ...CONFIG_BUNA, PUBLIC_URL: 'https://nps.equil.ro/' });
  assert.ok(contine(cuBara.atentionari, 'se termină cu'));
});

test('problemele de email sunt semnalate înainte să ajungă mesajele în spam', () => {
  const faraSmtp = verificaConfiguratie({ ...CONFIG_BUNA, SMTP_HOST: '' });
  assert.ok(contine(faraSmtp.atentionari, 'SMTP nu e configurat'));

  const localhost = verificaConfiguratie({ ...CONFIG_BUNA, MAIL_FROM: 'NPS <nps@localhost>' });
  assert.ok(contine(localhost.blocante, 'MAIL_FROM'));

  const gmail = verificaConfiguratie({ ...CONFIG_BUNA, MAIL_FROM: 'Equil <equil.srl@gmail.com>' });
  assert.ok(contine(gmail.atentionari, 'domeniu public'));

  const altDomeniu = verificaConfiguratie({ ...CONFIG_BUNA, MAIL_FROM: 'Equil <nps@alta-firma.ro>' });
  assert.ok(contine(altDomeniu.atentionari, 'alt domeniu'));

  const faraParola = verificaConfiguratie({ ...CONFIG_BUNA, SMTP_PASS: '' });
  assert.ok(contine(faraParola.atentionari, 'fără utilizator sau parolă'));
});

test('lipsa datelor de firmă oprește lansarea, din motive legale', () => {
  const fara = verificaConfiguratie({ ...CONFIG_BUNA, OPERATOR_NAME: '', OPERATOR_EMAIL: '' });
  assert.ok(contine(fara.blocante, 'Datele firmei lipsesc'));

  const partial = verificaConfiguratie({ ...CONFIG_BUNA, OPERATOR_CUI: '', OPERATOR_ADDRESS: '' });
  assert.deepEqual(partial.blocante, []);
  assert.ok(contine(partial.atentionari, 'incompletă'));

  const retentieLunga = verificaConfiguratie({ ...CONFIG_BUNA, DATA_RETENTION_MONTHS: '60' });
  assert.ok(contine(retentieLunga.atentionari, 'mai mult de 3 ani'));
});

test('alertele fără destinatar și robotul oprit sunt semnalate', () => {
  const fara = verificaConfiguratie({ ...CONFIG_BUNA, ALERT_EMAILS: '' });
  assert.ok(contine(fara.atentionari, 'nu ajung nicăieri'));

  const cuWebhook = verificaConfiguratie({ ...CONFIG_BUNA, ALERT_EMAILS: '', ALERT_WEBHOOK_URL: 'https://hooks.slack.com/x' });
  assert.ok(!contine(cuWebhook.atentionari, 'nu ajung nicăieri'));

  const oprit = verificaConfiguratie({ ...CONFIG_BUNA, SEND_ENABLED: '0' });
  assert.ok(contine(oprit.atentionari, 'Robotul de trimitere e oprit'));
});

test('setările riscante de server sunt semnalate', () => {
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, TRUST_PROXY: '1' }).atentionari, 'TRUST_PROXY'));
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, NPS_DB: '/tmp/nps.db' }).blocante, 'în /tmp'));
  assert.ok(contine(verificaConfiguratie({ ...CONFIG_BUNA, SEND_HOURS: '20-9' }).atentionari, 'SEND_HOURS'));
});

test('versiunea de Node este verificată', () => {
  assert.ok(contine(verificaMediu({}, { version: '20.11.0' }).blocante, 'prea vechi'));
  assert.ok(contine(verificaMediu({}, { version: '22.4.0' }).blocante, 'prea vechi'));
  assert.ok(contine(verificaMediu({}, { version: '22.5.0' }).bune, 'Node.js 22.5.0'));
  assert.ok(contine(verificaMediu({}, { version: '24.1.0' }).bune, 'Node.js 24.1.0'));
});

test('datele din aplicație sunt verificate înainte de primul val', () => {
  const goala = openDb(':memory:');
  assert.ok(contine(verificaDate(goala).atentionari, 'Nicio campanie activă'));

  const db = openDb(':memory:');
  createCampaign(db, { name: 'Demo', slug: 'demo-nps' });
  upsertContact(db, { email: 'ana@client.ro', name: 'Ana' });
  const raport = verificaDate(db);
  assert.ok(contine(raport.atentionari, 'Campania demo încă există'));
  assert.ok(contine(raport.bune, 'Campanii active'));
});

test('raportul spune clar dacă se poate lansa', () => {
  const linii = [];
  scrieRaport(rezumat(verificaConfiguratie(CONFIG_BUNA)), (l) => linii.push(l));
  assert.match(linii.join('\n'), /Totul e pregătit/);

  const cuAtentionari = [];
  scrieRaport(rezumat(verificaConfiguratie({ ...CONFIG_BUNA, SEND_ENABLED: '0' })), (l) => cuAtentionari.push(l));
  assert.match(cuAtentionari.join('\n'), /Poți porni, dar uită-te peste/);

  const cuBlocante = [];
  scrieRaport(rezumat(verificaConfiguratie({ ...CONFIG_BUNA, ADMIN_TOKEN: 'admin' })), (l) => cuBlocante.push(l));
  assert.match(cuBlocante.join('\n'), /Nu porni încă: 1 problemă/);
});
