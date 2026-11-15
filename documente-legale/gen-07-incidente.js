const { Title, Sub, H1, H2, P, Bullet, Nota, Spacer, tabel, construieste, scrie, AVERTISMENT } = require('./lib');
const { Paragraph, PageBreak } = require('docx');
const T = 'Procedura privind incidentele de securitate';
const Break = () => new Paragraph({ children: [new PageBreak()] });

const c = [
  Title('PROCEDURA DE GESTIONARE A INCIDENTELOR DE SECURITATE'),
  Sub('privind datele cu caracter personal  ·  art. 33 și 34 din Regulamentul (UE) 2016/679'),
  Nota(AVERTISMENT + ' Document intern. Termenul de 72 de ore prevăzut de GDPR curge de la momentul în care luați cunoștință de incident, nu de la momentul în care îl înțelegeți complet.'),

  H1('1. SCOP ȘI DOMENIU DE APLICARE'),
  P('1.1. Prezenta procedura stabilește modul în care [[EQUIL SRL]] identifică, evaluează, documentează și notifică încălcările securității datelor cu caracter personal.'),
  P('1.2. Procedura se aplică întregului personal, colaboratorilor și furnizorilor care au acces la datele prelucrate de societate, indiferent de forma sau de suportul acestora.'),

  H1('2. DEFINIȚII'),
  P('"Încălcarea securității datelor cu caracter personal" — o încălcare a securității care duce, în mod accidental sau ilegal, la distrugerea, pierderea, modificarea, divulgarea neautorizată sau accesul neautorizat la datele transmise, stocate sau prelucrate în alt mod (art. 4 pct. 12 GDPR).'),
  P('Constituie incidente, printre altele: accesul unei persoane neautorizate la baza de date; transmiterea unui e-mail cu date personale către un destinatar greșit; pierderea sau furtul unui laptop ori telefon de serviciu necriptat; atacul informatic soldat cu criptarea sau exfiltrarea datelor; ștergerea accidentală și ireversibilă a unor date; publicarea din eroare a unor date pe site.'),
  P('"A lua cunoștință" — momentul în care societatea are un grad rezonabil de certitudine că s-a produs un incident de securitate care a afectat date cu caracter personal.'),

  H1('3. ROLURI ȘI RESPONSABILITĂȚI'),
  Spacer(50),
  tabel(
    ['Rol', 'Responsabilități'],
    [
      ['Orice angajat sau colaborator', 'Raportează de îndată, în maximum 1 ora de la constatare, orice suspiciune de incident, folosind formularul din Anexa 1'],
      ['[[Responsabilul de securitate]]', 'Primește raportarea, coordonează investigația tehnică, dispune măsurile imediate de limitare, completează registrul incidentelor'],
      ['[[DPO / Persoana de contact GDPR]]', 'Evaluează riscul pentru drepturile persoanelor vizate, redactează notificarea către ANSPDCP și către persoanele vizate'],
      ['[[Conducerea societății]]', 'Aprobă notificările externe, alocă resursele necesare, decide comunicarea publică'],
      ['[[Responsabilul de comunicare]]', 'Gestionează comunicarea către clienți, parteneri și, dacă este cazul, către presă'],
    ],
    [1, 2.4]
  ),

  H1('4. ETAPELE PROCEDURII'),

  H2('Etapa 1 — Detectare și raportare internă (imediat, maximum 1 ora)'),
  Bullet('Persoana care constată incidentul îl raportează de îndată [[Responsabilului de securitate]], la [[securitate@equil.ro]] sau telefonic la [[număr]].'),
  Bullet('Raportarea se face și în cazul unei simple suspiciuni. Este preferabilă o alarmă falsă unei notificări întârziate.'),
  Bullet('Se completează formularul din Anexa 1, fără a întârzia raportarea inițială pentru completarea acestuia.'),
  Bullet('Se consemnează data și ora exactă a constatării — de la acest moment curge termenul de 72 de ore.'),

  H2('Etapa 2 — Măsuri imediate de limitare (primele ore)'),
  Bullet('Izolarea sistemelor afectate, fără distrugerea probelor.'),
  Bullet('Revocarea acreditărilor compromise și resetarea parolelor afectate.'),
  Bullet('Păstrarea jurnalelor și a probelor tehnice pentru investigație.'),
  Bullet('Dacă incidentul este în desfășurare, oprirea mecanismului care îl produce.'),

  H2('Etapa 3 — Evaluarea riscului (în maximum 24 de ore)'),
  P('[[DPO]] evaluează nivelul de risc pentru drepturile și libertățile persoanelor vizate, având în vedere: natura și volumul datelor afectate; numărul persoanelor vizate; ușurința identificării acestora; gravitatea consecințelor posibile; caracteristicile persoanelor vizate; măsurile de protecție aplicate anterior, precum criptarea.'),
  Spacer(50),
  tabel(
    ['Nivel de risc', 'Criterii orientative', 'Obligații care decurg'],
    [
      ['Scăzut', 'Date criptate corespunzător, volum redus, fără consecințe previzibile pentru persoanele vizate', 'Se consemnează în registrul intern. Nu se notifică.'],
      ['Mediu', 'Date de identificare sau de contact expuse, fără risc de fraudă sau discriminare', 'Se notifică ANSPDCP în 72 de ore. Persoanele vizate — după caz.'],
      ['Ridicat', 'Date financiare, volum mare, risc de fraudă, furt de identitate, discriminare sau prejudiciu de imagine', 'Se notifică ANSPDCP în 72 de ore ȘI persoanele vizate, fără întârziere nejustificată.'],
    ],
    [0.7, 2.1, 1.6]
  ),

  H2('Etapa 4 — Notificarea ANSPDCP (în maximum 72 de ore)'),
  P('Se transmite prin formularul electronic disponibil pe www.dataprotection.ro sau la anspdcp@dataprotection.ro. Notificarea cuprinde obligatoriu, conform art. 33 alin. (3) GDPR:'),
  Bullet('descrierea naturii încălcării, inclusiv categoriile și numărul aproximativ al persoanelor vizate și al înregistrărilor afectate;'),
  Bullet('numele și datele de contact ale [[DPO]] sau ale punctului de contact;'),
  Bullet('descrierea consecințelor probabile ale încălcării;'),
  Bullet('descrierea măsurilor luate sau propuse pentru remedierea încălcării și pentru atenuarea eventualelor efecte negative.'),
  P('Dacă cele 72 de ore sunt depășite, notificarea se transmite oricum, însoțită de motivele întârzierii. Dacă informațiile nu sunt complete, se transmite o notificare inițială, urmată de completări etapizate.'),

  H2('Etapa 5 — Informarea persoanelor vizate (numai la risc ridicat)'),
  P('Informarea se face într-un limbaj clar și simplu și cuprinde: descrierea naturii încălcării, datele de contact ale [[DPO]], consecințele probabile și măsurile luate, precum și recomandări concrete pentru persoanele vizate (de exemplu schimbarea parolei, monitorizarea conturilor bancare).'),
  P('Informarea individuală nu este necesară dacă: datele erau criptate cu un algoritm considerat sigur; au fost luate măsuri ulterioare care fac improbabilă materializarea riscului; sau ar presupune un efort disproporționat, caz în care se face o comunicare publică cu efect echivalent.'),

  H2('Etapa 6 — Remediere și învățare'),
  Bullet('Eliminarea cauzei care a permis incidentul.'),
  Bullet('Verificarea eficacității măsurilor aplicate.'),
  Bullet('Analiza post-incident în maximum [[15]] zile, cu identificarea măsurilor de prevenire.'),
  Bullet('Actualizarea procedurilor și instruirea personalului, dacă este cazul.'),

  H1('5. DOCUMENTARE'),
  P('5.1. Toate incidentele se consemnează în registrul din Anexa 2, indiferent dacă au fost sau nu notificate. Obligația rezultă din art. 33 alin. (5) din GDPR.'),
  P('5.2. Registrul și documentația aferentă se păstrează [[5]] ani și se pun la dispoziția ANSPDCP la cerere.'),
  P('5.3. Dacă incidentul privește date prelucrate în numele unui client, acesta se notifică în maximum [[24]] de ore, conform acordului de prelucrare a datelor.'),

  Break(),

  H1('ANEXA 1 — FORMULAR DE RAPORTARE A INCIDENTULUI'),
  Spacer(60),
  tabel(
    ['Câmp', 'De completat'],
    [
      ['Numărul incidentului', ''],
      ['Data și ora constatării', ''],
      ['Numele persoanei care raportează', ''],
      ['Modul în care a fost descoperit', ''],
      ['Descrierea incidentului', ''],
      ['Sistemele și datele afectate', ''],
      ['Categorii de persoane vizate afectate', ''],
      ['Numărul estimat al persoanelor afectate', ''],
      ['Datele erau criptate?', ''],
      ['Incidentul este în desfășurare?', ''],
      ['Măsuri imediate luate', ''],
      ['Privește date ale unui client?', ''],
    ],
    [1.2, 2]
  ),

  Break(),

  H1('ANEXA 2 — REGISTRUL INCIDENTELOR DE SECURITATE'),
  P('Se completează pentru fiecare incident, inclusiv pentru cele care nu au fost notificate.'),
  Spacer(60),
  tabel(
    ['Nr.', 'Data', 'Descrierea incidentului', 'Nivel de risc', 'Notificat ANSPDCP', 'Notificate persoanele vizate', 'Măsuri luate'],
    [
      ['1', '', '', '', 'Da / Nu — data', 'Da / Nu — data', ''],
      ['2', '', '', '', '', '', ''],
      ['3', '', '', '', '', '', ''],
    ],
    [0.35, 0.7, 1.9, 0.7, 0.95, 1, 1.4]
  ),
];

(async () => { await scrie('07-Procedura-incidente-de-securitate.docx', construieste(c, { titlu: T, landscape: false })); })();
