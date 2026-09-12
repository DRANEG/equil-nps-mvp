import { escapeHtml } from '../http.js';
import { page, adminNav } from './layout.js';
import { label as npsLabel } from '../nps.js';
import { formatDateTime, formatMonth, timeAgo, formatPhone } from '../format.js';

const CAT_RO = { promoter: 'Promotor', passive: 'Pasiv', detractor: 'Detractor' };

export function loginPage(error = null) {
  const body = `
<div class="card">
  <h1>Equil NPS &mdash; administrare</h1>
  <p class="sub">Introdu parola de acces (variabila ADMIN_TOKEN).</p>
  ${error ? `<div class="flash">${escapeHtml(error)}</div>` : ''}
  <form method="POST" action="/admin/login">
    <label for="token">Parola</label>
    <input id="token" name="token" type="password" autofocus required>
    <p style="margin-top:16px"><button class="btn" type="submit">Intră</button></p>
  </form>
</div>`;
  return page({ title: 'Autentificare', body, narrow: true });
}

export function dashboardPage({
  summary, moe, trend, segments, locations = [], questions = [], recent,
  campaigns, campaignId, invitesSent, publicUrl, openAlerts = 0,
}) {
  const filter = campaignSelect(campaigns, campaignId, '/admin');
  const responseRate = invitesSent ? Math.round((summary.total / invitesSent) * 100) : null;

  const body = `
<h1>Dashboard</h1>
<p class="sub">Indicatorii NPS pentru ${campaignId ? 'campania selectată' : 'toate campaniile'}.</p>
${filter}
<div class="grid">
  ${kpi('Scor NPS', summary.nps === null ? '&mdash;' : formatNps(summary.nps),
        summary.nps === null ? 'fără răspunsuri' : `${npsLabel(summary.nps)}${moe === null ? '' : ` &plusmn; ${moe}`}`)}
  ${kpi('Răspunsuri', summary.total, responseRate === null ? 'link public' : `${responseRate}% rată de răspuns`)}
  ${kpi('Promotori', `${summary.promoterPct}%`, `${summary.promoters} persoane`)}
  ${kpi(
    'Detractori',
    `${summary.detractorPct}%`,
    openAlerts
      ? `<a href="/admin/alerte">${openAlerts} de contactat</a>`
      : `${summary.detractors} persoane`,
  )}
</div>

<div class="card">
  <h2 style="margin-top:0">Distribuția răspunsurilor</h2>
  ${distributionBar(summary)}
  <p class="small muted" style="margin-top:10px">
    Detractori (0&ndash;6): ${summary.detractors} &middot;
    Pasivi (7&ndash;8): ${summary.passives} &middot;
    Promotori (9&ndash;10): ${summary.promoters} &middot;
    Scor mediu: ${summary.average ?? '&mdash;'}
  </p>
  ${histogram(summary.distribution)}
</div>

<div class="card">
  <h2 style="margin-top:0">Evoluție lunară</h2>
  ${trendChart(trend)}
</div>

<div class="card">
  <h2 style="margin-top:0">Defalcare pe segment</h2>
  ${breakdownTable(segments)}
</div>

<div class="card">
  <h2 style="margin-top:0">Defalcare pe locație</h2>
  ${breakdownTable(locations, 'Locație')}
</div>

${questionResultsCard(questions)}

<div class="card">
  <h2 style="margin-top:0">Ultimele comentarii</h2>
  ${recentList(recent)}
  <p style="margin-top:12px"><a class="btn ghost" href="/admin/raspunsuri">Toate răspunsurile</a></p>
</div>

<p class="small muted">Link public de test: <code>${escapeHtml(publicUrl)}/s/&lt;slug-campanie&gt;</code></p>`;

  return page({ title: 'Dashboard NPS', body, nav: adminNav('home', openAlerts) });
}

export function campaignsPage({ campaigns, publicUrl, flash }) {
  const rows = campaigns.length
    ? campaigns
        .map(
          (c) => `<tr>
            <td><a href="/admin/campanii/${c.id}">${escapeHtml(c.name)}</a>
              <div class="small muted">${escapeHtml(publicUrl)}/s/${escapeHtml(c.slug)}</div></td>
            <td>${c.active ? '<span class="tag promoter">activă</span>' : '<span class="tag passive">închisă</span>'}</td>
            <td class="num">${c.invites}</td>
            <td class="num">${c.responses}</td>
            <td class="small muted">${formatDateTime(c.created_at)}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="5" class="muted">Nicio campanie încă.</td></tr>';

  const body = `
<h1>Campanii</h1>
<p class="sub">O campanie = un val de măsurare (ex. „NPS trimestrial Q1” sau „După livrare”).</p>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
<div class="card">
  <table>
    <thead><tr><th>Campanie</th><th>Status</th><th class="num">Invitații</th><th class="num">Răspunsuri</th><th>Creată</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
<div class="card">
  <h2 style="margin-top:0">Campanie noua</h2>
  <form method="POST" action="/admin/campanii">
    <label for="name">Nume</label>
    <input id="name" name="name" type="text" required placeholder="NPS trimestrial Q1">
    <label for="question">Întrebarea principală</label>
    <input id="question" name="question" type="text"
      placeholder="Cât de probabil este să ne recomanzi unui prieten sau coleg?">
    <label for="followup">Întrebarea deschisă</label>
    <input id="followup" name="followup" type="text"
      placeholder="Care este principalul motiv pentru scorul acordat?">
    <p style="margin-top:16px"><button class="btn" type="submit">Creează</button></p>
  </form>
</div>`;
  return page({ title: 'Campanii', body, nav: adminNav('campaigns') });
}

export function campaignDetailPage({ campaign, summary, invites, publicUrl, email, questions = [], flash }) {
  const pending = invites.filter((i) => !i.responded_at).length;
  const rows = invites.length
    ? invites
        .map(
          (i) => `<tr>
            <td>${escapeHtml(i.contact_name || '')}<div class="small muted">${escapeHtml(i.email)}</div></td>
            <td class="small">${escapeHtml(i.segment || '')}</td>
            <td class="num">${i.score === null || i.score === undefined ? '<span class="muted">&mdash;</span>' : i.score}</td>
            <td class="small">${i.responded_at ? formatDateTime(i.responded_at) : '<span class="muted">în așteptare</span>'}</td>
            <td class="small">${inviteEmailState(i)}</td>
            <td class="small"><code>${escapeHtml(publicUrl)}/r/${escapeHtml(i.token)}</code></td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="6" class="muted">Nicio invitație generată.</td></tr>';

  const body = `
<h1>${escapeHtml(campaign.name)}</h1>
<p class="sub">${escapeHtml(campaign.question)}</p>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}

<div class="grid">
  ${kpi('Scor NPS', summary.nps === null ? '&mdash;' : formatNps(summary.nps), npsLabel(summary.nps))}
  ${kpi('Răspunsuri', summary.total, `${pending} în așteptare`)}
  ${kpi('Invitații', invites.length, 'contacte incluse')}
</div>

<div class="card">
  <h2 style="margin-top:0">Link public</h2>
  <p class="small">Oricine deschide acest link poate răspunde anonim (util pentru site, email de mulțumire, QR):</p>
  <pre>${escapeHtml(publicUrl)}/s/${escapeHtml(campaign.slug)}</pre>
  <form method="POST" action="/admin/campanii/${campaign.id}/status" class="row">
    <input type="hidden" name="active" value="${campaign.active ? 0 : 1}">
    <button class="btn ghost" type="submit">${campaign.active ? 'Închide campania' : 'Redeschide campania'}</button>
  </form>
</div>

${questionsCard(campaign, questions)}

${emailCard(campaign, email)}

<div class="card">
  <h2 style="margin-top:0">Adaugă contacte</h2>
  <p class="small muted">Câte un contact pe linie, format: <code>email, nume, companie, segment</code>
  (doar emailul este obligatoriu). Fiecare contact primește un link unic, ca să știi cine a răspuns.</p>
  <form method="POST" action="/admin/campanii/${campaign.id}/invitatii">
    <textarea name="contacts" rows="6" placeholder="ana@client.ro, Ana Pop, Client SRL, Enterprise
mihai@client.ro, Mihai Ionescu, Alt Client SRL, IMM"></textarea>
    <p style="margin-top:16px"><button class="btn" type="submit">Generează linkuri</button></p>
  </form>
</div>

<div class="card">
  <div class="row" style="justify-content:space-between">
    <h2 style="margin:0">Invitații (${invites.length})</h2>
    <a class="btn ghost" href="/admin/campanii/${campaign.id}/invitatii.csv">Export CSV pentru mail-merge</a>
  </div>
  <table style="margin-top:12px">
    <thead><tr><th>Contact</th><th>Segment</th><th class="num">Scor</th><th>Răspuns la</th><th>Email</th><th>Link personal</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>
<p><a href="/admin/campanii">&larr; Toate campaniile</a></p>`;

  return page({ title: campaign.name, body, nav: adminNav('campaigns') });
}

export function responsesPage({ responses, campaigns, campaignId, category }) {
  const rows = responses.length
    ? responses
        .map(
          (r) => `<tr>
            <td class="small">${formatDateTime(r.created_at)}</td>
            <td class="num"><strong>${r.score}</strong></td>
            <td><span class="tag ${r.category}">${CAT_RO[r.category]}</span></td>
            <td>${escapeHtml(r.contact_name || r.email || 'anonim')}
              ${r.company ? `<div class="small muted">${escapeHtml(r.company)}</div>` : ''}</td>
            <td class="small">${escapeHtml(r.campaign_name)}</td>
            <td>${r.comment ? escapeHtml(r.comment) : '<span class="muted">&mdash;</span>'}</td>
            <td>${closeButton(r)}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="7" class="muted">Niciun răspuns încă.</td></tr>';

  const catFilter = ['', 'detractor', 'passive', 'promoter']
    .map(
      (c) =>
        `<option value="${c}"${category === c ? ' selected' : ''}>${c ? CAT_RO[c] : 'Toate categoriile'}</option>`,
    )
    .join('');

  const body = `
<h1>Răspunsuri</h1>
<p class="sub">Lista completă, cu comentarii. „Închide bucla” marchează cazurile în care ai revenit către client.</p>
<form method="GET" action="/admin/raspunsuri" class="card row">
  <select name="campanie" style="max-width:280px">
    <option value="">Toate campaniile</option>
    ${campaigns.map((c) => `<option value="${c.id}"${campaignId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
  </select>
  <select name="categorie" style="max-width:220px">${catFilter}</select>
  <button class="btn ghost" type="submit">Filtrează</button>
  <a class="btn ghost" href="/admin/raspunsuri.csv${campaignId ? `?campanie=${campaignId}` : ''}">Export CSV</a>
</form>
<div class="card">
  <table>
    <thead><tr><th>Data</th><th class="num">Scor</th><th>Categorie</th><th>Respondent</th><th>Campanie</th><th>Comentariu</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</div>`;
  return page({ title: 'Răspunsuri', body, nav: adminNav('responses') });
}

/* --------------------------------- fragmente --------------------------------- */

function inviteEmailState(invite) {
  if (invite.unsubscribed_at) return '<span class="tag detractor">dezabonat</span>';
  if (invite.send_error) {
    return `<span class="tag detractor" title="${escapeHtml(invite.send_error)}">eroare</span>`;
  }
  if (invite.reminder_sent_at) {
    return `<span class="tag promoter">reminder</span><div class="small muted">${formatDateTime(invite.reminder_sent_at)}</div>`;
  }
  if (invite.sent_at) {
    return `<span class="tag passive">trimis</span><div class="small muted">${formatDateTime(invite.sent_at)}</div>`;
  }
  return '<span class="muted">netrimis</span>';
}

function emailCard(campaign, email) {
  if (!email) return '';
  const { stats, log, transport, mode, reminderDays, delayMinutes } = email;
  const modeNote =
    mode === 'smtp'
      ? `Trimitere reală prin ${escapeHtml(transport)}.`
      : `Nu e configurat SMTP: emailurile se salvează ca fișiere .eml (${escapeHtml(transport)}), nu pleacă nicăieri.`;

  const logRows = log.length
    ? log
        .map(
          (e) => `<tr>
            <td class="small">${formatDateTime(e.created_at)}</td>
            <td class="small">${escapeHtml(e.kind)}</td>
            <td class="small">${escapeHtml(e.recipient)}</td>
            <td class="small">${e.status === 'trimis' ? '<span class="tag promoter">trimis</span>' : `<span class="tag detractor" title="${escapeHtml(e.detail || '')}">eroare</span>`}</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="4" class="muted">Nimic trimis încă.</td></tr>';

  return `<div class="card">
  <h2 style="margin-top:0">Trimitere pe email</h2>
  <p class="small muted">${modeNote}</p>
  <div class="row" style="gap:24px;margin:12px 0">
    <div><div class="name small muted">DE TRIMIS</div><strong>${stats.de_trimis}</strong></div>
    <div><div class="name small muted">TRIMISE</div><strong>${stats.trimise}</strong></div>
    <div><div class="name small muted">REMINDERE</div><strong>${stats.remindere}</strong></div>
    <div><div class="name small muted">ERORI</div><strong>${stats.erori}</strong></div>
    <div><div class="name small muted">DEZABONAȚI</div><strong>${stats.dezabonati}</strong></div>
  </div>
  <p class="small muted">
    Robotul trimite invitațiile la ${delayMinutes} minute după import (ca să ai timp să corectezi lista)
    și o singură reamintire după ${reminderDays} zile, doar celor care nu au răspuns.
  </p>
  <div class="row">
    <form method="POST" action="/admin/campanii/${campaign.id}/trimite">
      <button class="btn" type="submit">Trimite acum ce e în așteptare</button>
    </form>
    <form method="POST" action="/admin/campanii/${campaign.id}/auto">
      <input type="hidden" name="auto" value="${campaign.auto_send ? 0 : 1}">
      <button class="btn ghost" type="submit">
        ${campaign.auto_send ? 'Oprește trimiterea automată' : 'Pornește trimiterea automată'}
      </button>
    </form>
    <span class="small ${campaign.auto_send ? '' : 'muted'}">
      Trimitere automată: <strong>${campaign.auto_send ? 'pornită' : 'oprită'}</strong>
    </span>
  </div>
  <div class="row" style="margin-top:10px">
    <form method="POST" action="/admin/campanii/${campaign.id}/alerte">
      <input type="hidden" name="alerte" value="${campaign.alert_detractors ? 0 : 1}">
      <button class="btn ghost" type="submit">
        ${campaign.alert_detractors ? 'Oprește alertele la detractori' : 'Pornește alertele la detractori'}
      </button>
    </form>
    <span class="small ${campaign.alert_detractors ? '' : 'muted'}">
      Alertă imediată la scor 0–6: <strong>${campaign.alert_detractors ? 'pornită' : 'oprită'}</strong>
    </span>
  </div>
  <table style="margin-top:16px">
    <thead><tr><th>Data</th><th>Tip</th><th>Destinatar</th><th>Stare</th></tr></thead>
    <tbody>${logRows}</tbody>
  </table>
</div>`;
}

function closeButton(r) {
  if (r.closed_at) {
    return `<span class="small muted" title="${formatDateTime(r.closed_at)}">rezolvat</span>`;
  }
  return `<form method="POST" action="/admin/raspunsuri/${r.id}/inchide">
    <button class="btn ghost small" type="submit">Închide bucla</button>
  </form>`;
}

function kpi(name, value, note = '') {
  return `<div class="card kpi">
    <div class="name">${name}</div>
    <div class="value">${value}</div>
    ${note ? `<div class="note">${note}</div>` : ''}
  </div>`;
}

function formatNps(nps) {
  return nps > 0 ? `+${nps}` : String(nps);
}

function distributionBar(s) {
  if (!s.total) return '<p class="muted">Fără răspunsuri.</p>';
  return `<div class="bar">
    <span class="d" style="width:${s.detractorPct}%"></span>
    <span class="n" style="width:${s.passivePct}%"></span>
    <span class="p" style="width:${s.promoterPct}%"></span>
  </div>`;
}

function histogram(distribution) {
  const max = Math.max(...distribution, 1);
  const bars = distribution
    .map((n, i) => {
      const cls = i <= 6 ? 'd' : i <= 8 ? 'n' : 'p';
      const color = cls === 'p' ? 'var(--ok)' : cls === 'n' ? '#f0b429' : 'var(--bad)';
      return `<div title="${i}: ${n} răspunsuri" style="height:${Math.round((n / max) * 100)}%;background:${color}"></div>`;
    })
    .join('');
  return `<div class="spark" style="margin-top:14px">${bars}</div>
    <div class="spark-labels">${distribution.map((_, i) => `<div>${i}</div>`).join('')}</div>`;
}

function trendChart(trend) {
  if (!trend.length) return '<p class="muted">Fără date istorice.</p>';
  // NPS-ul merge de la -100 la +100; il aducem in 0..100% pentru inaltimea barei.
  const bars = trend
    .map(
      (t) =>
        `<div title="${t.month}: NPS ${t.nps ?? '-'} (${t.total} răspunsuri)" style="height:${Math.max(2, Math.round(((t.nps ?? 0) + 100) / 2))}%"></div>`,
    )
    .join('');
  return `<div class="spark">${bars}</div>
    <div class="spark-labels">${trend.map((t) => `<div>${formatMonth(t.month)}</div>`).join('')}</div>
    <p class="small muted">Ultima lună: NPS ${trend.at(-1).nps ?? '&mdash;'} din ${trend.at(-1).total} răspunsuri.</p>`;
}

function breakdownTable(rows, label = 'Segment') {
  if (!rows.length) return '<p class="muted">Fără date.</p>';
  return `<table>
    <thead><tr><th>${label}</th><th class="num">Răspunsuri</th><th class="num">Promotori</th><th class="num">Detractori</th><th class="num">NPS</th></tr></thead>
    <tbody>${rows
      .map(
        (r) => `<tr><td>${escapeHtml(r.bucket)}</td><td class="num">${r.total}</td>
        <td class="num">${r.promoters}</td><td class="num">${r.detractors}</td>
        <td class="num"><strong>${r.nps === null ? '&mdash;' : formatNps(r.nps)}</strong></td></tr>`,
      )
      .join('')}</tbody>
  </table>`;
}

function recentList(recent) {
  const withComment = recent.filter((r) => r.comment);
  if (!withComment.length) return '<p class="muted">Niciun comentariu încă.</p>';
  return withComment
    .slice(0, 8)
    .map(
      (r) => `<div style="padding:10px 0;border-bottom:1px solid var(--line)">
        <div class="row" style="gap:8px">
          <span class="tag ${r.category}">${r.score}</span>
          <strong>${escapeHtml(r.contact_name || r.email || 'anonim')}</strong>
          <span class="small muted">${formatDateTime(r.created_at)}</span>
        </div>
        <div style="margin-top:4px">${escapeHtml(r.comment)}</div>
      </div>`,
    )
    .join('');
}

function campaignSelect(campaigns, campaignId, action) {
  if (!campaigns.length) return '';
  return `<form method="GET" action="${action}" class="card row">
    <select name="campanie" style="max-width:320px">
      <option value="">Toate campaniile</option>
      ${campaigns.map((c) => `<option value="${c.id}"${campaignId === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`).join('')}
    </select>
    <button class="btn ghost" type="submit">Aplică</button>
  </form>`;
}

/* -------------------------- intrebari, locatii, afise ------------------------- */

const KIND_RO = { rating: 'Notă 1–5', choice: 'Alegere', text: 'Text liber' };
const TOPIC_RO = { produs: 'produs', experienta: 'experiență', locatie: 'locație' };

export function questionsCard(campaign, questions) {
  const rows = questions.length
    ? questions
        .map(
          (q, i) => `<tr>
            <td>${escapeHtml(q.text)}
              ${q.options ? `<div class="small muted">${q.options.map(escapeHtml).join(' · ')}</div>` : ''}</td>
            <td class="small">${KIND_RO[q.kind] || q.kind}</td>
            <td class="small">${q.topic ? escapeHtml(TOPIC_RO[q.topic] || q.topic) : '<span class="muted">—</span>'}</td>
            <td class="small">${q.required ? 'obligatorie' : '<span class="muted">opțională</span>'}</td>
            <td>
              <div class="row" style="gap:4px;flex-wrap:nowrap">
                ${i > 0 ? moveForm(q.id, 'sus', '↑') : ''}
                ${i < questions.length - 1 ? moveForm(q.id, 'jos', '↓') : ''}
                <form method="POST" action="/admin/intrebari/${q.id}/sterge">
                  <button class="btn ghost small" type="submit">Șterge</button>
                </form>
              </div>
            </td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="5" class="muted">Doar întrebarea NPS și motivul scorului.</td></tr>';

  return `<div class="card">
  <h2 style="margin-top:0">Întrebări suplimentare</h2>
  <p class="small muted">Apar în sondaj după scorul NPS. Ține-le puține: fiecare întrebare
  în plus scade rata de răspuns.</p>
  <table>
    <thead><tr><th>Întrebare</th><th>Tip</th><th>Temă</th><th>Obligatorie</th><th></th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  ${
    questions.length
      ? ''
      : `<form method="POST" action="/admin/campanii/${campaign.id}/intrebari-standard" style="margin-top:12px">
           <button class="btn ghost" type="submit">Adaugă setul standard (produs, experiență, locație)</button>
         </form>`
  }
  <form method="POST" action="/admin/campanii/${campaign.id}/intrebari" style="margin-top:16px">
    <label for="qtext">Întrebare nouă</label>
    <input id="qtext" name="text" type="text" required placeholder="Cât de mulțumit ești de livrare?">
    <div class="row" style="gap:12px;align-items:flex-end">
      <div style="flex:1 1 160px">
        <label for="qkind">Tip</label>
        <select id="qkind" name="kind">
          <option value="rating">Notă 1–5</option>
          <option value="choice">Alegere dintr-o listă</option>
          <option value="text">Text liber</option>
        </select>
      </div>
      <div style="flex:1 1 160px">
        <label for="qtopic">Temă</label>
        <select id="qtopic" name="topic">
          <option value="">—</option>
          <option value="produs">produs</option>
          <option value="experienta">experiență</option>
          <option value="locatie">locație</option>
        </select>
      </div>
      <div style="flex:2 1 240px">
        <label for="qoptions">Opțiuni <span class="hint">(doar pentru „alegere”, separate prin virgulă)</span></label>
        <input id="qoptions" name="options" type="text" placeholder="Produsul, Oamenii, Prețul">
      </div>
    </div>
    <label class="small" style="font-weight:500;margin-top:10px">
      <input type="checkbox" name="required" value="1" style="width:auto"> Răspuns obligatoriu
    </label>
    <p style="margin-top:12px"><button class="btn" type="submit">Adaugă întrebarea</button></p>
  </form>
</div>`;
}

function moveForm(id, direction, label) {
  return `<form method="POST" action="/admin/intrebari/${id}/muta">
    <input type="hidden" name="directie" value="${direction}">
    <button class="btn ghost small" type="submit" title="Mută ${direction}">${label}</button>
  </form>`;
}

export function questionResultsCard(results) {
  if (!results.length) return '';
  const blocks = results
    .map((q) => {
      if (q.kind === 'text') {
        const list = q.texts.length
          ? q.texts
              .map(
                (t) => `<div style="padding:6px 0;border-bottom:1px solid var(--line)">
                  ${escapeHtml(t.value)} <span class="small muted">${formatDateTime(t.created_at)}</span></div>`,
              )
              .join('')
          : '<p class="muted small">Niciun răspuns încă.</p>';
        return `<div style="margin-bottom:18px"><strong>${escapeHtml(q.text)}</strong>${list}</div>`;
      }
      const max = Math.max(...q.counts.map((c) => c.n), 1);
      const bars = q.counts.length
        ? q.counts
            .map(
              (c) => `<tr>
                <td style="width:180px">${escapeHtml(c.value)}</td>
                <td><div style="background:var(--accent);height:14px;border-radius:3px;width:${Math.round((c.n / max) * 100)}%;min-width:3px"></div></td>
                <td class="num" style="width:60px">${c.n}</td>
              </tr>`,
            )
            .join('')
        : '<tr><td colspan="3" class="muted">Niciun răspuns încă.</td></tr>';
      return `<div style="margin-bottom:18px">
        <strong>${escapeHtml(q.text)}</strong>
        ${q.average !== null ? `<span class="small muted"> — medie ${q.average}/5 din ${q.total} răspunsuri</span>` : ''}
        <table style="margin-top:6px"><tbody>${bars}</tbody></table>
      </div>`;
    })
    .join('');

  return `<div class="card">
    <h2 style="margin-top:0">Întrebările suplimentare</h2>
    ${blocks}
  </div>`;
}

export function locationsPage({ locations, campaigns, campaign, publicUrl, qrFor, flash }) {
  const cards = locations.length
    ? locations
        .map((l) => {
          const link = `${publicUrl}/s/${campaign ? campaign.slug : 'campanie'}?loc=${l.slug}`;
          return `<div class="card">
            <div class="row" style="gap:18px;align-items:flex-start">
              <div style="flex:0 0 140px">${qrFor(link, 140)}</div>
              <div style="flex:1 1 260px">
                <h2 style="margin:0 0 4px">${escapeHtml(l.name)}</h2>
                ${l.address ? `<p class="small muted" style="margin:0 0 8px">${escapeHtml(l.address)}</p>` : ''}
                <p class="small" style="margin:0 0 8px">Răspunsuri primite: <strong>${l.responses}</strong></p>
                <pre style="white-space:pre-wrap;word-break:break-all">${escapeHtml(link)}</pre>
                <div class="row">
                  <a class="btn ghost" href="/admin/afise?locatie=${l.id}${campaign ? `&campanie=${campaign.id}` : ''}" target="_blank" rel="noopener">Afiș de printat</a>
                  <form method="POST" action="/admin/locatii/${l.id}/status">
                    <input type="hidden" name="active" value="${l.active ? 0 : 1}">
                    <button class="btn ghost" type="submit">${l.active ? 'Dezactivează' : 'Reactivează'}</button>
                  </form>
                  ${l.active ? '' : '<span class="tag passive">inactivă</span>'}
                </div>
              </div>
            </div>
          </div>`;
        })
        .join('')
    : '<div class="card"><p class="muted">Nicio locație încă. Adaugă una mai jos și primești codul QR de printat.</p></div>';

  const body = `
<h1>Locații și coduri QR</h1>
<p class="sub">Fiecare locație are codul ei QR. Clientul îl scanează cu telefonul, răspunde în 30 de secunde,
iar tu vezi în dashboard care locație are problema.</p>
${flash ? `<div class="flash">${escapeHtml(flash)}</div>` : ''}
${campaigns.length === 0 ? '<div class="flash">Creează întâi o campanie: codul QR trimite către sondajul ei.</div>' : ''}
${
  campaigns.length > 1
    ? `<form method="GET" action="/admin/locatii" class="card row">
        <label for="campanie" style="margin:0">Codurile QR trimit către</label>
        <select id="campanie" name="campanie" style="max-width:320px">
          ${campaigns
            .map((c) => `<option value="${c.id}"${campaign && campaign.id === c.id ? ' selected' : ''}>${escapeHtml(c.name)}</option>`)
            .join('')}
        </select>
        <button class="btn ghost" type="submit">Schimbă</button>
      </form>`
    : ''
}
${cards}
<div class="card">
  <h2 style="margin-top:0">Locație nouă</h2>
  <form method="POST" action="/admin/locatii">
    <label for="lname">Nume</label>
    <input id="lname" name="name" type="text" required placeholder="Magazin Unirii">
    <label for="laddress">Adresă <span class="hint">(apare doar pe afiș)</span></label>
    <input id="laddress" name="address" type="text" placeholder="Bd. Unirii 12, București">
    <p style="margin-top:16px"><button class="btn" type="submit">Adaugă locația</button></p>
  </form>
</div>
<p><a class="btn ghost" href="/admin/afise${campaign ? `?campanie=${campaign.id}` : ''}" target="_blank" rel="noopener">Printează toate afișele</a></p>`;

  return page({ title: 'Locații și QR', body, nav: adminNav('locations') });
}

// Pagina de printat: cate un afiș A5/A4 per locație, cu QR mare si instructiuni.
export function postersPage({ posters, campaignName }) {
  const sheets = posters
    .map(
      (p) => `<section class="poster">
        <p class="poster-kicker">${escapeHtml(campaignName)}</p>
        <h1>Cum a fost la noi?</h1>
        <p class="poster-lead">Scanează codul cu telefonul și spune-ne în 30 de secunde.
        Ne ajută să reparăm exact ce nu merge.</p>
        <div class="poster-qr">${p.qr}</div>
        <p class="poster-place">${escapeHtml(p.name)}</p>
        ${p.address ? `<p class="poster-address">${escapeHtml(p.address)}</p>` : ''}
        <p class="poster-url">${escapeHtml(p.link)}</p>
      </section>`,
    )
    .join('');

  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Afișe cu cod QR</title>
<style>
  body { margin: 0; background: #eef0f3; font-family: -apple-system, "Segoe UI", Roboto, Arial, sans-serif; }
  .bar { padding: 14px 16px; background: #fff; border-bottom: 1px solid #e4e7ec; }
  .bar button { background: #2f5bea; color: #fff; border: 0; border-radius: 8px; padding: 10px 16px;
    font-size: 15px; font-weight: 600; cursor: pointer; }
  .poster { width: 210mm; min-height: 290mm; margin: 16px auto; background: #fff; box-sizing: border-box;
    padding: 28mm 20mm; text-align: center; display: flex; flex-direction: column; align-items: center;
    justify-content: center; }
  .poster-kicker { text-transform: uppercase; letter-spacing: 2px; font-size: 13px; color: #6b7280; margin: 0 0 10mm; }
  .poster h1 { font-size: 44px; margin: 0 0 6mm; letter-spacing: -1px; }
  .poster-lead { font-size: 19px; line-height: 1.5; color: #374151; max-width: 130mm; margin: 0 0 12mm; }
  .poster-qr svg { width: 95mm; height: 95mm; }
  .poster-place { font-size: 24px; font-weight: 700; margin: 10mm 0 0; }
  .poster-address { font-size: 16px; color: #6b7280; margin: 2mm 0 0; }
  .poster-url { font-size: 13px; color: #9aa1ac; margin: 8mm 0 0; word-break: break-all; }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .poster { margin: 0; box-shadow: none; page-break-after: always; }
  }
</style>
</head>
<body>
<div class="bar"><button onclick="window.print()">Printează</button></div>
${sheets || '<section class="poster"><h1>Nicio locație de printat</h1></section>'}
</body></html>`;
}

/* ---------------------------- alerte la detractori ---------------------------- */

export function alertsPage({ detractors, log, transport, publicUrl, campaigns }) {
  const carduri = detractors.length
    ? detractors
        .map((r) => {
          const cine = r.contact_name || r.email || 'Client anonim';
          const raspunsuri = (r.answers || []).filter((a) => a.value);
          return `<div class="card" style="border-left:3px solid var(--bad)">
            <div class="row" style="justify-content:space-between;align-items:flex-start">
              <div>
                <span class="tag detractor" style="font-size:14px">${r.score}/10</span>
                <strong style="margin-left:8px">${escapeHtml(cine)}</strong>
                ${r.company ? `<span class="small muted"> · ${escapeHtml(r.company)}</span>` : ''}
                ${r.location_name ? `<span class="small muted"> · 📍 ${escapeHtml(r.location_name)}</span>` : ''}
              </div>
              <span class="small muted" title="${formatDateTime(r.created_at)}">${timeAgo(r.created_at)}</span>
            </div>
            ${
              r.comment
                ? `<p style="margin:10px 0 0;font-size:16px;border-left:3px solid var(--line);padding-left:12px">
                     ${escapeHtml(r.comment)}</p>`
                : '<p class="muted small" style="margin:10px 0 0">(fără comentariu)</p>'
            }
            ${
              raspunsuri.length
                ? `<p class="small muted" style="margin:10px 0 0">${raspunsuri
                    .map((a) => `${escapeHtml(a.text)}: <strong>${escapeHtml(a.value)}</strong>`)
                    .join(' · ')}</p>`
                : ''
            }
            <div class="row" style="margin-top:12px">
              ${
                r.email
                  ? `<a class="btn" href="mailto:${escapeHtml(r.email)}?subject=${encodeURIComponent('Despre feedbackul tău')}">Răspunde pe email</a>`
                  : ''
              }
              <form method="POST" action="/admin/raspunsuri/${r.id}/inchide">
                <input type="hidden" name="de" value="alerte">
                <button class="btn ghost" type="submit">Am rezolvat, închide bucla</button>
              </form>
              <span class="small muted">${escapeHtml(r.campaign_name)}</span>
            </div>
          </div>`;
        })
        .join('')
    : `<div class="card"><p class="muted" style="margin:0">Niciun detractor deschis. 🎉<br>
       <span class="small">Aici apar automat clienții care dau 0–6, până când cineva revine la ei.</span></p></div>`;

  const jurnal = log.length
    ? log
        .map(
          (a) => `<tr>
            <td class="small">${formatDateTime(a.created_at)}</td>
            <td class="small">${escapeHtml(a.channel)}</td>
            <td class="small">${escapeHtml(a.target || '—')}</td>
            <td class="small">${
              a.status === 'trimis'
                ? '<span class="tag promoter">trimis</span>'
                : a.status === 'sarit'
                  ? `<span class="tag passive" title="${escapeHtml(a.detail || '')}">sărit</span>`
                  : `<span class="tag detractor" title="${escapeHtml(a.detail || '')}">eroare</span>`
            }</td>
          </tr>`,
        )
        .join('')
    : '<tr><td colspan="4" class="muted">Nicio alertă trimisă încă.</td></tr>';

  const body = `
<h1>Alerte la detractori</h1>
<p class="sub">Fiecare client care dă 0–6 declanșează imediat o alertă și rămâne în această listă
până când cineva revine la el. Ținta: răspuns în 48 de ore.</p>

<div class="card">
  <div class="row" style="justify-content:space-between">
    <div>
      <div class="name small muted">DETRACTORI DESCHIȘI</div>
      <div class="value" style="font-size:28px;font-weight:700">${detractors.length}</div>
    </div>
    <div class="small muted" style="max-width:420px;text-align:right">
      Alerte trimise prin: <strong>${escapeHtml(transport)}</strong>
    </div>
  </div>
</div>

${carduri}

<div class="card">
  <h2 style="margin-top:0">Jurnalul alertelor</h2>
  <table>
    <thead><tr><th>Data</th><th>Canal</th><th>Destinatar</th><th>Stare</th></tr></thead>
    <tbody>${jurnal}</tbody>
  </table>
  <p class="small muted" style="margin-top:10px">
    Alertele se configurează din <code>.env</code>: <code>ALERT_EMAILS</code> (una sau mai multe adrese)
    și <code>ALERT_WEBHOOK_URL</code> (Slack, Telegram sau Zapier, pentru notificare pe telefon).
  </p>
</div>`;

  return page({ title: 'Alerte', body, nav: adminNav('alerts', detractors.length) });
}
