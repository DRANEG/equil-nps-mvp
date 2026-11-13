// Verificare inainte de lansare: trece prin configurare si spune ce te
// impiedica sa pornesti, ce ar trebui sa te uiti si ce e deja in regula.
// Rulare: npm run verifica
import { statSync, accessSync, constants } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PAROLE_SLABE = ['admin', 'schimba-ma', 'parola', 'password', '123456', 'test', 'test123', 'equil'];

// Verificarea propriu-zisa e o functie pura peste variabilele de mediu, ca sa
// poata fi testata fara server si fara fisiere.
export function verificaConfiguratie(env = process.env) {
  const blocante = [];
  const atentionari = [];
  const bune = [];

  const spune = (lista, titlu, detaliu) => lista.push({ titlu, detaliu });

  /* ------------------------------- acces admin ------------------------------- */

  const parola = env.ADMIN_TOKEN || '';
  if (!parola) {
    spune(blocante, 'ADMIN_TOKEN lipsește', 'Fără el, administrarea pornește cu parola implicită „admin”.');
  } else if (PAROLE_SLABE.includes(parola.toLowerCase())) {
    spune(blocante, 'ADMIN_TOKEN e o parolă de exemplu', 'Schimb-o într-una lungă, generată aleatoriu.');
  } else if (parola.length < 12) {
    spune(blocante, 'ADMIN_TOKEN e prea scurt', `Are ${parola.length} caractere; pune cel puțin 12.`);
  } else {
    spune(bune, 'Parola de administrare', 'Setată, suficient de lungă.');
  }

  /* --------------------------------- adresa --------------------------------- */

  const publicUrl = env.PUBLIC_URL || '';
  const localhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(publicUrl);
  if (!publicUrl) {
    spune(blocante, 'PUBLIC_URL lipsește', 'Linkurile din emailuri și codurile QR ar duce în gol.');
  } else if (publicUrl.startsWith('https://')) {
    spune(bune, 'Adresa publică', `${publicUrl} — pe HTTPS, cum trebuie.`);
  } else if (localhost) {
    spune(atentionari, 'Rulezi pe localhost', 'Bun pentru probe. Pentru clienți reali ai nevoie de un domeniu cu HTTPS.');
  } else {
    spune(
      blocante,
      'PUBLIC_URL nu este pe HTTPS',
      'Fără HTTPS: parola circulă necriptat, cookie-ul nu primește Secure, iar aplicația nu se poate instala pe telefon.',
    );
  }
  if (publicUrl.endsWith('/')) {
    spune(atentionari, 'PUBLIC_URL se termină cu „/”', 'Scoate bara finală, altfel linkurile ies cu „//”.');
  }

  /* ---------------------------------- email ---------------------------------- */

  const smtp = env.SMTP_HOST || '';
  const from = env.MAIL_FROM || '';
  const domeniuFrom = (from.match(/@([^>\s]+)/) || [])[1] || '';

  if (!smtp) {
    spune(
      atentionari,
      'SMTP nu e configurat',
      'Nu pleacă niciun email: mesajele se scriu ca fișiere .eml în data/outbox. Bun pentru probă, nu pentru lansare.',
    );
  } else {
    if (!env.SMTP_USER || !env.SMTP_PASS) {
      spune(atentionari, 'SMTP fără utilizator sau parolă', 'Majoritatea furnizorilor cer autentificare.');
    }
    if (!from || /localhost/.test(from)) {
      spune(blocante, 'MAIL_FROM lipsește sau e „localhost”', 'Pune o adresă reală de pe domeniul tău.');
    } else {
      spune(bune, 'Trimitere pe email', `${smtp}, expeditor ${from}`);
    }
    if (domeniuFrom && publicUrl && !publicUrl.includes(domeniuFrom.split('.').slice(-2).join('.'))) {
      spune(
        atentionari,
        'Expeditorul e pe alt domeniu decât aplicația',
        `Verifică SPF și DKIM pentru ${domeniuFrom}, altfel mesajele ajung în spam.`,
      );
    }
    if (domeniuFrom && /gmail\.com|yahoo\.com|outlook\.com/.test(domeniuFrom)) {
      spune(
        atentionari,
        'Expeditor pe un domeniu public',
        `Trimiterile „de la” ${domeniuFrom} sunt respinse sau marcate ca spam. Folosește domeniul firmei.`,
      );
    }
  }

  if (env.SEND_ENABLED === '0') {
    spune(atentionari, 'Robotul de trimitere e oprit', 'SEND_ENABLED=0. Invitațiile pleacă doar manual sau din cron.');
  }

  /* ---------------------------------- GDPR ---------------------------------- */

  if (!env.OPERATOR_NAME || !env.OPERATOR_EMAIL) {
    spune(
      blocante,
      'Datele firmei lipsesc (GDPR)',
      'Fără OPERATOR_NAME și OPERATOR_EMAIL, nota de informare de la /confidentialitate rămâne necompletată.',
    );
  } else {
    const lipsa = [
      !env.OPERATOR_CUI && 'CUI',
      !env.OPERATOR_ADDRESS && 'adresa',
    ].filter(Boolean);
    if (lipsa.length) {
      spune(atentionari, `Nota de informare e incompletă (${lipsa.join(', ')})`, 'Completează OPERATOR_CUI și OPERATOR_ADDRESS.');
    } else {
      spune(bune, 'Nota de informare', `${env.OPERATOR_NAME}, date complete.`);
    }
  }

  const retentie = Number(env.DATA_RETENTION_MONTHS || 24);
  if (retentie > 36) {
    spune(atentionari, 'Păstrezi datele personale mai mult de 3 ani', `Acum: ${retentie} luni. Justifică termenul sau scurtează-l.`);
  }

  /* --------------------------------- alerte --------------------------------- */

  const emailuriAlerta = String(env.ALERT_EMAILS || '').split(',').filter((e) => e.includes('@'));
  if (!emailuriAlerta.length && !env.ALERT_WEBHOOK_URL) {
    spune(
      atentionari,
      'Alertele la detractori nu ajung nicăieri',
      'Setează ALERT_EMAILS sau ALERT_WEBHOOK_URL, altfel afli de clienții nemulțumiți abia când intri în dashboard.',
    );
  } else {
    const canale = [emailuriAlerta.length && `email (${emailuriAlerta.length})`, env.ALERT_WEBHOOK_URL && 'webhook']
      .filter(Boolean)
      .join(' + ');
    spune(bune, 'Alerte la detractori', canale);
  }

  /* ------------------------------- alte setări ------------------------------- */

  if (env.TRUST_PROXY === '1') {
    spune(
      atentionari,
      'TRUST_PROXY este pornit',
      'Corect doar dacă aplicația chiar stă în spatele propriului reverse proxy. Altfel, oricine își poate falsifica adresa IP.',
    );
  }

  const [de, pana] = String(env.SEND_HOURS || '9-20').split('-').map(Number);
  if (!Number.isFinite(de) || !Number.isFinite(pana) || de >= pana || pana > 24) {
    spune(atentionari, 'SEND_HOURS nu arată bine', `Valoarea „${env.SEND_HOURS}” nu e un interval valid; se folosește 9-20.`);
  }

  const baza = env.NPS_DB || './data/nps.db';
  if (baza.startsWith('/tmp')) {
    spune(blocante, 'Baza de date e în /tmp', 'Se pierde la repornirea serverului. Mut-o în folderul aplicației.');
  }

  return { blocante, atentionari, bune };
}

// Verificari care au nevoie de sistemul de fisiere si de baza de date.
export function verificaMediu(env = process.env, { version = process.versions.node } = {}) {
  const blocante = [];
  const atentionari = [];
  const bune = [];

  const [major, minor] = version.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 5)) {
    blocante.push({ titlu: `Node.js ${version} este prea vechi`, detaliu: 'Ai nevoie de 22.5 sau mai nou (pentru SQLite inclus).' });
  } else {
    bune.push({ titlu: `Node.js ${version}`, detaliu: 'Versiune potrivită.' });
  }

  const baza = resolve(env.NPS_DB || './data/nps.db');
  try {
    accessSync(dirname(baza), constants.W_OK);
    let marime = 0;
    try {
      marime = statSync(baza).size;
    } catch {
      marime = 0;
    }
    bune.push({
      titlu: 'Folderul datelor',
      detaliu: marime ? `${dirname(baza)} — baza există (${Math.round(marime / 1024)} KB).` : `${dirname(baza)} — baza se va crea la pornire.`,
    });
  } catch {
    blocante.push({ titlu: 'Nu pot scrie în folderul bazei de date', detaliu: dirname(baza) });
  }

  return { blocante, atentionari, bune };
}

// Verificari pe datele din aplicatie: are ce trimite?
export function verificaDate(db) {
  const atentionari = [];
  const bune = [];

  const campanii = db.prepare('SELECT COUNT(*) AS n FROM campaigns WHERE active = 1').get().n;
  if (!campanii) {
    atentionari.push({ titlu: 'Nicio campanie activă', detaliu: 'Creează una din Admin → Campanii înainte de a trimite ceva.' });
  } else {
    bune.push({ titlu: 'Campanii active', detaliu: `${campanii}` });
  }

  const demo = db.prepare("SELECT COUNT(*) AS n FROM campaigns WHERE slug = 'demo-nps'").get().n;
  if (demo) {
    atentionari.push({
      titlu: 'Campania demo încă există',
      detaliu: 'Datele de probă strică scorul real. Închide campania „demo-nps” sau pornește cu o bază curată.',
    });
  }

  const contacte = db.prepare('SELECT COUNT(*) AS n FROM contacts').get().n;
  const locatii = db.prepare('SELECT COUNT(*) AS n FROM locations WHERE active = 1').get().n;
  bune.push({ titlu: 'În baza de date', detaliu: `${contacte} contacte, ${locatii} locații active` });

  return { blocante: [], atentionari, bune };
}

export function rezumat(...rapoarte) {
  return rapoarte.reduce(
    (tot, r) => ({
      blocante: [...tot.blocante, ...(r.blocante || [])],
      atentionari: [...tot.atentionari, ...(r.atentionari || [])],
      bune: [...tot.bune, ...(r.bune || [])],
    }),
    { blocante: [], atentionari: [], bune: [] },
  );
}

export function scrieRaport(raport, scrie = console.log) {
  const sectiune = (semn, titlu, elemente) => {
    if (!elemente.length) return;
    scrie('');
    scrie(`${titlu} (${elemente.length})`);
    for (const e of elemente) {
      scrie(`  ${semn} ${e.titlu}`);
      if (e.detaliu) scrie(`      ${e.detaliu}`);
    }
  };

  sectiune('✗', 'TE OPRESC DIN LANSARE', raport.blocante);
  sectiune('!', 'DE VERIFICAT', raport.atentionari);
  sectiune('✓', 'ÎN REGULĂ', raport.bune);

  scrie('');
  if (raport.blocante.length) {
    scrie(`Nu porni încă: ${raport.blocante.length} ${raport.blocante.length === 1 ? 'problemă' : 'probleme'} de rezolvat.`);
  } else if (raport.atentionari.length) {
    scrie(`Poți porni, dar uită-te peste cele ${raport.atentionari.length} atenționări.`);
  } else {
    scrie('Totul e pregătit. Poți da drumul.');
  }
}
