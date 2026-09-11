import { escapeHtml } from '../http.js';
import { page } from './layout.js';

export function surveyPage({ campaign, token, slug, preselected = null, greeting = null, error = null }) {
  const scale = Array.from({ length: 11 }, (_, i) => {
    const checked = String(preselected) === String(i) ? ' checked' : '';
    return `<label><input type="radio" name="score" value="${i}" required${checked}><span>${i}</span></label>`;
  }).join('');

  const body = `
<div class="card">
  <h1>${escapeHtml(campaign.name)}</h1>
  ${greeting ? `<p class="sub">${escapeHtml(greeting)}</p>` : '<p class="sub">Răspunsul tău durează mai puțin de un minut.</p>'}
  ${error ? `<div class="flash">${escapeHtml(error)}</div>` : ''}
  <form method="POST" action="/raspunde">
    ${token ? `<input type="hidden" name="token" value="${escapeHtml(token)}">` : ''}
    ${slug ? `<input type="hidden" name="slug" value="${escapeHtml(slug)}">` : ''}
    <fieldset style="border:0;padding:0;margin:0">
      <legend style="font-weight:600;padding:0">${escapeHtml(campaign.question)}</legend>
      <div class="scale">${scale}</div>
      <div class="scale-ends"><span>0 &ndash; deloc probabil</span><span>10 &ndash; foarte probabil</span></div>
    </fieldset>
    <label for="comment">${escapeHtml(campaign.followup)} <span class="hint">(optional)</span></label>
    <textarea id="comment" name="comment" rows="4" maxlength="2000"></textarea>
    <p style="margin-top:16px"><button class="btn" type="submit">Trimite răspunsul</button></p>
  </form>
</div>
<p class="small muted">Datele sunt folosite doar pentru îmbunătățirea serviciului.</p>`;

  return page({ title: campaign.name, body, narrow: true });
}

export function thanksPage({ score = null, campaignName = '' }) {
  const body = `
<div class="card" style="text-align:center">
  <h1>Mulțumim!</h1>
  <p class="sub">Am înregistrat răspunsul tău${score === null ? '' : ` (scor ${escapeHtml(score)}/10)`}.
  ${campaignName ? `<br>Campanie: ${escapeHtml(campaignName)}` : ''}</p>
  <p class="muted small">Feedback-ul ajunge direct la echipa care se ocupă de acest serviciu.</p>
</div>`;
  return page({ title: 'Mulțumim', body, narrow: true });
}

export function noticePage(title, message) {
  const body = `<div class="card"><h1>${escapeHtml(title)}</h1><p class="sub">${escapeHtml(message)}</p></div>`;
  return page({ title, body, narrow: true });
}
