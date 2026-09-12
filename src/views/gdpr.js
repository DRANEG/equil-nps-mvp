import { escapeHtml } from '../http.js';
import { page, adminNav } from './layout.js';
import { formatDateTime, formatPhone } from '../format.js';

// Nota de informare (art. 13 GDPR), completata din datele firmei.
export function privacyPage(operator) {
  const operatorNume = operator.nume || 'Operatorul';
  const contact = [
    operator.email ? `email: <a href="mailto:${escapeHtml(operator.email)}">${escapeHtml(operator.email)}</a>` : '',
    operator.telefon ? `telefon: ${escapeHtml(formatPhone(operator.telefon))}` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  const body = `
<div class="card">
  <h1>Notă de informare privind prelucrarea datelor</h1>
  <p class="sub">Cum folosim datele pe care ni le lași când răspunzi la sondajul nostru.</p>

  ${
    operator.nume
      ? ''
      : `<div class="flash">Această pagină nu este încă completată cu datele firmei.
         Setează <code>OPERATOR_NAME</code>, <code>OPERATOR_CUI</code>, <code>OPERATOR_ADDRESS</code>
         și <code>OPERATOR_EMAIL</code> în fișierul <code>.env</code>.</div>`
  }

  <h2>Cine prelucrează datele</h2>
  <p>${escapeHtml(operatorNume)}${operator.cui ? `, CUI ${escapeHtml(operator.cui)}` : ''}${
    operator.adresa ? `, cu sediul în ${escapeHtml(operator.adresa)}` : ''
  }. ${contact ? `Ne poți contacta la ${contact}.` : ''}
  ${operator.dpo ? `Responsabil cu protecția datelor: <a href="mailto:${escapeHtml(operator.dpo)}">${escapeHtml(operator.dpo)}</a>.` : ''}</p>

  <h2>Ce date colectăm</h2>
  <ul>
    <li>nota pe care o acorzi (0–10) și, dacă vrei să-l scrii, motivul ei;</li>
    <li>răspunsurile la eventualele întrebări suplimentare;</li>
    <li>dacă ai primit invitația pe email: numele, adresa de email, telefonul și firma,
        așa cum le avem deja din relația comercială;</li>
    <li>locația din care ai scanat codul QR, dacă e cazul.</li>
  </ul>
  <p>Nu folosim cookie-uri de urmărire și nu transmitem datele către platforme de publicitate.</p>

  <h2>De ce le prelucrăm și în ce temei</h2>
  <p>Folosim răspunsurile pentru a înțelege cât de mulțumiți sunt clienții și pentru a corecta
  ce nu merge. Temeiul este <strong>interesul legitim</strong> (art. 6 alin. 1 lit. f GDPR) de a ne
  îmbunătăți serviciile față de clienții existenți. Dacă ai dat o notă mică, te putem contacta
  pentru a lămuri situația.</p>

  <h2>Cât timp le păstrăm</h2>
  <p>Datele care te identifică se păstrează cel mult ${operator.luniRetentie} de luni de la răspuns.
  După acest termen, răspunsurile rămân doar sub formă anonimă, pentru statistică.</p>

  <h2>Drepturile tale</h2>
  <p>Ai dreptul de acces la date, de rectificare, de ștergere, de restricționare a prelucrării,
  de opoziție și de portabilitate. Scrie-ne${
    operator.email ? ` la <a href="mailto:${escapeHtml(operator.email)}">${escapeHtml(operator.email)}</a>` : ''
  } și rezolvăm în cel mult 30 de zile.
  Fiecare email de la noi are și un link prin care te poți dezabona sau îți poți șterge datele
  pe loc, fără să ceri nimănui nimic.</p>

  <h2>Unde poți reclama</h2>
  <p>Dacă nu ești mulțumit de răspunsul nostru, te poți adresa Autorității Naționale de Supraveghere
  a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30,
  sector 1, București, <a href="https://www.dataprotection.ro" target="_blank" rel="noopener">www.dataprotection.ro</a>.</p>
</div>`;

  return page({ title: 'Notă de informare', body, narrow: true });
}

// Pagina din administrare pentru cererile venite de la clienti.
export function personalDataPage({ cautare = '', contact = null, date = null, operator, mesaj = null }) {
  const rezultat = contact
    ? `<div class="card">
        <h2 style="margin-top:0">${escapeHtml(contact.name || contact.email)}</h2>
        <table>
          <tbody>
            <tr><td>Email</td><td>${escapeHtml(contact.email)}</td></tr>
            <tr><td>Telefon</td><td>${escapeHtml(formatPhone(contact.phone))}</td></tr>
            <tr><td>Companie</td><td>${escapeHtml(contact.company || '—')}</td></tr>
            <tr><td>Segment</td><td>${escapeHtml(contact.segment || '—')}</td></tr>
            <tr><td>Adăugat la</td><td>${formatDateTime(contact.created_at)}</td></tr>
            <tr><td>Dezabonat</td><td>${contact.unsubscribed_at ? formatDateTime(contact.unsubscribed_at) : 'nu'}</td></tr>
            <tr><td>Răspunsuri</td><td>${date ? date.raspunsuri.length : 0}</td></tr>
            <tr><td>Invitații</td><td>${date ? date.invitatii.length : 0}</td></tr>
          </tbody>
        </table>
        <div class="row" style="margin-top:16px">
          <a class="btn ghost" href="/admin/date-personale/export?email=${encodeURIComponent(contact.email)}">
            Descarcă toate datele (JSON)
          </a>
          <form method="POST" action="/admin/date-personale/sterge"
                onsubmit="return confirm('Ștergi definitiv datele acestei persoane? Răspunsurile rămân, dar anonime.')">
            <input type="hidden" name="email" value="${escapeHtml(contact.email)}">
            <button class="btn" type="submit" style="background:var(--bad)">Șterge datele personale</button>
          </form>
        </div>
        <p class="small muted" style="margin-top:12px">
          Ștergerea scoate numele, emailul și telefonul, desface legătura cu răspunsurile și șterge
          invitațiile (deci și linkurile personale). Notele și comentariile rămân pentru statistică,
          fără să mai identifice pe nimeni.
        </p>
      </div>`
    : cautare
      ? '<div class="card"><p class="muted" style="margin:0">Nicio persoană cu acest email.</p></div>'
      : '';

  const body = `
<h1>Date personale (GDPR)</h1>
<p class="sub">Aici rezolvi cererile clienților: „ce date aveți despre mine?” și „ștergeți-mi datele”.
Termenul legal de răspuns este de 30 de zile.</p>
${mesaj ? `<div class="flash">${escapeHtml(mesaj)}</div>` : ''}

<form method="GET" action="/admin/date-personale" class="card row">
  <input type="email" name="email" placeholder="email@client.ro" value="${escapeHtml(cautare)}"
         style="max-width:320px" required>
  <button class="btn" type="submit">Caută persoana</button>
</form>

${rezultat}

<div class="card">
  <h2 style="margin-top:0">Păstrarea datelor</h2>
  <p class="small muted">Datele care identifică o persoană se șterg automat după
  <strong>${operator.luniRetentie} de luni</strong> (<code>DATA_RETENTION_MONTHS</code>);
  răspunsurile rămân anonime, pentru statistică. Curățenia rulează zilnic, dar o poți porni și acum.</p>
  <form method="POST" action="/admin/date-personale/retentie">
    <button class="btn ghost" type="submit">Rulează curățenia acum</button>
  </form>
</div>

<div class="card">
  <h2 style="margin-top:0">Nota de informare</h2>
  <p class="small muted">Pagina publică, legată din sondaj și din fiecare email:
  <a href="/confidentialitate" target="_blank" rel="noopener">/confidentialitate</a>.
  ${
    operator.nume
      ? 'Este completată cu datele firmei tale.'
      : '<strong>Nu este completată</strong>: setează OPERATOR_NAME, OPERATOR_CUI, OPERATOR_ADDRESS și OPERATOR_EMAIL în .env.'
  }</p>
  <p class="small muted">Textul este un punct de plecare rezonabil, nu consultanță juridică.
  Dacă prelucrezi date sensibile sau volume mari, dă-l unui avocat la citit.</p>
</div>`;

  return page({ title: 'Date personale', body, nav: adminNav('gdpr') });
}
