import { escapeHtml } from '../http.js';
import { page, adminNav } from './layout.js';
import { label as npsLabel } from '../nps.js';

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

export function dashboardPage({ summary, moe, trend, segments, recent, campaigns, campaignId, invitesSent, publicUrl }) {
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
  ${kpi('Detractori', `${summary.detractorPct}%`, `${summary.detractors} persoane`)}
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
  <h2 style="margin-top:0">Ultimele comentarii</h2>
  ${recentList(recent)}
  <p style="margin-top:12px"><a class="btn ghost" href="/admin/raspunsuri">Toate răspunsurile</a></p>
</div>

<p class="small muted">Link public de test: <code>${escapeHtml(publicUrl)}/s/&lt;slug-campanie&gt;</code></p>`;

  return page({ title: 'Dashboard NPS', body, nav: adminNav('home') });
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
            <td class="small muted">${escapeHtml(c.created_at)}</td>
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

export function campaignDetailPage({ campaign, summary, invites, publicUrl, email, flash }) {
  const pending = invites.filter((i) => !i.responded_at).length;
  const rows = invites.length
    ? invites
        .map(
          (i) => `<tr>
            <td>${escapeHtml(i.contact_name || '')}<div class="small muted">${escapeHtml(i.email)}</div></td>
            <td class="small">${escapeHtml(i.segment || '')}</td>
            <td class="num">${i.score === null || i.score === undefined ? '<span class="muted">&mdash;</span>' : i.score}</td>
            <td class="small">${i.responded_at ? escapeHtml(i.responded_at) : '<span class="muted">în așteptare</span>'}</td>
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
            <td class="small">${escapeHtml(r.created_at)}</td>
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
    return `<span class="tag promoter">reminder</span><div class="small muted">${escapeHtml(invite.reminder_sent_at)}</div>`;
  }
  if (invite.sent_at) {
    return `<span class="tag passive">trimis</span><div class="small muted">${escapeHtml(invite.sent_at)}</div>`;
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
            <td class="small">${escapeHtml(e.created_at)}</td>
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
  <table style="margin-top:16px">
    <thead><tr><th>Data</th><th>Tip</th><th>Destinatar</th><th>Stare</th></tr></thead>
    <tbody>${logRows}</tbody>
  </table>
</div>`;
}

function closeButton(r) {
  if (r.closed_at) {
    return `<span class="small muted" title="${escapeHtml(r.closed_at)}">rezolvat</span>`;
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
    <div class="spark-labels">${trend.map((t) => `<div>${t.month.slice(5)}</div>`).join('')}</div>
    <p class="small muted">Ultima lună: NPS ${trend.at(-1).nps ?? '&mdash;'} din ${trend.at(-1).total} răspunsuri.</p>`;
}

function breakdownTable(rows) {
  if (!rows.length) return '<p class="muted">Fără date.</p>';
  return `<table>
    <thead><tr><th>Segment</th><th class="num">Răspunsuri</th><th class="num">Promotori</th><th class="num">Detractori</th><th class="num">NPS</th></tr></thead>
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
          <span class="small muted">${escapeHtml(r.created_at)}</span>
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
