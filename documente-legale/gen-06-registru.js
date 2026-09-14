const { Title, Sub, H1, H2, P, Nota, Spacer, tabel, construieste, scrie, AVERTISMENT } = require('./lib');
const T = 'Registrul activităților de prelucrare';

const c = [
  Title('REGISTRUL ACTIVITĂȚILOR DE PRELUCRARE'),
  Sub('întocmit în temeiul art. 30 din Regulamentul (UE) 2016/679 (GDPR)'),
  Nota(AVERTISMENT + ' Acesta este un document intern, care NU se publică. Se pune la dispoziția ANSPDCP la cerere. Se actualizează ori de câte ori apare o activitate nouă de prelucrare.'),

  H1('DATE DE IDENTIFICARE'),
  Spacer(50),
  tabel(
    ['Câmp', 'Conținut'],
    [
      ['Denumirea operatorului', '[[EQUIL — DENUMIRE COMPLETĂ SRL]]'],
      ['Sediu', '[[ADRESA COMPLETĂ]]'],
      ['CUI / Nr. Reg. Com.', '[[RO________]] / [[J__/____/____]]'],
      ['Reprezentant legal', '[[NUME, FUNCȚIA]]'],
      ['Responsabil cu protecția datelor (DPO)', '[[NUME și date de contact, dacă a fost desemnat — altfel: nu a fost desemnat, nefiind întrunite condițiile art. 37 GDPR]]'],
      ['Persoana de contact pentru protecția datelor', '[[NUME, e-mail, telefon]]'],
      ['Data întocmirii', '[[ZZ.LL.AAAA]]'],
      ['Data ultimei actualizări', '[[ZZ.LL.AAAA]]'],
    ],
    [1, 2]
  ),

  H1('PARTEA A — PRELUCRĂRI ÎN CALITATE DE OPERATOR'),
  P('Activitățile în care societatea stabilește singură scopurile și mijloacele prelucrării (art. 30 alin. (1) GDPR).'),

  H2('A1. Administrarea relației cu clienții'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Scopul prelucrării', 'Încheierea și executarea contractelor, facturare, asistență tehnică, comunicări legate de serviciu'],
    ['Temeiul juridic', 'Art. 6 alin. (1) lit. b) GDPR — executarea contractului; lit. c) — obligații fiscale și contabile'],
    ['Categorii de persoane vizate', 'Reprezentanți și persoane de contact ale clienților, utilizatori ai platformei'],
    ['Categorii de date', 'Nume, prenume, funcție, e-mail de serviciu, telefon, societatea reprezentată, date de facturare'],
    ['Destinatari', 'Furnizorul de servicii contabile, furnizorul de găzduire, autorități fiscale la solicitare'],
    ['Transferuri în afara SEE', '[[Nu / Da — a se preciza garanțiile]]'],
    ['Termen de ștergere', 'Durata contractului + 3 ani; documentele financiar-contabile 10 ani (Legea 82/1991)'],
    ['Măsuri de securitate', 'Acces pe roluri, autentificare în doi factori, criptare în tranzit și în repaus, jurnalizare, copii de siguranță'],
  ], [1, 2.3]),

  H2('A2. Marketing și comunicări comerciale'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Scopul prelucrării', 'Transmiterea newsletterului și a materialelor informative către persoanele abonate'],
    ['Temeiul juridic', 'Art. 6 alin. (1) lit. a) GDPR — consimțământul'],
    ['Categorii de persoane vizate', 'Abonați la newsletter, persoane care și-au exprimat interesul'],
    ['Categorii de date', 'Adresa de e-mail, [[nume, societate — dacă se colectează]], istoricul deschiderilor'],
    ['Destinatari', '[[Furnizorul platformei de e-mail marketing]]'],
    ['Transferuri în afara SEE', '[[Nu / Da — Clauze Contractuale Standard]]'],
    ['Termen de ștergere', 'Până la retragerea consimțământului; dovada consimțământului se păstrează 3 ani după retragere'],
    ['Măsuri de securitate', 'Acces restricționat, dublă confirmare a abonării, legătură de dezabonare în fiecare mesaj'],
  ], [1, 2.3]),

  H2('A3. Recrutarea personalului'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Scopul prelucrării', 'Evaluarea candidaturilor și desfășurarea procesului de selecție'],
    ['Temeiul juridic', 'Art. 6 alin. (1) lit. b) GDPR — demersuri precontractuale; consimțământul pentru păstrarea prelungită'],
    ['Categorii de persoane vizate', 'Candidați la posturile scoase la concurs'],
    ['Categorii de date', 'Date din CV: identificare, contact, studii, experiență profesională, competențe'],
    ['Destinatari', 'Personalul implicat în recrutare; [[platforma de recrutare, dacă se folosește]]'],
    ['Transferuri în afara SEE', '[[Nu]]'],
    ['Termen de ștergere', '[[6]] luni de la finalizarea procesului, sau [[2]] ani cu acordul expres al candidatului'],
    ['Măsuri de securitate', 'Acces limitat la echipa de recrutare, stocare în spațiu dedicat cu drepturi restrânse'],
  ], [1, 2.3]),

  H2('A4. Administrarea resurselor umane'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Scopul prelucrării', 'Executarea contractelor individuale de muncă, salarizare, raportări obligatorii'],
    ['Temeiul juridic', 'Art. 6 alin. (1) lit. b) și c) GDPR; Codul muncii; legislația fiscală și de asigurări sociale'],
    ['Categorii de persoane vizate', 'Angajati, colaboratori, membri de familie aflați în întreținere'],
    ['Categorii de date', 'Date de identificare, CNP, adresa, date bancare, funcție, salariu, evidența timpului lucrat'],
    ['Destinatari', 'ITM, ANAF, casele de asigurări, bancă, furnizorul de servicii de salarizare'],
    ['Transferuri în afara SEE', 'Nu'],
    ['Termen de ștergere', 'Dosarul de personal — 75 de ani (Legea Arhivelor Naționale nr. 16/1996); documentele de salarizare — 50 de ani'],
    ['Măsuri de securitate', 'Acces strict limitat, dulapuri încuiate pentru documentele pe hârtie, criptare pentru cele electronice'],
  ], [1, 2.3]),

  H2('A5. Securitatea și funcționarea site-ului'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Scopul prelucrării', 'Asigurarea funcționării și securității site-ului, prevenirea abuzurilor, statistici de utilizare'],
    ['Temeiul juridic', 'Art. 6 alin. (1) lit. f) GDPR — interes legitim; lit. a) pentru cookie-urile neesențiale'],
    ['Categorii de persoane vizate', 'Vizitatorii site-ului'],
    ['Categorii de date', 'Adresa IP, tipul browserului, paginile accesate, momentul accesării, identificatori din cookie-uri'],
    ['Destinatari', '[[Furnizorul de găzduire, furnizorul de statistici web]]'],
    ['Transferuri în afara SEE', '[[Nu / Da — a se preciza]]'],
    ['Termen de ștergere', 'Jurnale tehnice [[12]] luni; date statistice [[24]] de luni'],
    ['Măsuri de securitate', 'Certificat TLS, filtrare a traficului, acces restricționat la jurnale'],
  ], [1, 2.3]),

  H1('PARTEA B — PRELUCRĂRI ÎN CALITATE DE PERSOANA ÎMPUTERNICITĂ'),
  P('Activitățile desfășurate în numele și pe seama clienților, în temeiul art. 30 alin. (2) din GDPR.'),
  Spacer(50),
  tabel(['Element', 'Conținut'], [
    ['Operatorii în numele cărora se prelucrează', 'Clienții care au încheiat contract de furnizare a serviciilor EQUIL. Lista completă: [[a se menține separat, actualizată]]'],
    ['Categorii de prelucrări efectuate', 'Colectare, stocare, structurare, consultare, utilizare, transmitere și ștergere a datelor introduse în platforma de clienți sau colectate prin platforma în numele acestora'],
    ['Scopul', 'Furnizarea platformei de automatizare a operațiunilor, analiza datelor și măsurare a satisfacției clienților'],
    ['Categorii de persoane vizate', 'Angajații și clienții operatorilor, reprezentanții partenerilor acestora'],
    ['Categorii de date', 'Date de identificare și de contact, date profesionale, date tranzacționale, răspunsuri la chestionare de satisfacție, date tehnice de utilizare'],
    ['Subîmputerniciți', '[[a se enumera — aceeași listă ca în Anexa 3 la acordul de prelucrare]]'],
    ['Transferuri în afara SEE', '[[Nu / Da — Clauze Contractuale Standard]]'],
    ['Termen de ștergere', 'Conform instrucțiunilor operatorului și acordului de prelucrare: [[30]] de zile pentru export, [[90]] de zile pentru ștergere, [[180]] de zile pentru copiile de siguranță'],
    ['Măsuri de securitate', 'Cele descrise în Anexa 2 la acordul de prelucrare a datelor'],
  ], [1, 2.3]),

  H1('ISTORICUL ACTUALIZĂRILOR'),
  Spacer(50),
  tabel(
    ['Data', 'Modificarea operată', 'Efectuată de'],
    [
      ['[[ZZ.LL.AAAA]]', 'Întocmirea inițială a registrului', '[[NUME]]'],
      ['', '', ''],
      ['', '', ''],
      ['', '', ''],
    ],
    [0.8, 2.4, 1]
  ),
];

(async () => { await scrie('06-Registrul-activitatilor-de-prelucrare.docx', construieste(c, { titlu: T })); })();
