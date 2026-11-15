const L = require('./lib');
const { Title, Sub, H1, H2, P, Bullet, Nota, Rule, Spacer, tabel, semnaturi, construieste, scrie, AVERTISMENT } = L;

const T = 'Acord de prelucrare a datelor (DPA)';

const c = [
  Title('ACORD DE PRELUCRARE A DATELOR CU CARACTER PERSONAL'),
  Sub('încheiat în temeiul art. 28 din Regulamentul (UE) 2016/679 (GDPR)'),
  Nota(AVERTISMENT),

  H1('PĂRȚILE'),
  P('[[DENUMIRE CLIENT SRL/SA]], cu sediul în [[ADRESA COMPLETĂ]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], reprezentată legal prin [[NUME]], în calitate de [[FUNCȚIA]], denumită în continuare "Operatorul",'),
  P('și'),
  P('[[EQUIL — DENUMIRE COMPLETĂ SRL]], cu sediul în [[ADRESA COMPLETĂ]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], reprezentată legal prin [[NUME]], în calitate de [[FUNCȚIA]], denumită în continuare "Persoana împuternicită",'),
  P('denumite împreună "Părțile", au convenit încheierea prezentului acord de prelucrare a datelor (denumit în continuare "Acordul").'),

  H1('PREAMBUL'),
  P('Părțile au încheiat contractul de furnizare de servicii nr. [[NUMĂR]] din data de [[ZZ.LL.AAAA]] (denumit în continuare "Contractul principal"), în executarea caruia Persoana împuternicită prelucrează date cu caracter personal în numele și pe seama Operatorului.'),
  P('Prezentul Acord stabilește condițiile în care are loc aceasta prelucrare și constituie anexa și parte integrantă a Contractului principal. În caz de contradictie între prevederile prezentului Acord și cele ale Contractului principal, în materie de protecție a datelor cu caracter personal prevalează prezentul Acord.'),

  H1('ART. 1 — DEFINIȚII'),
  P('Termenii "date cu caracter personal", "prelucrare", "operator", "persoana împuternicită de operator", "persoana vizată", "încălcarea securității datelor cu caracter personal" și "autoritate de supraveghere" au înțelesul atribuit prin art. 4 din GDPR.'),
  P('"GDPR" desemnează Regulamentul (UE) 2016/679 al Parlamentului European și al Consiliului din 27 aprilie 2016 privind protecția persoanelor fizice în ceea ce privește prelucrarea datelor cu caracter personal și privind libera circulație a acestor date.'),
  P('"Datele Operatorului" desemnează datele cu caracter personal descrise în Anexa 1, prelucrate de Persoana împuternicită exclusiv în numele Operatorului.'),
  P('"Subîmputernicit" desemnează orice terț angajat de Persoana împuternicită pentru a desfășura activități de prelucrare în numele Operatorului.'),

  H1('ART. 2 — OBIECTUL ȘI DURATA PRELUCRĂRII'),
  P('2.1. Obiectul, durata, natura și scopul prelucrării, tipul de date cu caracter personal și categoriile de persoane vizate sunt descrise detaliat în Anexa 1, care face parte integrantă din prezentul Acord.'),
  P('2.2. Prelucrarea se desfasoara pe întreaga durata a Contractului principal și încetează odată cu acesta, sub rezerva obligațiilor de ștergere sau returnare prevăzute la art. 12.'),

  H1('ART. 3 — INSTRUCȚIUNILE OPERATORULUI'),
  P('3.1. Persoana împuternicită prelucrează Datele Operatorului exclusiv pe baza instrucțiunilor documentate primite de la Operator, inclusiv în ceea ce privește transferurile către o țară terta sau o organizație internațională, cu excepția cazului în care aceasta obligație ii revine în temeiul dreptului Uniunii sau al dreptului național.'),
  P('3.2. Constituie instrucțiuni documentate ale Operatorului: prezentul Acord, Contractul principal, precum și orice instrucțiune ulterioara transmisa în scris, inclusiv prin e-mail sau prin intermediul funcționalităților platformei.'),
  P('3.3. În situația prevazuta la art. 3.1 teza finala, Persoana împuternicită informează Operatorul cu privire la aceasta cerință legală înainte de prelucrare, cu excepția cazului în care dreptul aplicabil interzice o astfel de informare din motive importante legate de interesul public.'),
  P('3.4. Persoana împuternicită informează de îndată Operatorul dacă, în opinia să, o instrucțiune primita încalcă GDPR sau alte dispoziții privind protecția datelor. În acest caz, Persoana împuternicită poate suspenda executarea instrucțiunii până la clarificarea acesteia.'),

  H1('ART. 4 — OBLIGAȚIILE PERSOANEI ÎMPUTERNICITE'),
  P('În conformitate cu art. 28 alin. (3) din GDPR, Persoana împuternicită:'),
  Bullet('prelucrează datele numai pe baza instrucțiunilor documentate ale Operatorului;'),
  Bullet('se asigură ca persoanele autorizate să prelucreze datele s-au angajat să respecte confidențialitatea sau au o obligație legală de confidențialitate;'),
  Bullet('adopta toate măsurile de securitate necesare în temeiul art. 32 din GDPR, descrise în Anexa 2;'),
  Bullet('respecta condițiile privind recrutarea unui alt împuternicit, prevăzute la art. 28 alin. (2) și (4) din GDPR și detaliate la art. 7 din prezentul Acord;'),
  Bullet('asista Operatorul, prin măsuri tehnice și organizatorice adecvate, în îndeplinirea obligației de a răspunde cererilor privind exercitarea drepturilor persoanelor vizate;'),
  Bullet('asista Operatorul în asigurarea respectării obligațiilor prevăzute la art. 32-36 din GDPR, ținând seama de natura prelucrării și de informațiile aflate la dispoziția să;'),
  Bullet('la încetarea prestării serviciilor, șterge sau returnează Operatorului toate datele, conform opțiunii acestuia, și elimina copiile existente, cu excepția cazului în care păstrarea este impusă de dreptul aplicabil;'),
  Bullet('pune la dispoziția Operatorului toate informațiile necesare pentru a demonstra respectarea obligațiilor prevăzute la art. 28 din GDPR și permite desfășurarea auditurilor, în condițiile art. 11.'),

  H1('ART. 5 — CONFIDENȚIALITATEA PERSONALULUI'),
  P('5.1. Persoana împuternicită se asigură ca accesul la Datele Operatorului este limitat la personalul care are nevoie de acest acces pentru executarea Contractului principal, pe baza principiului necesității de a cunoaste.'),
  P('5.2. Întreg personalul cu drept de acces a semnat angajamente de confidențialitate cu valabilitate care se menține și după încetarea raporturilor de muncă.'),
  P('5.3. Persoana împuternicită asigură instruirea periodica a personalului sau în materie de protecție a datelor, cel puțin anual.'),

  H1('ART. 6 — MĂSURI DE SECURITATE'),
  P('6.1. Persoana împuternicită implementează măsurile tehnice și organizatorice adecvate prevăzute la art. 32 din GDPR, descrise în Anexa 2, având în vedere stadiul actual al dezvoltării tehnologice, costurile implementării, natura, domeniul de aplicare, contextul și scopurile prelucrării, precum și riscul pentru drepturile și libertățile persoanelor fizice.'),
  P('6.2. Persoana împuternicită poate actualiza măsurile de securitate pe parcursul derulării Contractului principal, cu conditia ca nivelul de protecție să nu fie diminuat.'),
  P('6.3. Persoana împuternicită evaluează periodic, cel puțin anual, eficacitatea măsurilor implementate și documentează aceste evaluari.'),

  H1('ART. 7 — SUBÎMPUTERNICIȚI'),
  P('7.1. Operatorul acordă Persoanei împuternicite o autorizare generala pentru angajarea de subîmputerniciți, în condițiile prezentului articol.'),
  P('7.2. Subîmputerniciții aprobați la data semnării prezentului Acord sunt enumerati în Anexa 3.'),
  P('7.3. Persoana împuternicită informează Operatorul cu privire la orice intenție de a adaugă sau înlocui un subîmputernicit, cu cel puțin [[30]] de zile înainte de operarea modificării. Operatorul poate formula obiectii întemeiate în termen de [[15]] zile de la primirea informării.'),
  P('7.4. În cazul unei obiectii întemeiate care nu poate fi soluționată, oricare dintre Părți poate denunța unilateral Contractul principal, cu respectarea unui preaviz de [[30]] de zile, fără plata de daune-interese.'),
  P('7.5. Persoana împuternicită impune fiecarui subîmputernicit, prin contract, aceleasi obligații de protecție a datelor ca cele prevăzute în prezentul Acord și răspunde integral față de Operator pentru neindeplinirea de către subîmputernicit a obligațiilor sale.'),

  H1('ART. 8 — ASISTENȚĂ ACORDATĂ OPERATORULUI'),
  P('8.1. Dacă o persoana vizată se adresează direct Persoanei împuternicite pentru exercitarea drepturilor sale, aceasta transmite cererea Operatorului fără întârziere nejustificată, în termen de cel mult [[3]] zile lucrătoare, și nu răspunde direct, cu excepția cazului în care Operatorul o autorizează în scris.'),
  P('8.2. Persoana împuternicită pune la dispoziția Operatorului funcționalități și asistență rezonabilă pentru a permite acestuia să raspunda cererilor privind dreptul de acces, rectificare, ștergere, restricționare, portabilitate și opoziție, în termenele prevăzute de GDPR.'),
  P('8.3. Persoana împuternicită acordă asistență rezonabilă Operatorului în realizarea evaluarilor de impact asupra protecției datelor (DPIA) și în consultarea prealabilă a autorității de supraveghere, atunci când acestea sunt necesare.'),

  H1('ART. 9 — ÎNCĂLCAREA SECURITĂȚII DATELOR'),
  P('9.1. Persoana împuternicită notifică Operatorul fără întârziere nejustificată și în orice caz în termen de cel mult [[24]] de ore de la data la care ia cunoștință de o încălcare a securității Datelor Operatorului.'),
  P('9.2. Notificarea cuprinde, în măsura în care informațiile sunt disponibile: descrierea naturii încălcării, categoriile și numărul aproximativ de persoane vizate și de înregistrări afectate, consecințele probabile, măsurile luate sau propuse pentru remediere și atenuarea efectelor, precum și datele de contact ale persoanei de la care se pot obtine informații suplimentare.'),
  P('9.3. Atunci când informațiile nu pot fi furnizate simultan, acestea se transmit etapizat, fără întârziere nejustificată.'),
  P('9.4. Obligația de notificare a autorității de supraveghere și, după caz, a persoanelor vizate revine Operatorului. Persoana împuternicită acordă asistență rezonabilă în acest sens.'),
  P('9.5. Persoana împuternicită documentează orice încălcare a securității datelor și pune documentația la dispoziția Operatorului, la cerere.'),

  H1('ART. 10 — TRANSFERURI INTERNAȚIONALE'),
  P('10.1. Datele Operatorului sunt stocate și prelucrate pe teritoriul Spațiului Economic European, la [[LOCAȚIA CENTRULUI DE DATE]].'),
  P('10.2. Orice transfer către o țară terta se realizează numai în prezența unei decizii de adecvare a Comisiei Europene sau a unor garanții adecvate în sensul art. 46 din GDPR, în special prin încheierea Clauzelor Contractuale Standard adoptate prin Decizia de punere în aplicare (UE) 2021/914 a Comisiei.'),
  P('10.3. Persoana împuternicită informează în prealabil Operatorul cu privire la orice transfer internațional și ii comunica garanțiile aplicabile.'),

  H1('ART. 11 — AUDIT ȘI CONTROL'),
  P('11.1. Persoana împuternicită pune la dispoziția Operatorului, la cerere, informațiile necesare pentru a demonstra respectarea obligațiilor prevăzute la art. 28 din GDPR, inclusiv rapoartele de audit independent disponibile ([[SOC 2 Type II / ISO 27001 — a se păstra doar certificarile detinute efectiv]]).'),
  P('11.2. Operatorul are dreptul de a efectua sau de a mandata un auditor independent să efectueze audituri, cel mult o data pe an calendaristic, cu un preaviz scris de minimum [[30]] de zile, în timpul programului normal de lucru și fără a perturba nejustificat activitatea Persoanei împuternicite.'),
  P('11.3. Audituri suplimentare pot fi efectuate în cazul unei încălcări a securității datelor sau la solicitarea motivată a unei autorități de supraveghere.'),
  P('11.4. Auditorul desemnat nu poate fi un concurent al Persoanei împuternicite și semnează un angajament de confidențialitate. Costurile auditului sunt suportate de Operator, cu excepția cazului în care auditul evidentiaza o neconformitate semnificativa imputabilă Persoanei împuternicite.'),

  H1('ART. 12 — ȘTERGEREA SAU RETURNAREA DATELOR'),
  P('12.1. La încetarea Contractului principal, Operatorul poate solicita, în termen de [[30]] de zile, returnarea Datelor Operatorului într-un format structurat, utilizat în mod curent și care poate fi citit automat.'),
  P('12.2. După expirarea termenului prevăzut la art. 12.1 sau după efectuarea returnării, Persoana împuternicită șterge toate Datele Operatorului, inclusiv copiile existente, în termen de [[90]] de zile, și confirma în scris efectuarea stergerii.'),
  P('12.3. Prin exceptie, Persoana împuternicită poate păstra datele în măsura în care păstrarea este impusă de dreptul Uniunii sau de dreptul național, pentru perioada prevazuta de acesta, aplicând în continuare măsurile de securitate din Anexa 2.'),
  P('12.4. Copiile de siguranță se sterg conform ciclului normal de rotație a acestora, în termen de maximum [[180]] de zile.'),

  H1('ART. 13 — RĂSPUNDERE'),
  P('13.1. Fiecare Parte răspunde pentru prejudiciile cauzate prin nerespectarea obligațiilor care ii revin în temeiul GDPR și al prezentului Acord, în condițiile art. 82 din GDPR.'),
  P('13.2. Limitările de răspundere prevăzute în Contractul principal se aplică și prezentului Acord, în măsura în care legea permite. Nicio prevedere a prezentului Acord nu limitează răspunderea vreunei Părți față de persoanele vizate sau față de autoritatea de supraveghere.'),

  H1('ART. 14 — DISPOZIȚII FINALE'),
  P('14.1. Prezentul Acord intră în vigoare la data semnării de către ambele Părți și ramane valabil pe întreaga durata a Contractului principal.'),
  P('14.2. Orice modificare se realizează prin act adițional scris, semnat de ambele Părți.'),
  P('14.3. Dacă o clauza este declarată nula sau inaplicabila, celelalte clauze rămân în vigoare. Părțile vor înlocui clauza afectată cu una valabila, cu efect economic echivalent.'),
  P('14.4. Prezentul Acord este guvernat de legea română și de dreptul Uniunii Europene. Litigiile se soluționează pe cale amiabilă, iar în lipsa unei înțelegeri, de instanțele competențe de la sediul [[PARTEA — a se stabili cu avocatul]].'),
  P('14.5. Prezentul Acord a fost încheiat astăzi, [[ZZ.LL.AAAA]], în două exemplare originale, câte unul pentru fiecare Parte.'),

  Spacer(220),
  semnaturi('OPERATOR\n[[DENUMIRE CLIENT]]', 'PERSOANA IMPUTERNICITA\n[[EQUIL SRL]]'),

  new (require('docx').Paragraph)({ children: [new (require('docx').PageBreak)()] }),

  H1('ANEXA 1 — DETALIILE PRELUCRĂRII'),
  H2('1. Natura și scopul prelucrării'),
  P('Furnizarea platformei EQUIL de automatizare a operațiunilor, analiza datelor de business și măsurare a satisfacției clienților, în conformitate cu Contractul principal. Prelucrarea include colectarea, stocarea, structurarea, consultarea, utilizarea, transmiterea și ștergerea datelor.'),
  H2('2. Categorii de persoane vizate'),
  P('[[A se păstra numai categoriile aplicabile.]]'),
  Bullet('angajații și colaboratorii Operatorului care utilizează platforma;'),
  Bullet('clienții Operatorului, persoane fizice;'),
  Bullet('reprezentanții și persoanele de contact ale clienților persoane juridice ai Operatorului;'),
  Bullet('furnizorii Operatorului și reprezentanții acestora.'),
  H2('3. Categorii de date cu caracter personal'),
  Spacer(60),
  tabel(
    ['Categorie', 'Exemple de date'],
    [
      ['Date de identificare', 'nume, prenume, funcție, societatea reprezentată'],
      ['Date de contact', 'adresa de e-mail, număr de telefon, adresa poștală'],
      ['Date profesionale', 'departament, rol în platforma, drepturi de acces'],
      ['Date tranzacționale', 'comenzi, facturi, plăți, istoricul relației comerciale'],
      ['Date privind satisfacția', 'răspunsuri la chestionare NPS/CSAT, comentarii în text liber'],
      ['Date tehnice', 'adresa IP, identificator de sesiune, jurnale de acces și de activitate'],
    ],
    [1, 2.2]
  ),
  Spacer(140),
  P('Prelucrarea NU vizează categorii speciale de date în sensul art. 9 din GDPR și nici date privind condamnări penale în sensul art. 10. În cazul în care Operatorul intenționează să introducă astfel de date în platforma, informează în prealabil Persoana împuternicită, iar Părțile convin măsuri suplimentare.', { bold: true }),
  H2('4. Durata prelucrării'),
  P('Pe durata Contractului principal, la care se adaugă termenele de ștergere prevăzute la art. 12 din Acord.'),
  H2('5. Locul prelucrării'),
  P('[[LOCAȚIA CENTRULUI DE DATE — de exemplu: Uniunea Europeană, regiunea Frankfurt]].'),

  new (require('docx').Paragraph)({ children: [new (require('docx').PageBreak)()] }),

  H1('ANEXA 2 — MĂSURI TEHNICE ȘI ORGANIZATORICE'),
  P('Măsurile de mai jos sunt implementate în temeiul art. 32 din GDPR.'),
  Nota('A se păstra numai măsurile implementate efectiv. Declararea unor măsuri inexistente constituie un risc juridic major în caz de control sau incident.'),
  Spacer(60),
  tabel(
    ['Domeniu', 'Măsuri implementate'],
    [
      ['Controlul accesului fizic', 'Centre de date certificate, cu acces controlat biometric, supraveghere video permanentă și personal de pază. Accesul personalului propriu la sediu este controlat prin cartela.'],
      ['Controlul accesului logic', 'Autentificare individuală, obligativitatea autentificării în doi factori (2FA) pentru conturile administrative, politica de parole complexe, blocarea automată a sesiunilor inactive.'],
      ['Controlul drepturilor', 'Drepturi acordate pe roluri, conform principiului minimului necesar. Revizuirea trimestrială a drepturilor. Revocarea accesului în maximum 24 de ore de la încetarea raporturilor de muncă.'],
      ['Criptare', 'Criptarea datelor în tranzit (TLS 1.2 sau superior) și în repaus (AES-256). Gestionarea cheilor separată de datele criptate.'],
      ['Pseudonimizare', 'Utilizarea de identificatori interni în mediile de testare și în jurnalele de aplicație, acolo unde este posibil.'],
      ['Disponibilitate', 'Copii de siguranță zilnice, stocate separat geografic. Testarea restaurării cel puțin [[semestrial]]. Plan documentat de continuitate și de recuperare în caz de dezastru.'],
      ['Integritate', 'Jurnalizarea completă și nealterabilă a operațiunilor asupra datelor, cu păstrare minimum [[12]] luni. Separarea mediilor de dezvoltare, testare și producție.'],
      ['Separarea datelor', 'Separarea logică strictă a datelor aparținând clienților diferiți, prin identificator de organizație aplicat la nivelul fiecărei interogări.'],
      ['Securitatea dezvoltării', 'Analiza automată a codului, revizuire obligatorie de către un al doilea dezvoltator, scanarea dependențelor pentru vulnerabilități cunoscute.'],
      ['Testarea securității', 'Testare de penetrare efectuată de un terț independent, cel puțin [[anual]]. Scanări automate de vulnerabilități [[lunar]].'],
      ['Gestionarea incidentelor', 'Procedura documentată de gestionare a incidentelor de securitate, cu roluri, termene și formular de raportare.'],
      ['Personal', 'Angajamente de confidențialitate semnate de întreg personalul. Instruire în materie de protecție a datelor cel puțin anual.'],
      ['Furnizori', 'Evaluarea prealabilă a subîmputerniciților și contracte de prelucrare încheiate cu fiecare dintre aceștia.'],
    ],
    [1, 2.6]
  ),

  new (require('docx').Paragraph)({ children: [new (require('docx').PageBreak)()] }),

  H1('ANEXA 3 — SUBÎMPUTERNICIȚI APROBAȚI'),
  P('Lista subîmputerniciților autorizați la data semnării prezentului Acord.'),
  Nota('A se completă cu furnizorii utilizați efectiv (găzduire, e-mail tranzacțional, asistență clienți, monitorizare, plăți). Orice furnizor care are acces la datele clienților trebuie să figureze aici.'),
  Spacer(60),
  tabel(
    ['Denumire', 'Serviciu prestat', 'Locul prelucrării', 'Garanții pentru transfer'],
    [
      ['[[Furnizor găzduire]]', 'Infrastructura de găzduire și stocare', '[[UE — Frankfurt]]', 'Nu se aplică (în SEE)'],
      ['[[Furnizor e-mail]]', 'Transmiterea e-mailurilor tranzacționale', '[[UE]]', 'Nu se aplică (în SEE)'],
      ['[[Furnizor asistență]]', 'Sistem de gestionare a solicitărilor de suport', '[[UE / SUA]]', '[[Clauze Contractuale Standard, dacă este în afara SEE]]'],
      ['[[Furnizor monitorizare]]', 'Monitorizarea disponibilității și a erorilor', '[[UE]]', 'Nu se aplică (în SEE)'],
    ],
    [1.1, 1.5, 1, 1.4]
  ),
];

(async () => { await scrie('01-Acord-prelucrare-date-DPA.docx', construieste(c, { titlu: T })); })();
