import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  openDb, createCampaign, upsertContact, createInvite, saveResponse,
  listEmailLog, emailStats, setCampaignAutoSend, unsubscribeByToken,
} from '../src/db.js';
import { runSendPass } from '../src/scheduler.js';
import { invitationEmail, reminderEmail } from '../src/emails.js';

// Colector in loc de SMTP: retine mesajele si poate simula erori.
function collector({ failFor = [] } = {}) {
  const sent = [];
  return {
    sent,
    mode: 'test',
    description: 'colector de test',
    async send(message) {
      if (failFor.includes(message.to)) throw new Error('550 cutie postala plina');
      sent.push(message);
      return { id: `${sent.length}`, transport: 'test' };
    },
  };
}

function setup() {
  const db = openDb(':memory:');
  const campaign = createCampaign(db, { name: 'Q1', slug: 'q1' });
  const invite = (email, name) => {
    const contact = upsertContact(db, { email, name });
    return createInvite(db, campaign.id, contact.id);
  };
  const ageInvite = (id, days) =>
    db.prepare(`UPDATE invites SET sent_at = datetime('now', '-${days} days') WHERE id = ?`).run(id);
  return { db, campaign, invite, ageInvite };
}

const opts = { publicUrl: 'https://nps.test', delayMinutes: 0, throttleMs: 0 };

test('invitatiile netrimise pleaca o singura data', async () => {
  const { db, invite } = setup();
  invite('ana@client.ro', 'Ana');
  invite('mihai@client.ro', 'Mihai');
  const mailer = collector();

  const first = await runSendPass(db, { ...opts, mailer });
  assert.deepEqual({ i: first.invitatii, r: first.remindere, e: first.erori }, { i: 2, r: 0, e: 0 });
  assert.deepEqual(mailer.sent.map((m) => m.to).sort(), ['ana@client.ro', 'mihai@client.ro']);

  const second = await runSendPass(db, { ...opts, mailer });
  assert.equal(second.invitatii, 0, 'a doua trecere nu retrimite');
});

test('intarzierea de siguranta amana trimiterea imediat dupa import', async () => {
  const { db, invite } = setup();
  invite('ana@client.ro', 'Ana');
  const mailer = collector();

  const amanat = await runSendPass(db, { ...opts, mailer, delayMinutes: 10 });
  assert.equal(amanat.invitatii, 0);

  const acum = await runSendPass(db, { ...opts, mailer, delayMinutes: 0 });
  assert.equal(acum.invitatii, 1);
});

test('reminderul pleaca dupa 5 zile, o singura data si doar catre cei fara raspuns', async () => {
  const { db, campaign, invite, ageInvite } = setup();
  const tacut = invite('tacut@client.ro', 'Tăcut');
  const proaspat = invite('proaspat@client.ro', 'Proaspăt');
  const raspuns = invite('raspuns@client.ro', 'Răspuns');

  ageInvite(tacut.id, 6);
  ageInvite(proaspat.id, 2);
  ageInvite(raspuns.id, 9);
  saveResponse(db, {
    campaignId: campaign.id, inviteId: raspuns.id, contactId: raspuns.contact_id,
    score: 9, category: 'promoter', comment: null,
  });

  const mailer = collector();
  const pass = await runSendPass(db, { ...opts, mailer, reminderDays: 5 });
  assert.equal(pass.remindere, 1);
  assert.deepEqual(mailer.sent.map((m) => m.to), ['tacut@client.ro']);
  assert.match(mailer.sent[0].subject, /^Reamintire:/);

  const again = await runSendPass(db, { ...opts, mailer, reminderDays: 5 });
  assert.equal(again.remindere, 0, 'nu trimitem doua remindere');
});

test('dezabonatii nu primesc nimic', async () => {
  const { db, invite } = setup();
  const inv = invite('nuvreau@client.ro', 'Nu Vreau');
  unsubscribeByToken(db, inv.token);
  const mailer = collector();
  const pass = await runSendPass(db, { ...opts, mailer });
  assert.equal(pass.invitatii, 0);
  assert.equal(mailer.sent.length, 0);
});

test('campania cu trimitere automata oprita e sarita de robot, dar nu si de butonul manual', async () => {
  const { db, campaign, invite } = setup();
  invite('ana@client.ro', 'Ana');
  setCampaignAutoSend(db, campaign.id, false);
  const mailer = collector();

  const robot = await runSendPass(db, { ...opts, mailer });
  assert.equal(robot.invitatii, 0);

  const manual = await runSendPass(db, { ...opts, mailer, onlyAutoSend: false });
  assert.equal(manual.invitatii, 1);
});

test('campania inchisa nu mai trimite', async () => {
  const { db, campaign, invite } = setup();
  invite('ana@client.ro', 'Ana');
  db.prepare('UPDATE campaigns SET active = 0 WHERE id = ?').run(campaign.id);
  const mailer = collector();
  assert.equal((await runSendPass(db, { ...opts, mailer, onlyAutoSend: false })).invitatii, 0);
});

test('erorile sunt retinute pe invitatie si in jurnal, fara sa opreasca restul', async () => {
  const { db, campaign, invite } = setup();
  invite('bun@client.ro', 'Bun');
  invite('stricat@client.ro', 'Stricat');
  const mailer = collector({ failFor: ['stricat@client.ro'] });

  const pass = await runSendPass(db, { ...opts, mailer });
  assert.equal(pass.invitatii, 1);
  assert.equal(pass.erori, 1);

  const stats = emailStats(db, campaign.id);
  assert.equal(stats.trimise, 1);
  assert.equal(stats.erori, 1);

  const log = listEmailLog(db, { campaignId: campaign.id });
  assert.equal(log.length, 2);
  const eroare = log.find((e) => e.status === 'eroare');
  assert.match(eroare.detail, /cutie postala plina/);
  assert.equal(eroare.recipient, 'stricat@client.ro');
});

test('robotul se opreste dupa prea multe erori consecutive', async () => {
  const { db, invite } = setup();
  const emails = ['a@x.ro', 'b@x.ro', 'c@x.ro', 'd@x.ro', 'e@x.ro', 'f@x.ro'];
  emails.forEach((e) => invite(e, e));
  const mailer = collector({ failFor: emails });

  const pass = await runSendPass(db, { ...opts, mailer, maxConsecutiveErrors: 3 });
  assert.equal(pass.erori, 3);
  assert.match(pass.oprit, /erori consecutive/);
});

test('emailul contine linkul personal, butoanele 0-10 si dezabonarea', () => {
  const invite = { token: 'TOK', email: 'ana@client.ro', contact_name: 'Ana', question: 'Cât de probabil ne recomanzi?', intro: null };
  const mail = invitationEmail({ invite, publicUrl: 'https://nps.test', brand: 'Equil' });

  assert.match(mail.html, /https:\/\/nps\.test\/r\/TOK\?scor=0/);
  assert.match(mail.html, /https:\/\/nps\.test\/r\/TOK\?scor=10/);
  assert.match(mail.html, /https:\/\/nps\.test\/dezabonare\/TOK/);
  assert.match(mail.text, /https:\/\/nps\.test\/r\/TOK/);
  assert.match(mail.text, /Salut, Ana!/);
  assert.equal(mail.unsubscribe, 'https://nps.test/dezabonare/TOK');

  const reminder = reminderEmail({ invite, publicUrl: 'https://nps.test' });
  assert.match(reminder.subject, /Reamintire/);
  assert.match(reminder.html, /ultimul mesaj/);
});

test('introducerea proprie a campaniei ajunge in email', () => {
  const invite = { token: 'T', email: 'a@b.ro', contact_name: null, question: 'Întrebare?', intro: 'Text scris de mine.' };
  const mail = invitationEmail({ invite, publicUrl: 'https://x' });
  assert.match(mail.html, /Text scris de mine\./);
  assert.match(mail.text, /Text scris de mine\./);
  assert.match(mail.text, /^Salut!/);
});

test('doua treceri simultane nu trimit acelasi email de doua ori', async () => {
  const { db, invite } = setup();
  invite('unic@client.ro', 'Unic');

  // Mailer lent: lasa a doua trecere sa inceapa inainte ca prima sa termine.
  const sent = [];
  const lent = {
    mode: 'test',
    description: 'lent',
    async send(message) {
      await new Promise((r) => setTimeout(r, 40));
      sent.push(message);
      return { id: '1', transport: 'test' };
    },
  };

  const [a, b] = await Promise.all([
    runSendPass(db, { ...opts, mailer: lent }),
    runSendPass(db, { ...opts, mailer: lent }),
  ]);

  assert.equal(sent.length, 1, 'un singur email pentru o singura invitatie');
  assert.equal(a.invitatii + b.invitatii, 1);
});

test('o trimitere esuata poate fi reincercata la trecerea urmatoare', async () => {
  const { db, invite } = setup();
  invite('capricios@client.ro', 'Capricios');

  const stricat = await runSendPass(db, { ...opts, mailer: collector({ failFor: ['capricios@client.ro'] }) });
  assert.equal(stricat.erori, 1);
  assert.equal(
    db.prepare('SELECT sent_at FROM invites WHERE id = 1').get().sent_at,
    null,
    'marcajul se elibereaza dupa esec',
  );

  const reusit = await runSendPass(db, { ...opts, mailer: collector() });
  assert.equal(reusit.invitatii, 1);
});
