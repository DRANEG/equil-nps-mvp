// Populeaza baza de date cu o campanie demo si raspunsuri, ca sa vezi dashboardul plin.
import {
  openDb, createCampaign, upsertContact, createInvite, saveResponse, getCampaignBySlug,
  addStandardQuestions, listQuestions, saveAnswers, createLocation,
} from './db.js';
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

// Intrebarile suplimentare si doua locatii cu cod QR.
const questions = addStandardQuestions(db, campaign.id);
const locations = [
  createLocation(db, { name: 'Magazin Unirii', address: 'Bd. Unirii 12, București' }),
  createLocation(db, { name: 'Magazin Centrul Vechi', address: 'Str. Lipscani 8, București' }),
];

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

people.forEach(([email, name, company, segment, score, comment], index) => {
  const contact = upsertContact(db, { email, name, company, segment });
  const invite = createInvite(db, campaign.id, contact.id);
  const location = locations[index % locations.length];
  const response = saveResponse(db, {
    campaignId: campaign.id,
    inviteId: invite.id,
    contactId: contact.id,
    score,
    category: categorize(score),
    comment,
    source: 'invitatie',
    locationId: location.id,
  });
  // Raspunsuri plauzibile la intrebarile suplimentare, corelate cu scorul NPS.
  const nota = Math.max(1, Math.min(5, Math.round(score / 2)));
  const preferinte = ['Produsul', 'Oamenii', 'Rapiditatea', 'Prețul', 'Altceva'];
  saveAnswers(db, response.id, [
    { questionId: questions[0].id, value: String(nota) },
    { questionId: questions[1].id, value: String(Math.max(1, Math.min(5, nota + (index % 2 ? 0 : 1)))) },
    { questionId: questions[2].id, value: String(Math.max(1, Math.min(5, nota - (index % 3 === 0 ? 1 : 0)))) },
    { questionId: questions[3].id, value: preferinte[index % preferinte.length] },
    { questionId: questions[4].id, value: index % 3 === 0 ? 'Timpul de așteptare la casă.' : '' },
  ]);
});

// Cateva contacte invitate care inca nu au raspuns (ca sa vezi rata de raspuns).
for (const [email, name, company, segment] of [
  ['neraspuns1@client.ro', 'Alex Rus', 'Client SRL', 'Enterprise'],
  ['neraspuns2@client.ro', 'Bianca Toma', 'RetailX', 'Enterprise'],
  ['neraspuns3@client.ro', 'Cristi Vlad', 'Startup.io', 'Startup'],
]) {
  const contact = upsertContact(db, { email, name, company, segment });
  createInvite(db, campaign.id, contact.id);
}

console.log(
  `Gata. Campanie demo: /s/${slug} — 10 răspunsuri, 13 invitații, ` +
  `${listQuestions(db, campaign.id).length} întrebări suplimentare, ${locations.length} locații cu cod QR.`,
);
