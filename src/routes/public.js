import { html, json, redirect, readForm, escapeHtml } from '../http.js';
import { surveyPage, thanksPage, noticePage, offlinePage } from '../views/survey.js';
import { categorize, isValidScore } from '../nps.js';
import { alertInBackground } from '../alerts.js';
import { privacyPage } from '../views/gdpr.js';
import { operatorFromEnv, anonymizeContact } from '../gdpr.js';
import {
  getCampaignBySlug, getInviteByToken, saveResponse, unsubscribeByToken,
  listQuestions, saveAnswers, getLocationBySlug, getCampaign,
} from '../db.js';
import { page as pageShell } from '../views/layout.js';

// GET /s/:slug — sondaj public, anonim.
export function surveyBySlug(req, res, { db, params, url }) {
  const campaign = getCampaignBySlug(db, params.slug);
  if (!campaign) {
    return html(res, 404, noticePage('Sondaj inexistent', 'Linkul nu corespunde niciunei campanii.'));
  }
  if (!campaign.active) {
    return html(res, 410, noticePage('Sondaj închis', 'Această campanie nu mai primește răspunsuri.'));
  }
  const preselected = url.searchParams.get('scor');
  return html(
    res,
    200,
    surveyPage({
      campaign,
      slug: campaign.slug,
      preselected,
      questions: listQuestions(db, campaign.id),
      location: resolveLocation(db, url.searchParams.get('loc')),
    }),
  );
}

// GET /r/:token — sondaj personalizat; ?scor=9 vine din butoanele puse direct in email.
export function surveyByToken(req, res, { db, params, url }) {
  const invite = getInviteByToken(db, params.token);
  if (!invite) {
    return html(res, 404, noticePage('Link invalid', 'Linkul este greșit sau a expirat.'));
  }
  if (!invite.active) {
    return html(res, 410, noticePage('Sondaj închis', 'Această campanie nu mai primește răspunsuri.'));
  }
  const campaign = {
    name: invite.campaign_name,
    question: invite.question,
    followup: invite.followup,
  };
  const greeting = invite.contact_name ? `Salut, ${invite.contact_name}!` : null;
  return html(
    res,
    200,
    surveyPage({
      campaign,
      token: invite.token,
      preselected: url.searchParams.get('scor'),
      greeting,
      questions: listQuestions(db, invite.campaign_id),
      location: resolveLocation(db, url.searchParams.get('loc')),
    }),
  );
}

// POST /raspunde — trimiterea formularului (token sau slug).
export async function submitResponse(req, res, ctx) {
  const { db } = ctx;
  const form = await readForm(req);
  const result = record(db, form, ctx);
  if (result.error) {
    return html(res, 400, noticePage('Răspuns invalid', result.error));
  }
  return redirect(res, `/multumim?scor=${result.response.score}`);
}

// POST /api/raspunsuri — acelasi lucru, pentru integrari (widget, app mobil).
export async function submitResponseApi(req, res, ctx) {
  const { db } = ctx;
  const form = await readForm(req);
  const result = record(db, form, ctx);
  if (result.error) return json(res, 400, { ok: false, error: result.error });
  return json(res, 201, {
    ok: true,
    id: result.response.id,
    score: result.response.score,
    category: result.response.category,
  });
}

export function thanks(req, res, { url }) {
  const score = url.searchParams.get('scor');
  return html(
    res,
    200,
    thanksPage({
      score: isValidScore(score) ? score : null,
      offline: url.searchParams.get('offline') === '1',
    }),
  );
}

export function privacy(req, res) {
  return html(res, 200, privacyPage(operatorFromEnv()));
}

// POST /sterge-date/:token — dreptul la stergere, direct din linkul primit pe email.
export function eraseMyData(req, res, { db, params }) {
  const invite = getInviteByToken(db, params.token);
  if (!invite) {
    return html(res, 404, noticePage('Link invalid', 'Linkul nu mai este valabil.'));
  }
  const rezultat = anonymizeContact(db, invite.contact_id);
  return html(
    res,
    200,
    noticePage(
      'Datele au fost șterse',
      `Nu mai păstrăm numele, emailul sau telefonul pentru ${rezultat.email}. ` +
        'Notele rămân doar ca cifre anonime, fără legătură cu tine.',
    ),
  );
}

export function offline(req, res) {
  return html(res, 200, offlinePage());
}

// Logica partajata de formular si API.
function record(db, form, ctx = {}) {
  const score = Number(form.score ?? form.scor);
  if (!isValidScore(score)) return { error: 'Scorul trebuie să fie un număr întreg între 0 și 10.' };
  const comment = typeof form.comment === 'string' ? form.comment.trim().slice(0, 2000) : null;
  const category = categorize(score);

  const location = resolveLocation(db, form.loc);

  if (form.token) {
    const invite = getInviteByToken(db, form.token);
    if (!invite) return { error: 'Link invalid sau expirat.' };
    if (!invite.active) return { error: 'Campania nu mai primește răspunsuri.' };
    const response = saveResponse(db, {
      campaignId: invite.campaign_id,
      inviteId: invite.id,
      contactId: invite.contact_id,
      score,
      category,
      comment,
      source: 'invitatie',
      locationId: location ? location.id : null,
    });
    storeAnswers(db, invite.campaign_id, response.id, form);
    anunta(db, response, ctx);
    return { response };
  }

  const campaign = getCampaignBySlug(db, String(form.slug || ''));
  if (!campaign) return { error: 'Campanie inexistentă.' };
  if (!campaign.active) return { error: 'Campania nu mai primește răspunsuri.' };
  const response = saveResponse(db, {
    campaignId: campaign.id,
    score,
    category,
    comment,
    source: location ? 'qr' : 'link-public',
    locationId: location ? location.id : null,
  });
  storeAnswers(db, campaign.id, response.id, form);
  anunta(db, response, ctx);
  return { response };
}

// Alerta pentru detractori pleaca in fundal: clientul nu asteapta dupa email.
function anunta(db, response, ctx) {
  if (!ctx || response.category !== 'detractor') return;
  alertInBackground(db, response.id, {
    mailer: ctx.mailer,
    publicUrl: ctx.publicUrl,
    config: ctx.alertConfig,
  });
}

// Locatia vine din codul QR scanat (?loc=...) sau din campul ascuns al formularului.
function resolveLocation(db, slug) {
  if (!slug) return null;
  const location = getLocationBySlug(db, String(slug));
  return location && location.active ? location : null;
}

// Raspunsurile la intrebarile suplimentare vin ca q_<id> in formular sau ca
// obiectul `answers` in API.
function storeAnswers(db, campaignId, responseId, form) {
  const questions = listQuestions(db, campaignId);
  if (!questions.length) return;
  const fromApi = form.answers && typeof form.answers === 'object' ? form.answers : {};
  const answers = questions.map((q) => ({
    questionId: q.id,
    value: form[`q_${q.id}`] ?? fromApi[q.id] ?? fromApi[String(q.id)] ?? null,
  }));
  saveAnswers(db, responseId, answers);
}

export function home(req, res, { db, publicUrl }) {
  const active = db.prepare('SELECT slug, name FROM campaigns WHERE active = 1 ORDER BY created_at DESC').all();
  const links = active.length
    ? `<ul>${active
        .map((c) => `<li><a href="/s/${escapeHtml(c.slug)}">${escapeHtml(c.name)}</a></li>`)
        .join('')}</ul>`
    : '<p class="muted">Nicio campanie activă.</p>';
  return html(
    res,
    200,
    `<!doctype html><html lang="ro"><head><meta charset="utf-8">
     <meta name="viewport" content="width=device-width,initial-scale=1"><title>Equil NPS</title>
     <style>body{font:15px/1.6 system-ui,sans-serif;max-width:620px;margin:60px auto;padding:0 16px}</style>
     </head><body><h1>Equil NPS</h1><p>Sondaje active:</p>${links}
     <p><a href="/admin">Administrare</a></p>
     <p style="color:#666;font-size:13px">${escapeHtml(publicUrl)}</p></body></html>`,
  );
}

// GET /dezabonare/:token — confirmarea dezabonarii (nu o executam la GET, ca sa nu
// dezaboneze scanerele de linkuri din clientii de email).
export function unsubscribeForm(req, res, { db, params }) {
  const invite = getInviteByToken(db, params.token);
  if (!invite) {
    return html(res, 404, noticePage('Link invalid', 'Linkul de dezabonare nu mai este valabil.'));
  }
  const body = `<div class="card">
    <h1>Dezabonare</h1>
    <p class="sub">Adresa <strong>${escapeHtml(invite.email)}</strong> nu va mai primi invitații
    sau reamintiri legate de sondajele noastre.</p>
    <form method="POST" action="/dezabonare/${escapeHtml(invite.token)}">
      <button class="btn" type="submit">Confirmă dezabonarea</button>
    </form>
    <hr style="border:0;border-top:1px solid var(--line);margin:20px 0">
    <h2 style="margin:0 0 6px;font-size:15px">Vrei să dispară complet datele tale?</h2>
    <p class="small muted">Ștergem numele, emailul și telefonul. Notele rămân doar ca cifre anonime,
    fără legătură cu tine. Este dreptul tău, conform GDPR.</p>
    <form method="POST" action="/sterge-date/${escapeHtml(invite.token)}">
      <button class="btn ghost" type="submit">Șterge-mi datele</button>
    </form>
    <p class="small muted" style="margin-top:16px">
      <a href="/confidentialitate">Cum folosim datele</a>
    </p>
  </div>`;
  return html(res, 200, pageShell({ title: 'Dezabonare', body, narrow: true }));
}

// POST /dezabonare/:token — executa dezabonarea. Acelasi endpoint serveste si
// butonul "Unsubscribe" al Gmail/Outlook (List-Unsubscribe-Post: One-Click).
export function unsubscribe(req, res, { db, params }) {
  const invite = unsubscribeByToken(db, params.token);
  if (!invite) {
    return html(res, 404, noticePage('Link invalid', 'Linkul de dezabonare nu mai este valabil.'));
  }
  return html(
    res,
    200,
    noticePage('Te-am scos de pe listă', `Nu vom mai trimite emailuri către ${invite.email}.`),
  );
}
