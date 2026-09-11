import { html, json, redirect, readForm, escapeHtml } from '../http.js';
import { surveyPage, thanksPage, noticePage } from '../views/survey.js';
import { categorize, isValidScore } from '../nps.js';
import { getCampaignBySlug, getInviteByToken, saveResponse } from '../db.js';

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
  return html(res, 200, surveyPage({ campaign, slug: campaign.slug, preselected }));
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
    }),
  );
}

// POST /raspunde — trimiterea formularului (token sau slug).
export async function submitResponse(req, res, { db }) {
  const form = await readForm(req);
  const result = record(db, form);
  if (result.error) {
    return html(res, 400, noticePage('Răspuns invalid', result.error));
  }
  return redirect(res, `/multumim?scor=${result.response.score}`);
}

// POST /api/raspunsuri — acelasi lucru, pentru integrari (widget, app mobil).
export async function submitResponseApi(req, res, { db }) {
  const form = await readForm(req);
  const result = record(db, form);
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
  return html(res, 200, thanksPage({ score: isValidScore(score) ? score : null }));
}

// Logica partajata de formular si API.
function record(db, form) {
  const score = Number(form.score ?? form.scor);
  if (!isValidScore(score)) return { error: 'Scorul trebuie să fie un număr întreg între 0 și 10.' };
  const comment = typeof form.comment === 'string' ? form.comment.trim().slice(0, 2000) : null;
  const category = categorize(score);

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
    });
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
    source: 'link-public',
  });
  return { response };
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
