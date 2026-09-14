const { Title, Sub, H1, H2, P, Bullet, Nota, Spacer, tabel, construieste, scrie, AVERTISMENT } = require('./lib');
const T = 'Politica de confidențialitate';

const c = [
  Title('POLITICA DE CONFIDENȚIALITATE'),
  Sub('Ultima actualizare: [[ZZ.LL.AAAA]]  ·  Versiunea [[1.0]]'),
  Nota(AVERTISMENT + ' Acest document se publică pe site, la o adresa accesibilă din subsolul fiecărei pagini.'),

  H1('1. CINE SUNTEM'),
  P('[[EQUIL — DENUMIRE COMPLETĂ SRL]], cu sediul în [[ADRESA COMPLETĂ]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], este operatorul care decide scopurile și mijloacele prelucrării datelor dumneavoastră cu caracter personal.'),
  P('Ne puteți contacta în orice chestiune legată de protecția datelor la adresa [[confidentialitate@equil.ro]] sau prin poștă, la sediul indicat mai sus.'),
  P('[[Dacă ati desemnat un responsabil cu protecția datelor (DPO), adăugați aici numele și datele de contact. Desemnarea este obligatorie în cazurile prevăzute la art. 37 din GDPR.]]'),

  H1('2. CE DATE PRELUCRĂM, ÎN CE SCOP ȘI ÎN CE TEMEI'),
  P('Prelucrăm datele dumneavoastră numai atunci când avem un temei legal pentru aceasta. Tabelul de mai jos arată, pentru fiecare situație, ce date colectăm, de ce și în ce temei.'),
  Spacer(60),
  tabel(
    ['Situația', 'Date prelucrate', 'Scopul', 'Temeiul juridic'],
    [
      ['Vizitarea site-ului',
       'Adresa IP, tipul browserului, paginile vizitate, durata vizitei',
       'Funcționarea și securitatea site-ului, statistici de utilizare',
       'Interesul nostru legitim de a asigură funcționarea și securitatea site-ului — art. 6 alin. (1) lit. f) GDPR. Pentru cookie-urile neesențiale, consimțământul — art. 6 alin. (1) lit. a)'],
      ['Completarea formularului de contact',
       'Nume, prenume, e-mail, societate, numărul de angajati, mesajul transmis',
       'Răspunsul la solicitare și pregătirea unei eventuale colaborări',
       'Demersuri precontractuale la cererea dumneavoastră — art. 6 alin. (1) lit. b) GDPR'],
      ['Abonarea la newsletter',
       'Adresa de e-mail',
       'Transmiterea comunicărilor periodice solicitate',
       'Consimțământul dumneavoastră — art. 6 alin. (1) lit. a) GDPR'],
      ['Relația contractuală',
       'Date de identificare și de contact ale reprezentanților, date privind utilizarea platformei',
       'Executarea contractului, asistență tehnică, facturare',
       'Executarea contractului — art. 6 alin. (1) lit. b) GDPR'],
      ['Facturare și contabilitate',
       'Date de facturare, istoricul plăților',
       'Îndeplinirea obligațiilor fiscale și contabile',
       'Obligație legală — art. 6 alin. (1) lit. c) GDPR, coroborat cu Legea contabilității nr. 82/1991 și Codul fiscal'],
      ['Candidaturi pentru angajare',
       'Datele din CV și din scrisoarea de intenție',
       'Evaluarea candidaturii și desfășurarea procesului de recrutare',
       'Demersuri precontractuale — art. 6 alin. (1) lit. b) GDPR'],
      ['Apărarea drepturilor',
       'Orice date relevante pentru un litigiu',
       'Constatarea, exercitarea sau apărarea unui drept în instanța',
       'Interes legitim — art. 6 alin. (1) lit. f) GDPR'],
    ],
    [0.95, 1.25, 1.15, 1.5]
  ),
  Spacer(150),
  P('Nu prelucrăm categorii speciale de date (date privind sănătatea, opiniile politice, convingerile religioase, datele biometrice și altele asemenea) și nu luăm decizii automate care să producă efecte juridice asupra dumneavoastră.'),

  H1('3. CINE ARE ACCES LA DATELE DUMNEAVOASTRĂ'),
  P('Nu vindem și nu închiriem datele dumneavoastră. Le putem dezvălui numai următoarelor categorii de destinatari:'),
  Bullet('furnizorii noștri de servicii care acționează ca persoane împuternicite (găzduire, e-mail, sisteme de asistență clienți, contabilitate), pe baza unor contracte care le impun obligații stricte de confidențialitate și securitate;'),
  Bullet('consultanții noștri profesionali (avocati, auditori, contabili), ținuți de secret profesional;'),
  Bullet('autoritățile publice, atunci când avem o obligație legală de a le comunica datele;'),
  Bullet('un eventual dobânditor, în cazul unei operațiuni de transfer al afacerii, cu informarea prealabilă a persoanelor vizate.'),

  H1('4. TRANSFERUL DATELOR ÎN AFARA UNIUNII EUROPENE'),
  P('Datele dumneavoastră sunt stocate și prelucrate, ca regula, pe teritoriul Spațiului Economic European, la [[LOCAȚIA CENTRULUI DE DATE]].'),
  P('Dacă un transfer către o țară din afara SEE devine necesar, acesta se realizează numai în prezența unei decizii de adecvare a Comisiei Europene sau pe baza Clauzelor Contractuale Standard adoptate prin Decizia (UE) 2021/914. Puteți solicita o copie a acestor garanții la adresa de contact indicată la pct. 1.'),

  H1('5. CÂT TIMP PĂSTRĂM DATELE'),
  Spacer(60),
  tabel(
    ['Categoria de date', 'Durata păstrării'],
    [
      ['Mesaje din formularul de contact', '[[2]] ani de la ultima interacțiune, dacă nu se încheie un contract'],
      ['Date contractuale', 'Pe durata contractului, plus 3 ani (termenul general de prescripție, art. 2517 Cod civil)'],
      ['Documente financiar-contabile', '10 ani, conform Legii contabilității nr. 82/1991'],
      ['Date de abonare la newsletter', 'Până la retragerea consimțământului'],
      ['CV-uri ale candidaților respinși', '[[6 luni]], sau mai mult dacă ne dați acordul expres'],
      ['Jurnale tehnice și de securitate', '[[12]] luni'],
      ['Înregistrări privind consimțământul pentru cookie-uri', '[[24]] de luni'],
    ],
    [1.2, 1.8]
  ),
  Spacer(150),
  P('La expirarea acestor termene, datele sunt șterse sau anonimizate ireversibil.'),

  H1('6. DREPTURILE DUMNEAVOASTRĂ'),
  P('În calitate de persoana vizată, aveți următoarele drepturi, prevăzute la art. 15-22 din GDPR:'),
  Bullet('dreptul de acces — să aflați dacă prelucrăm date despre dumneavoastră și să primiți o copie a acestora;'),
  Bullet('dreptul la rectificare — să cereți corectarea datelor inexacte sau completarea celor incomplete;'),
  Bullet('dreptul la ștergere ("dreptul de a fi uitat") — să cereți ștergerea datelor, în situațiile prevăzute de lege;'),
  Bullet('dreptul la restricționarea prelucrării — să cereți limitarea prelucrării, în anumite situații;'),
  Bullet('dreptul la portabilitate — să primiți datele într-un format structurat, care poate fi citit automat, și să le transmiteți altui operator;'),
  Bullet('dreptul la opoziție — să vă opuneți prelucrării întemeiate pe interesul nostru legitim; în cazul marketingului direct, opoziția produce efecte necondiționat;'),
  Bullet('dreptul de a vă retrage consimțământul, oricând, fără a afecta legalitatea prelucrării efectuate anterior retragerii;'),
  Bullet('dreptul de a nu face obiectul unei decizii bazate exclusiv pe prelucrarea automată, inclusiv crearea de profiluri.'),

  H1('7. CUM VA EXERCITAȚI DREPTURILE'),
  P('Trimiteți-ne o cerere la [[confidentialitate@equil.ro]] sau prin poștă, la sediul nostru. Vă răspundem în termen de cel mult o luna de la primirea cererii. Acest termen poate fi prelungit cu încă două luni, în cazul cererilor complexe sau numeroase, situație în care vă vom informa despre prelungire și despre motivele acesteia.'),
  P('Exercitarea drepturilor este gratuită. Dacă cererile sunt vădit nefondate sau excesive, în special din cauza caracterului lor repetitiv, putem percepe o taxă rezonabilă sau putem refuza să dăm curs cererii, motivandu-ne poziția.'),
  P('Pentru a vă proteja datele, este posibil să vă solicităm informații suplimentare necesare confirmării identității.'),

  H1('8. DREPTUL DE A DEPUNE O PLÂNGERE'),
  P('Dacă apreciați că v-am încălcat drepturile, vă rugăm să ne contactați mai întâi pe noi — de cele mai multe ori putem rezolva situația direct.'),
  P('Aveți însă oricând dreptul de a depune o plângere la Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP):'),
  P('B-dul G-ral. Gheorghe Magheru nr. 28-30, sector 1, cod poștal 010336, București, România', { indent: true }),
  P('Telefon: +40 318 059 211  ·  E-mail: anspdcp@dataprotection.ro  ·  www.dataprotection.ro', { indent: true }),
  P('De asemenea, vă puteți adresa instanțelor judecătorești competențe.'),

  H1('9. SECURITATEA DATELOR'),
  P('Aplicăm măsuri tehnice și organizatorice adecvate pentru a proteja datele împotriva accesului neautorizat, pierderii, distrugerii sau modificării accidentale: criptarea comunicațiilor și a datelor stocate, controlul accesului pe roluri, autentificare în doi factori pentru conturile administrative, jurnalizarea operațiunilor, copii de siguranță periodice și instruirea personalului.'),
  P('Niciun sistem informatic nu oferă însă o garanție absolută. Dacă survine o încălcare a securității care prezintă un risc ridicat pentru drepturile dumneavoastră, vă vom informa fără întârziere nejustificată, conform art. 34 din GDPR.'),

  H1('10. COOKIE-URI'),
  P('Site-ul nostru utilizează cookie-uri și tehnologii similare. Detaliile complete, inclusiv lista cookie-urilor și modul în care vă puteți retrage consimțământul, se regăsesc în Politica de cookie-uri, disponibilă la [[adresa]].'),

  H1('11. MODIFICĂRI ALE ACESTEI POLITICI'),
  P('Putem actualiza periodic această politică. Versiunea în vigoare este întotdeauna cea publicată pe site, cu data ultimei actualizări indicată la început.'),
  P('Dacă operăm modificări substanțiale care vă afectează drepturile, vă vom informa în prealabil prin e-mail sau prîntr-un anunt vizibil pe site, cu cel puțin [[30]] de zile înainte de intrarea în vigoare.'),

  H1('12. CONTACT'),
  P('Pentru orice întrebare privind această politică sau modul în care vă prelucrăm datele:'),
  P('[[EQUIL SRL]]  ·  [[ADRESA]]  ·  [[confidentialitate@equil.ro]]  ·  [[+40 __ ___ ____]]', { indent: true }),
];

(async () => { await scrie('04-Politica-de-confidentialitate.docx', construieste(c, { titlu: T })); })();
