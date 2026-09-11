// Alerta imediata cand apare un detractor (scor 0-6). Merge pe doua canale:
// email catre echipa si webhook (Slack / Telegram / Zapier), ca sa ajunga pe
// telefon in cateva secunde, nu la urmatoarea vizita in dashboard.
import {
  getResponseWithContext, claimAlert, releaseAlert, logAlert, countAlertsSince,
} from './db.js';
import { detractorAlertEmail, detractorAlertText } from './emails.js';

export function alertConfigFromEnv(env = process.env) {
  return {
    emails: String(env.ALERT_EMAILS || '')
      .split(',')
      .map((e) => e.trim())
      .filter((e) => e.includes('@')),
    webhookUrl: env.ALERT_WEBHOOK_URL || '',
    // Alertam pentru orice scor sub acest prag (implicit: detractorii, 0-6).
    maxScore: env.ALERT_MAX_SCORE === undefined ? 6 : Number(env.ALERT_MAX_SCORE),
    // Plasa de siguranta: daca ceva merge prost si intra 200 de raspunsuri,
    // nu vrem 200 de emailuri. Restul raman in pagina de alerte.
    maxPerHour: Number(env.ALERT_MAX_PER_HOUR) || 20,
    timeoutMs: Number(env.ALERT_TIMEOUT_MS) || 8000,
  };
}

export function alertsEnabled(config) {
  return Boolean(config.emails.length || config.webhookUrl);
}

export function alertsDescription(config) {
  if (!alertsEnabled(config)) return 'nicio alertă configurată (ALERT_EMAILS / ALERT_WEBHOOK_URL)';
  const parts = [];
  if (config.emails.length) parts.push(`email către ${config.emails.join(', ')}`);
  if (config.webhookUrl) parts.push('webhook');
  return parts.join(' și ');
}

// Alertele nu trebuie sa intarzie raspunsul clientului, deci pleaca in fundal.
// Le tinem intr-un set ca testele (si oprirea serverului) sa le poata astepta.
const pending = new Set();

export function alertInBackground(db, responseId, ctx) {
  const promise = handleNewResponse(db, responseId, ctx)
    .catch((err) => console.error('[alerta] esuata:', err.message))
    .finally(() => pending.delete(promise));
  pending.add(promise);
  return promise;
}

export function flushAlerts() {
  return Promise.all([...pending]);
}

export async function handleNewResponse(db, responseId, { mailer, publicUrl, config = alertConfigFromEnv() }) {
  if (!alertsEnabled(config)) return { trimis: false, motiv: 'neconfigurat' };

  const response = getResponseWithContext(db, responseId);
  if (!response) return { trimis: false, motiv: 'raspuns inexistent' };
  if (response.score > config.maxScore) return { trimis: false, motiv: 'nu e detractor' };
  if (!response.alert_detractors) return { trimis: false, motiv: 'alerte oprite pe campanie' };

  // Un raspuns actualizat (acelasi link, scor schimbat) nu realerteaza.
  if (!claimAlert(db, responseId)) return { trimis: false, motiv: 'deja alertat' };

  if (countAlertsSince(db, 60) >= config.maxPerHour) {
    logAlert(db, {
      responseId,
      channel: 'limita',
      status: 'sarit',
      detail: `peste ${config.maxPerHour} alerte in ultima ora`,
    });
    return { trimis: false, motiv: 'limita orara' };
  }

  const rezultate = [];
  let macarUna = false;

  if (config.emails.length && mailer) {
    const mesaj = detractorAlertEmail({ response, publicUrl });
    for (const to of config.emails) {
      try {
        await mailer.send({ to, subject: mesaj.subject, html: mesaj.html, text: mesaj.text });
        logAlert(db, { responseId, channel: 'email', target: to, status: 'trimis' });
        macarUna = true;
        rezultate.push({ canal: 'email', to, ok: true });
      } catch (err) {
        logAlert(db, { responseId, channel: 'email', target: to, status: 'eroare', detail: err.message });
        rezultate.push({ canal: 'email', to, ok: false, eroare: err.message });
      }
    }
  }

  if (config.webhookUrl) {
    try {
      await sendWebhook(config, response, publicUrl);
      logAlert(db, { responseId, channel: 'webhook', target: hostOf(config.webhookUrl), status: 'trimis' });
      macarUna = true;
      rezultate.push({ canal: 'webhook', ok: true });
    } catch (err) {
      logAlert(db, {
        responseId, channel: 'webhook', target: hostOf(config.webhookUrl),
        status: 'eroare', detail: err.message,
      });
      rezultate.push({ canal: 'webhook', ok: false, eroare: err.message });
    }
  }

  // Daca n-a plecat nimic, eliberam marcajul ca alerta sa poata fi reincercata.
  if (!macarUna) releaseAlert(db, responseId);

  return { trimis: macarUna, rezultate };
}

// Corpul e compatibil cu Slack (campul `text`), iar restul campurilor sunt utile
// pentru Zapier/Make sau pentru un endpoint propriu. Pentru Telegram, pune
// chat_id in adresa: https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>
async function sendWebhook(config, response, publicUrl) {
  const text = detractorAlertText({ response, publicUrl });
  const payload = {
    text,
    tip: 'detractor',
    scor: response.score,
    comentariu: response.comment,
    client: response.contact_name || response.email || null,
    email: response.email || null,
    companie: response.company || null,
    locatie: response.location_name || null,
    campanie: response.campaign_name,
    data: response.created_at,
    link: `${publicUrl}/admin/alerte`,
  };

  const res = await fetch(config.webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(config.timeoutMs),
  });
  if (!res.ok) throw new Error(`webhook a raspuns ${res.status}`);
  return true;
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'webhook';
  }
}
