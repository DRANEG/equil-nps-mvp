import { html, redirect, readForm, csv, parseCookies, sessionValue, safeEqual } from '../http.js';
import { loginPage, dashboardPage, campaignsPage, campaignDetailPage, responsesPage } from '../views/admin.js';
import { noticePage } from '../views/survey.js';
import { summarize, marginOfError } from '../nps.js';
import {
  listCampaigns, getCampaign, createCampaign, setCampaignActive, setCampaignAutoSend,
  upsertContact, createInvite, listInvites, markInvitesSent,
  listResponses, markResponseClosed, monthlyTrend, breakdownBy,
  emailStats, listEmailLog,
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
      recent: responses.slice(0, 20),
      campaigns,
      campaignId,
      invitesSent,
      publicUrl,
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
    data: r.created_at,
    campanie: r.campaign_name,
    scor: r.score,
    categorie: r.category,
    email: r.email || '',
    nume: r.contact_name || '',
    companie: r.company || '',
    segment: r.segment || '',
    comentariu: r.comment || '',
    sursa: r.source,
    inchis_la: r.closed_at || '',
  }));
  return csv(res, 'raspunsuri-nps.csv', rows);
}

export function responseClose(req, res, { db, params }) {
  markResponseClosed(db, Number(params.id), true);
  return redirect(res, '/admin/raspunsuri');
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
