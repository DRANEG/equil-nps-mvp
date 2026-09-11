import { escapeHtml } from '../http.js';
import { page } from './layout.js';

export function surveyPage({
  campaign, token, slug, preselected = null, greeting = null, error = null,
  questions = [], location = null,
}) {
  const scale = Array.from({ length: 11 }, (_, i) => {
    const checked = String(preselected) === String(i) ? ' checked' : '';
    return `<label><input type="radio" name="score" value="${i}" required${checked}><span>${i}</span></label>`;
  }).join('');

  const body = `
<div class="card">
  <h1>${escapeHtml(campaign.name)}</h1>
  ${greeting ? `<p class="sub">${escapeHtml(greeting)}</p>` : '<p class="sub">Răspunsul tău durează mai puțin de un minut.</p>'}
  ${location ? `<p class="small muted" style="margin:-12px 0 14px">📍 ${escapeHtml(location.name)}</p>` : ''}
  ${error ? `<div class="flash">${escapeHtml(error)}</div>` : ''}
  <form method="POST" action="/raspunde" data-sondaj>
    ${token ? `<input type="hidden" name="token" value="${escapeHtml(token)}">` : ''}
    ${slug ? `<input type="hidden" name="slug" value="${escapeHtml(slug)}">` : ''}
    ${location ? `<input type="hidden" name="loc" value="${escapeHtml(location.slug)}">` : ''}
    <fieldset style="border:0;padding:0;margin:0">
      <legend style="font-weight:600;padding:0">${escapeHtml(campaign.question)}</legend>
      <div class="scale">${scale}</div>
      <div class="scale-ends"><span>0 &ndash; deloc probabil</span><span>10 &ndash; foarte probabil</span></div>
    </fieldset>
    <label for="comment">${escapeHtml(campaign.followup)} <span class="hint">(opțional)</span></label>
    <textarea id="comment" name="comment" rows="4" maxlength="2000"></textarea>
    ${questions.map(questionField).join('')}
    <p style="margin-top:16px"><button class="btn" type="submit">Trimite răspunsul</button></p>
  </form>
</div>
<p class="small muted">Datele sunt folosite doar pentru îmbunătățirea serviciului.</p>`;

  return page({ title: campaign.name, body, narrow: true, scripts: ['/sondaj.js'] });
}

// Intrebarile suplimentare: rating 1-5, alegere dintr-o lista sau text liber.
function questionField(question) {
  const id = `q_${question.id}`;
  const eticheta = `<label for="${id}">${escapeHtml(question.text)}${
    question.required ? '' : ' <span class="hint">(opțional)</span>'
  }</label>`;

  if (question.kind === 'rating') {
    const scale = [1, 2, 3, 4, 5]
      .map(
        (n) => `<label><input type="radio" name="${id}" value="${n}"${question.required ? ' required' : ''}><span>${n}</span></label>`,
      )
      .join('');
    return `<fieldset style="border:0;padding:0;margin:14px 0 0">
      <legend style="font-weight:600;font-size:13px;padding:0">${escapeHtml(question.text)}${
        question.required ? '' : ' <span class="hint" style="font-weight:400">(opțional)</span>'
      }</legend>
      <div class="scale scale--5">${scale}</div>
      <div class="scale-ends"><span>1 &ndash; deloc</span><span>5 &ndash; foarte mult</span></div>
    </fieldset>`;
  }

  if (question.kind === 'choice') {
    const options = (question.options || [])
      .map(
        (option) => `<label class="choice">
          <input type="radio" name="${id}" value="${escapeHtml(option)}"${question.required ? ' required' : ''}>
          <span>${escapeHtml(option)}</span>
        </label>`,
      )
      .join('');
    return `<fieldset style="border:0;padding:0;margin:14px 0 0">
      <legend style="font-weight:600;font-size:13px;padding:0">${escapeHtml(question.text)}${
        question.required ? '' : ' <span class="hint" style="font-weight:400">(opțional)</span>'
      }</legend>
      <div class="choices">${options}</div>
    </fieldset>`;
  }

  return `${eticheta}<textarea id="${id}" name="${id}" rows="3" maxlength="2000"${
    question.required ? ' required' : ''
  }></textarea>`;
}

export function thanksPage({ score = null, campaignName = '', offline = false }) {
  const body = `
<div class="card" style="text-align:center">
  <h1>Mulțumim!</h1>
  <p class="sub">${
    offline
      ? 'Nu ai semnal acum, dar răspunsul tău este salvat pe telefon și pleacă singur când revine conexiunea.'
      : `Am înregistrat răspunsul tău${score === null ? '' : ` (scor ${escapeHtml(score)}/10)`}.`
  }
  ${campaignName ? `<br>Campanie: ${escapeHtml(campaignName)}` : ''}</p>
  <p class="muted small">Feedback-ul ajunge direct la echipa care se ocupă de acest serviciu.</p>
</div>`;
  return page({ title: 'Mulțumim', body, narrow: true, scripts: ['/sondaj.js'] });
}

// Pagina afisata de service worker cand nu exista conexiune si nici copie in cache.
export function offlinePage() {
  const body = `<div class="card" style="text-align:center">
    <h1>Nu ai conexiune</h1>
    <p class="sub">Pagina nu poate fi încărcată acum. Încearcă din nou după ce revine semnalul.</p>
    <p><button class="btn" type="button" onclick="location.reload()">Reîncarcă</button></p>
  </div>`;
  return page({ title: 'Fără conexiune', body, narrow: true });
}

export function noticePage(title, message) {
  const body = `<div class="card"><h1>${escapeHtml(title)}</h1><p class="sub">${escapeHtml(message)}</p></div>`;
  return page({ title, body, narrow: true });
}
