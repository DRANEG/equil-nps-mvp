const { Title, Sub, H1, P, Bullet, Nota, Spacer, tabel, construieste, scrie, AVERTISMENT } = require('./lib');
const T = 'Politica de cookie-uri';

const c = [
  Title('POLITICA DE COOKIE-URI'),
  Sub('Ultima actualizare: [[ZZ.LL.AAAA]]  ·  Versiunea [[1.0]]'),
  Nota(AVERTISMENT + ' Lista cookie-urilor trebuie să reflecte exact ce instrumente folosiți efectiv pe site. Verificați-o cu un scaner de cookie-uri înainte de publicare.'),

  H1('1. CE SUNT COOKIE-URILE'),
  P('Cookie-urile sunt fișiere text de mici dimensiuni, plasate pe dispozitivul dumneavoastră atunci când vizitați un site. Ele permit site-ului să rețină acțiunile și preferințele dumneavoastră pe o anumită perioadă, astfel încât să nu fie nevoie să le reintroduceți la fiecare vizită.'),
  P('Prin "cookie-uri" înțelegem în această politică și tehnologiile similare: local storage, session storage, pixeli de urmărire și identificatori de dispozitiv.'),

  H1('2. TEMEIUL LEGAL'),
  P('Plasarea cookie-urilor este reglementată de art. 4 alin. (5) din Legea nr. 506/2004 privind prelucrarea datelor cu caracter personal și protecția vieții private în sectorul comunicațiilor electronice, precum și de Regulamentul (UE) 2016/679 (GDPR).'),
  P('Cookie-urile strict necesare funcționării site-ului se plasează fără consimțământul dumneavoastră, în temeiul interesului legitim. Toate celelalte categorii — funcționale, analitice și de marketing — se plasează numai după ce ne dați consimțământul explicit, prin bannerul afișat la prima vizită.'),
  P('Până la exprimarea unei opțiuni, pe dispozitivul dumneavoastră nu se plasează niciun cookie neesențial.'),

  H1('3. CATEGORII DE COOKIE-URI'),
  Spacer(60),
  tabel(
    ['Categorie', 'La ce servesc', 'Necesită consimțământ'],
    [
      ['Strict necesare', 'Asigură funcționarea de bază: navigarea, autentificarea, securitatea sesiunii, reținerea opțiunii privind cookie-urile. Fără ele, site-ul nu poate funcționa.', 'Nu'],
      ['Funcționale', 'Rețin preferințele dumneavoastră: limba, regiunea, elementele de interfață alese.', 'Da'],
      ['Analitice', 'Ne arată, în mod agregat, cum este folosit site-ul: ce pagini sunt vizitate, cât timp, de unde vin vizitatorii. Ne ajută să îmbunătățim conținutul.', 'Da'],
      ['De marketing', 'Permit măsurarea eficienței campaniilor și afișarea de reclame relevante pe alte site-uri.', 'Da'],
    ],
    [0.85, 2.4, 0.85]
  ),

  H1('4. COOKIE-URILE FOLOSITE PE ACEST SITE'),
  Nota('Înlocuiți rândurile de mai jos cu cookie-urile reale ale site-ului. Un tabel care nu corespunde realității este el însuși o neconformitate.'),
  Spacer(60),
  tabel(
    ['Denumire', 'Furnizor', 'Scop', 'Durata', 'Categorie'],
    [
      ['[[equil_session]]', 'EQUIL (propriu)', 'Menține sesiunea de navigare', 'Sesiune', 'Strict necesar'],
      ['[[equil_consent]]', 'EQUIL (propriu)', 'Rețin opțiunea privind cookie-urile', '[[6]] luni', 'Strict necesar'],
      ['[[csrf_token]]', 'EQUIL (propriu)', 'Protecție împotriva atacurilor CSRF', 'Sesiune', 'Strict necesar'],
      ['[[equil_lang]]', 'EQUIL (propriu)', 'Rețin limba selectată', '[[12]] luni', 'Funcțional'],
      ['[[_ga]]', '[[Google Analytics]]', 'Distinge utilizatorii pentru statistici', '[[24]] de luni', 'Analitic'],
      ['[[_ga_XXXX]]', '[[Google Analytics]]', 'Menține starea sesiunii de analiza', '[[24]] de luni', 'Analitic'],
    ],
    [1.1, 1.05, 1.5, 0.75, 0.9]
  ),

  H1('5. CUM VA GESTIONAȚI OPȚIUNILE'),
  P('La prima vizită pe site vă afișăm un banner prin care puteți accepta toate cookie-urile, le puteți respinge pe cele neesențiale sau vă puteți configura opțiunile pe categorii. Refuzul este la fel de simplu ca acceptul.'),
  P('Vă puteți modifica sau retrage oricând consimțământul, accesând [[linkul "Setări cookie-uri" din subsolul site-ului]]. Retragerea nu afectează legalitatea prelucrării efectuate anterior.'),

  H1('6. ȘTERGEREA COOKIE-URILOR DIN BROWSER'),
  P('Independent de opțiunile exprimate pe site, puteți șterge sau bloca cookie-urile direct din browser:'),
  Bullet('Google Chrome: Setări → Confidențialitate și securitate → Cookie-uri și alte date ale site-urilor;'),
  Bullet('Mozilla Firefox: Setări → Confidențialitate și securitate → Cookie-uri și date de site-uri;'),
  Bullet('Safari: Preferințe → Confidențialitate → Gestionare date site-uri web;'),
  Bullet('Microsoft Edge: Setări → Cookie-uri și permisiuni pentru site-uri.'),
  P('Blocarea cookie-urilor strict necesare poate împiedica funcționarea corectă a site-ului.'),

  H1('7. DATELE CU CARACTER PERSONAL ȘI DREPTURILE DUMNEAVOASTRĂ'),
  P('Unele cookie-uri prelucrează date cu caracter personal, precum adresa IP sau identificatori unici. Informații complete despre modul în care prelucrăm aceste date, despre drepturile pe care le aveți și despre modul de exercitare a acestora găsiți în Politica de confidențialitate, disponibilă la [[adresa]].'),
  P('Aveți dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, București, anspdcp@dataprotection.ro.'),

  H1('8. MODIFICĂRI'),
  P('Această politică poate fi actualizată ori de câte ori modificăm cookie-urile folosite. Data ultimei actualizări este indicată la începutul documentului.'),

  H1('9. CONTACT'),
  P('[[EQUIL SRL]]  ·  [[ADRESA]]  ·  [[confidentialitate@equil.ro]]', { indent: true }),
];

(async () => { await scrie('05-Politica-de-cookie-uri.docx', construieste(c, { titlu: T })); })();
