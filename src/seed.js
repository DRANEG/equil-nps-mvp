// Populeaza baza de date cu o campanie demo si raspunsuri, ca sa vezi dashboardul plin.
import { openDb, createCampaign, upsertContact, createInvite, saveResponse, getCampaignBySlug } from './db.js';
import { categorize } from './nps.js';

const db = openDb();

const slug = 'demo-nps';
if (getCampaignBySlug(db, slug)) {
  console.log('Campania demo exista deja. Nu fac nimic.');
  process.exit(0);
}

const campaign = createCampaign(db, {
  name: 'NPS trimestrial (demo)',
  slug,
});

const people = [
  ['ana.pop@client.ro', 'Ana Pop', 'Client SRL', 'Enterprise', 10, 'Suport prompt si oameni care inteleg businessul nostru.'],
  ['mihai.i@client.ro', 'Mihai Ionescu', 'Alt Client SRL', 'IMM', 9, 'Produsul e stabil, ne-a scurtat mult timpul de raportare.'],
  ['dana@retailx.ro', 'Dana Marin', 'RetailX', 'Enterprise', 8, 'Bun, dar ne-ar ajuta un export automat.'],
  ['radu@startup.io', 'Radu Stan', 'Startup.io', 'Startup', 6, 'Onboardingul a durat prea mult si documentatia e subtire.'],
  ['elena@fabrica.ro', 'Elena Dobre', 'Fabrica SA', 'Enterprise', 9, 'Relatia cu account managerul face diferenta.'],
  ['paul@imm.ro', 'Paul Georgescu', 'IMM Consult', 'IMM', 3, 'Doua incidente in ultima luna, fara notificare din partea voastra.'],
  ['ioana@retailx.ro', 'Ioana Preda', 'RetailX', 'Enterprise', 10, 'Cel mai bun raport calitate-pret de pe piata.'],
  ['victor@startup.io', 'Victor Lupu', 'Startup.io', 'Startup', 7, 'Ok, dar pretul creste repede cand adaugi utilizatori.'],
  ['carmen@fabrica.ro', 'Carmen Ilie', 'Fabrica SA', 'Enterprise', 9, null],
  ['sorin@imm.ro', 'Sorin Marcu', 'IMM Consult', 'IMM', 5, 'Interfata e greoaie pentru colegii din depozit.'],
];

for (const [email, name, company, segment, score, comment] of people) {
  const contact = upsertContact(db, { email, name, company, segment });
  const invite = createInvite(db, campaign.id, contact.id);
  saveResponse(db, {
    campaignId: campaign.id,
    inviteId: invite.id,
    contactId: contact.id,
    score,
    category: categorize(score),
    comment,
    source: 'invitatie',
  });
}

// Cateva contacte invitate care inca nu au raspuns (ca sa vezi rata de raspuns).
for (const [email, name, company, segment] of [
  ['neraspuns1@client.ro', 'Alex Rus', 'Client SRL', 'Enterprise'],
  ['neraspuns2@client.ro', 'Bianca Toma', 'RetailX', 'Enterprise'],
  ['neraspuns3@client.ro', 'Cristi Vlad', 'Startup.io', 'Startup'],
]) {
  const contact = upsertContact(db, { email, name, company, segment });
  createInvite(db, campaign.id, contact.id);
}

console.log(`Gata. Campanie demo: /s/${slug} (10 răspunsuri, 13 invitații).`);
