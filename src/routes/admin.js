import { html, send, redirect, readForm, csv, parseCookies, sessionValue, safeEqual } from '../http.js';
import {
  loginPage, dashboardPage, campaignsPage, campaignDetailPage, responsesPage,
  locationsPage, postersPage, alertsPage,
} from '../views/admin.js';
import { alertConfigFromEnv, alertsDescription } from '../alerts.js';
import { qrSvg } from '../qr.js';
import { formatDateTime, formatPhone } from '../format.js';
import { noticePage } from '../views/survey.js';
import { summarize, marginOfError } from '../nps.js';
import {
  listCampaigns, getCampaign, createCampaign, setCampaignActive, setCampaignAutoSend,
  upsertContact, createInvite, listInvites, markInvitesSent,
  listResponses, markResponseClosed, monthlyTrend, breakdownBy,
  emailStats, listEmailLog,
  QUESTION_KINDS, addQuestion, addStandardQuestions, getQuestion, deleteQuestion, moveQuestion,
  listQuestions, questionResults, breakdownByLocation,
  createLocation, listLocations, setLocationActive,
  openDetractors, countOpenDetractors, listAlertLog, setCampaignAlerts,
} from '../db.js';
import { runSendPass } from '../scheduler.js';

const COOKIE = 'equil_nps_admin';

export function isAuthenticated(req, adminToken) {
  const cookie = parseCookies(req)[COOKIE];
  return Boolean(cookie) && safeEqual(cookie, sessionValue(adminToken));
}

export function loginForm(req, res, { url }) {
  return html(res, 200, loginPage(url.searchParams.get('eroare') ? 'Parolă incorectă.' : null));
}

export async function login(req, res, { adminToken }) {
  const form = await readForm(req);
  if (!form.token || !safeEqual(form.token, adminToken)) {
    return redirect(res, '/admin/login?eroare=1');
  }
  const cookie = `${COOKIE}=${sessionValue(adminToken)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`;
  return redirect(res, '/admin', { 'Set-Cookie': cookie });
}

export function logout(req, res) {
  return redirect(res, '/admin/login', {
    'Set-Cookie': `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
  });
}

export function dashboard(req, res, { db, url, publicUrl }) {
  const campaigns = listCampaigns(db);
  const campaignId = intOrNull(url.searchParams.get('campanie'));
  const responses = listResponses(db, { campaignId });
  const summary = summarize(responses);
  const invitesSent = campaignId
    ? db.prepare('SELECT COUNT(*) AS n FROM invites WHERE campaign_id = ?').get(campaignId).n
    : db.prepare('SELECT COUNT(*) AS n FROM invites').get().n;

  return html(
    res,
    200,
    dashboardPage({
      summary,
      moe: marginOfError(summary),
      trend: monthlyTrend(db, campaignId),
      segments: breakdownBy(db, 'segment', campaignId),
      locations: breakdownByLocation(db, campaignId),
      questions: campaignId ? questionResults(db, campaignId) : [],
      recent: responses.slice(0, 20),
      campaigns,
      campaignId,
      invitesSent,
      publicUrl,
      openAlerts: countOpenDetractors(db),
    }),
  );
}

export function campaignsList(req, res, { db, url, publicUrl }) {
  return html(
    res,
    200,
    campaignsPage({
      campaigns: listCampaigns(db),
      publicUrl,
      flash: url.searchParams.get('ok') ? 'Campanie creată.' : null,
    }),
  );
}

export async function campaignCreate(req, res, { db }) {
  const form = await readForm(req);
  const name = String(form.name || '').trim();
  if (!name) return redirect(res, '/admin/campanii');
  const campaign = createCampaign(db, {
    name,
    question: String(form.question || '').trim() || undefined,
    followup: String(form.followup || '').trim() || undefined,
  });
  return redirect(res, `/admin/campanii/${campaign.id}`);
}

export function campaignDetail(req, res, { db, params, url, publicUrl, mailer }) {
  const campaign = getCampaign(db, Number(params.id));
  if (!campaign) return html(res, 404, noticePage('Inexistent', 'Campania nu există.'));
  const invites = listInvites(db, campaign.id);
  const summary = summarize(listResponses(db, { campaignId: campaign.id }));
  const added = url.searchParams.get('adaugate');
  const sentInfo = url.searchParams.get('trimis');
  return html(
    res,
    200,
    campaignDetailPage({
      campaign,
      summary,
      invites,
      publicUrl,
      questions: listQuestions(db, campaign.id),
      email: {
        stats: emailStats(db, campaign.id),
        log: listEmailLog(db, { campaignId: campaign.id, limit: 8 }),
        transport: mailer ? mailer.description : 'necunoscut',
        mode: mailer ? mailer.mode : 'dry',
        reminderDays: Number(process.env.REMINDER_DAYS) || 5,
        delayMinutes: process.env.SEND_DELAY_MINUTES === undefined ? 10 : Number(process.env.SEND_DELAY_MINUTES),
      },
      flash: sentInfo || (added ? `${added} contacte procesate.` : null),
    }),
  );
}

export async function campaignStatus(req, res, { db, params }) {
  const form = await readForm(req);
  setCampaignActive(db, Number(params.id), form.active === '1');
  return redirect(res, `/admin/campanii/${params.id}`);
}

export async function invitesCreate(req, res, { db, params }) {
  const campaign = getCampaign(db, Number(params.id));
  if (!campaign) return html(res, 404, noticePage('Inexistent', 'Campania nu există.'));
  const form = await readForm(req);
  const contacts = parseContacts(String(form.contacts || ''));
  for (const c of contacts) {
    const contact = upsertContact(db, c);
    createInvite(db, campaign.id, contact.id);
  }
  return redirect(res, `/admin/campanii/${campaign.id}?adaugate=${contacts.length}`);
}

export function invitesCsv(req, res, { db, params, publicUrl }) {
  const campaign = getCampaign(db, Number(params.id));
  if (!campaign) return html(res, 404, noticePage('Inexistent', 'Campania nu există.'));
  const rows = listInvites(db, campaign.id).map((i) => ({
    email: i.email,
    nume: i.contact_name || '',
    companie: i.company || '',
    segment: i.segment || '',
    link: `${publicUrl}/r/${i.token}`,
    a_raspuns: i.responded_at ? 'da' : 'nu',
    scor: i.score ?? '',
    trimis_la: formatDateTime(i.sent_at),
  }));
  // Exportul e folosit ca lista de trimitere, deci marcam invitatiile drept expediate.
  markInvitesSent(db, campaign.id);
  return csv(res, `invitatii-${campaign.slug}.csv`, rows);
}

export function responsesList(req, res, { db, url }) {
  const campaignId = intOrNull(url.searchParams.get('campanie'));
  const category = ['promoter', 'passive', 'detractor'].includes(url.searchParams.get('categorie'))
    ? url.searchParams.get('categorie')
    : '';
  return html(
    res,
    200,
    responsesPage({
      responses: listResponses(db, { campaignId, category: category || null }),
      campaigns: listCampaigns(db),
      campaignId,
      category,
    }),
  );
}

export function responsesCsv(req, res, { db, url }) {
  const campaignId = intOrNull(url.searchParams.get('campanie'));
  const rows = listResponses(db, { campaignId }).map((r) => ({
    data: formatDateTime(r.created_at),
    campanie: r.campaign_name,
    scor: r.score,
    categorie: r.category,
    email: r.email || '',
    nume: r.contact_name || '',
    companie: r.company || '',
    segment: r.segment || '',
    comentariu: r.comment || '',
    sursa: r.source,
    inchis_la: formatDateTime(r.closed_at),
  }));
  return csv(res, 'raspunsuri-nps.csv', rows);
}

export async function responseClose(req, res, { db, params }) {
  const form = await readForm(req);
  markResponseClosed(db, Number(params.id), true);
  return redirect(res, form.de === 'alerte' ? '/admin/alerte' : '/admin/raspunsuri');
}

/* ---------------------------------- utilitare -------------------------------- */

// "email, nume, companie, segment" pe linie; accepta si virgula sau punct-si-virgula.
export function parseContacts(text) {
  const out = [];
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [email, name, company, segment] = trimmed.split(/\s*[;,]\s*/);
    if (!email || !email.includes('@')) continue;
    out.push({
      email: email.toLowerCase(),
      name: name || null,
      company: company || null,
      segment: segment || null,
    });
  }
  return out;
}

function intOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

// POST /admin/campanii/:id/trimite — trimitere manuala, acum, pentru campania curenta.
// Ignora atat intarzierea de siguranta, cat si comutatorul de trimitere automata:
// daca apesi butonul, ai decis deja.
export async function campaignSendNow(req, res, { db, params, mailer, publicUrl }) {
  const campaign = getCampaign(db, Number(params.id));
  if (!campaign) return html(res, 404, noticePage('Inexistent', 'Campania nu există.'));
  const result = await runSendPass(db, {
    mailer,
    publicUrl,
    campaignId: campaign.id,
    onlyAutoSend: false,
    delayMinutes: 0,
  });
  const summary = `Invitații: ${result.invitatii}, remindere: ${result.remindere}, erori: ${result.erori}`;
  return redirect(res, `/admin/campanii/${campaign.id}?trimis=${encodeURIComponent(summary)}`);
}

// POST /admin/campanii/:id/auto — porneste/opreste robotul pentru campania asta.
export async function campaignAutoSend(req, res, { db, params }) {
  const form = await readForm(req);
  setCampaignAutoSend(db, Number(params.id), form.auto === '1');
  return redirect(res, `/admin/campanii/${params.id}`);
}

/* ------------------------ intrebari suplimentare ----------------------------- */

export async function questionCreate(req, res, { db, params }) {
  const form = await readForm(req);
  const text = String(form.text || '').trim();
  if (!text) return redirect(res, `/admin/campanii/${params.id}`);
  const kind = QUESTION_KINDS.includes(form.kind) ? form.kind : 'rating';
  const options =
    kind === 'choice'
      ? String(form.options || '')
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : null;
  // O intrebare cu alegere fara optiuni nu are sens: o transformam in text liber.
  const finalKind = kind === 'choice' && (!options || options.length < 2) ? 'text' : kind;
  addQuestion(db, Number(params.id), {
    kind: finalKind,
    text,
    options: finalKind === 'choice' ? options : null,
    topic: ['produs', 'experienta', 'locatie'].includes(form.topic) ? form.topic : null,
    required: form.required === '1',
  });
  return redirect(res, `/admin/campanii/${params.id}`);
}

export function questionsStandard(req, res, { db, params }) {
  addStandardQuestions(db, Number(params.id));
  return redirect(res, `/admin/campanii/${params.id}`);
}

export function questionDelete(req, res, { db, params }) {
  const question = getQuestion(db, Number(params.id));
  deleteQuestion(db, Number(params.id));
  return redirect(res, question ? `/admin/campanii/${question.campaign_id}` : '/admin/campanii');
}

export async function questionMove(req, res, { db, params }) {
  const form = await readForm(req);
  const question = getQuestion(db, Number(params.id));
  moveQuestion(db, Number(params.id), form.directie === 'sus' ? 'sus' : 'jos');
  return redirect(res, question ? `/admin/campanii/${question.campaign_id}` : '/admin/campanii');
}

/* ------------------------------ locatii si QR -------------------------------- */

export function locationsList(req, res, { db, url, publicUrl }) {
  const campaigns = listCampaigns(db).filter((c) => c.active);
  const chosen = Number(url.searchParams.get('campanie'));
  return html(
    res,
    200,
    locationsPage({
      locations: listLocations(db),
      campaigns,
      campaign: campaigns.find((c) => c.id === chosen) || campaigns[0] || null,
      publicUrl,
      qrFor: (link, size) => qrSvg(link, { scale: Math.max(2, Math.round(size / 40)), margin: 3 }),
      flash: url.searchParams.get('ok') ? 'Locație adăugată. Codul QR este gata de printat.' : null,
    }),
  );
}

export async function locationCreate(req, res, { db }) {
  const form = await readForm(req);
  const name = String(form.name || '').trim();
  if (!name) return redirect(res, '/admin/locatii');
  createLocation(db, { name, address: String(form.address || '').trim() || null });
  return redirect(res, '/admin/locatii?ok=1');
}

export async function locationStatus(req, res, { db, params }) {
  const form = await readForm(req);
  setLocationActive(db, Number(params.id), form.active === '1');
  return redirect(res, '/admin/locatii');
}

// Afisele de printat: unul per locatie (sau unul singur, fara locatie).
export function posters(req, res, { db, url, publicUrl }) {
  const campaigns = listCampaigns(db).filter((c) => c.active);
  const chosen = Number(url.searchParams.get('campanie'));
  const campaign = campaigns.find((c) => c.id === chosen) || campaigns[0];
  if (!campaign) {
    return html(res, 404, noticePage('Nicio campanie activă', 'Creează o campanie înainte de a printa afișe.'));
  }
  const locationId = Number(url.searchParams.get('locatie')) || null;
  const locations = listLocations(db, { onlyActive: true }).filter((l) => !locationId || l.id === locationId);

  const build = (name, address, link) => ({
    name,
    address,
    link,
    qr: qrSvg(link, { scale: 8, margin: 3 }),
  });

  const sheets = locations.length
    ? locations.map((l) => build(l.name, l.address, `${publicUrl}/s/${campaign.slug}?loc=${l.slug}`))
    : [build(campaign.name, null, `${publicUrl}/s/${campaign.slug}`)];

  return html(res, 200, postersPage({ posters: sheets, campaignName: campaign.name }));
}

// Codul QR ca imagine, daca vrei sa-l pui in alt material.
export function qrImage(req, res, { url }) {
  const text = url.searchParams.get('t');
  if (!text || text.length > 400) return html(res, 400, noticePage('Lipsește textul', 'Adaugă ?t=<link>.'));
  return send(res, 200, qrSvg(text, { scale: 8, margin: 4 }), {
    'Content-Type': 'image/svg+xml; charset=utf-8',
    'Cache-Control': 'no-store',
  });
}

/* --------------------------- alerte la detractori ---------------------------- */

export function alertsList(req, res, { db, publicUrl, alertConfig }) {
  return html(
    res,
    200,
    alertsPage({
      detractors: openDetractors(db),
      log: listAlertLog(db, 15),
      transport: alertsDescription(alertConfig || alertConfigFromEnv()),
      publicUrl,
      campaigns: listCampaigns(db),
    }),
  );
}

// Comutatorul de alerte pentru o campanie (unele campanii nu merita alerte
// imediate, de exemplu un sondaj vechi redeschis pentru arhiva).
export async function campaignAlerts(req, res, { db, params }) {
  const form = await readForm(req);
  setCampaignAlerts(db, Number(params.id), form.alerte === '1');
  return redirect(res, `/admin/campanii/${params.id}`);
}
