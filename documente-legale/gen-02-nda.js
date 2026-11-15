const { Title, Sub, H1, P, Bullet, Nota, Spacer, semnaturi, construieste, scrie, AVERTISMENT } = require('./lib');
const T = 'Acord de confidențialitate (NDA)';

const c = [
  Title('ACORD DE CONFIDENȚIALITATE'),
  Sub('cu caracter reciproc (mutual NDA)'),
  Nota(AVERTISMENT),

  H1('PĂRȚILE'),
  P('[[EQUIL — DENUMIRE COMPLETĂ SRL]], cu sediul în [[ADRESA COMPLETĂ]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], reprezentată prin [[NUME]], [[FUNCȚIA]],'),
  P('și'),
  P('[[DENUMIRE PARTENER SRL/SA]], cu sediul în [[ADRESA COMPLETĂ]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], reprezentată prin [[NUME]], [[FUNCȚIA]],'),
  P('denumite individual "Partea" și împreună "Părțile", au convenit încheierea prezentului acord de confidențialitate (denumit în continuare "Acordul").'),

  H1('ART. 1 — SCOPUL'),
  P('1.1. Părțile intenționează să poarte discutii și să schimbe informații în vederea [[evaluării unei potentiale colaborări comerciale privind implementarea platformei EQUIL — a se adapta]] (denumit în continuare "Scopul").'),
  P('1.2. În cadrul acestor discutii, fiecare Parte poate dezvălui celeilalte informații cu caracter confidential. Prezentul Acord stabilește regimul juridic al acestor informații.'),

  H1('ART. 2 — INFORMAȚII CONFIDENTIALE'),
  P('2.1. Prin "Informații Confidentiale" se înțelege orice informație, indiferent de forma sau de suportul pe care este transmisa (scris, verbal, electronic, vizual), dezvaluita de o Parte ("Partea Emitentă") celeilalte Părți ("Partea Primitoare") în legătură cu Scopul, inclusiv, fără a se limita la:'),
  Bullet('informații tehnice: arhitectura sistemelor, cod-sursă, algoritmi, documentație tehnică, specificații, rezultate ale testelor;'),
  Bullet('informații comerciale: preturi, oferte, marje, strategii de vanzare, liste de clienți și de furnizori, conditii contractuale;'),
  Bullet('informații financiare: bugete, prognoze, situații financiare nepublicate, indicatori de performanta;'),
  Bullet('informații operaționale: procese interne, proceduri, planuri de dezvoltare, organizare internă;'),
  Bullet('informații privind securitatea: configurații, măsuri de protecție, rezultate ale testelor de penetrare, vulnerabilități identificate;'),
  Bullet('datele cu caracter personal la care Partea Primitoare are acces, cărora li se aplică suplimentar regimul prevăzut la art. 9.'),
  P('2.2. Informațiile sunt protejate indiferent dacă au fost sau nu marcate expres ca fiind confidentiale, dacă o persoana rezonabilă, având în vedere natura informației și împrejurările dezvaluirii, ar înțelege ca acestea au caracter confidential.'),

  H1('ART. 3 — EXCEPTII'),
  P('3.1. Nu constituie Informații Confidentiale informațiile pentru care Partea Primitoare poate dovedi ca:'),
  Bullet('erau publice la momentul dezvaluirii sau au devenit ulterior publice, fără încălcarea prezentului Acord;'),
  Bullet('se aflau în mod legitim în posesia să anterior dezvaluirii, fără o obligație de confidențialitate;'),
  Bullet('au fost primite în mod legitim de la un terț care nu era tinut de o obligație de confidențialitate;'),
  Bullet('au fost dezvoltate în mod independent de către Partea Primitoare, fără utilizarea Informațiilor Confidentiale.'),

  H1('ART. 4 — OBLIGAȚIILE PARTII PRIMITOARE'),
  P('4.1. Partea Primitoare se obligă:'),
  Bullet('să păstreze confidențialitatea Informațiilor Confidentiale și să le protejeze cu cel puțin aceeași diligenta cu care isi protejează propriile informații confidentiale, dar în niciun caz cu mai puțin decat o diligenta rezonabilă;'),
  Bullet('să utilizeze Informațiile Confidentiale exclusiv în vederea realizării Scopului;'),
  Bullet('să nu dezvăluie Informațiile Confidentiale niciunui terț fără acordul scris prealabil al Partii Emitente;'),
  Bullet('să limiteze accesul la Informațiile Confidentiale la angajații, administratorii și consultanții care au nevoie de acestea pentru realizarea Scopului și care sunt ținuți de obligații de confidențialitate cel puțin echivalente;'),
  Bullet('să nu copieze, reproduca sau realizeze lucrari derivate, cu excepția celor necesare Scopului;'),
  Bullet('să informeze de îndată Partea Emitentă în cazul în care ia cunoștință de o dezvaluire sau utilizare neautorizată.'),
  P('4.2. Partea Primitoare răspunde pentru orice încălcare savarsita de persoanele cărora le-a dezvaluit Informațiile Confidentiale, ca și cum încălcarea ar fi fost savarsita de ea însăși.'),

  H1('ART. 5 — DEZVĂLUIREA IMPUSĂ DE LEGE'),
  P('5.1. Dacă Partea Primitoare este obligată să dezvăluie Informații Confidentiale în temeiul legii, al unei hotarari judecătorești sau al unei solicitări a unei autorități competențe, aceasta vă notifică Partea Emitentă în prealabil, în măsura în care legea permite, pentru a-i da posibilitatea de a solicita măsuri de protecție.'),
  P('5.2. În orice caz, dezvăluirea se limitează strict la informațiile solicitate în mod expres.'),

  H1('ART. 6 — DURATA'),
  P('6.1. Prezentul Acord intră în vigoare la data semnării și produce efecte pe o perioadă de [[3]] ani.'),
  P('6.2. Obligațiile de confidențialitate se mentin pentru o perioadă de [[5]] ani de la data ultimei dezvaluiri efectuate în temeiul prezentului Acord.'),
  P('6.3. Pentru informațiile care constituie secret comercial în sensul Legii nr. 11/1991 privind combaterea concurentei neloiale, obligația de confidențialitate subzistă pe întreaga durata cât acestea isi păstrează caracterul de secret comercial.'),

  H1('ART. 7 — RESTITUIREA INFORMAȚIILOR'),
  P('7.1. La încetarea prezentului Acord sau la simplă cerere scrisă a Partii Emitente, Partea Primitoare restituie sau distruge, la alegerea Partii Emitente, toate Informațiile Confidentiale, inclusiv copiile și materialele derivate, în termen de [[15]] zile, și confirma în scris executarea acestei obligații.'),
  P('7.2. Partea Primitoare poate păstra o copie în măsura în care păstrarea este impusă de o obligație legală sau rezultă din procedurile automate de arhivare, caz în care obligația de confidențialitate continua să se aplice acestor copii.'),

  H1('ART. 8 — PROPRIETATE INTELECTUALĂ'),
  P('8.1. Prezentul Acord nu transfera niciun drept de proprietate intelectuală. Informațiile Confidentiale rămân proprietatea exclusivă a Partii Emitente.'),
  P('8.2. Nicio prevedere a prezentului Acord nu poate fi interpretată ca acordarea unei licente, exprese sau implicite, asupra vreunui brevet, marca, drept de autor sau know-how.'),

  H1('ART. 9 — PROTECȚIA DATELOR CU CARACTER PERSONAL'),
  P('9.1. În măsura în care Informațiile Confidentiale includ date cu caracter personal, Părțile se obligă să respecte Regulamentul (UE) 2016/679 (GDPR) și legislația națională aplicabila.'),
  P('9.2. Părțile convin ca prezentul Acord nu constituie temei pentru prelucrarea de date cu caracter personal în numele celeilalte Părți. Dacă o astfel de prelucrare devine necesară, Părțile vor încheia un acord distinct de prelucrare a datelor, în condițiile art. 28 din GDPR.'),

  H1('ART. 10 — ABSENTA OBLIGAȚIEI DE A CONTRACTA'),
  P('10.1. Prezentul Acord nu obligă niciuna dintre Părți să încheie un contract, să continue negocierile sau să dezvăluie vreo informație anume.'),
  P('10.2. Fiecare Parte suporta propriile costuri legate de discuțiile purtate în vederea realizării Scopului.'),

  H1('ART. 11 — RĂSPUNDERE'),
  P('11.1. Încălcarea obligațiilor de confidențialitate atrage răspunderea Partii în culpă pentru prejudiciul efectiv cauzat, precum și pentru beneficiul nerealizat, în condițiile dreptului comun.'),
  P('11.2. Părțile convin ca Partea Emitentă poate solicita instanței dispunerea de măsuri provizorii, inclusiv ordonanta președințială, pentru încetarea de îndată a unei încălcări, fără a fi necesară dovedirea unui prejudiciu.'),
  P('11.3. [[Opțional — a se discuta cu avocatul: În caz de încălcare, Partea în culpă datorează celeilalte Părți daune-interese în cuantum de ______ EUR, fără a fi exclusa posibilitatea solicitării de despagubiri suplimentare pentru prejudiciul care depaseste acest cuantum.]]'),

  H1('ART. 12 — DISPOZIȚII FINALE'),
  P('12.1. Prezentul Acord constituie înțelegerea integrală a Părților cu privire la obiectul sau și înlocuiește orice înțelegere anterioara, scrisă sau verbala.'),
  P('12.2. Orice modificare se face prin act adițional scris, semnat de ambele Părți.'),
  P('12.3. Nulitatea unei clauze nu afectează validitatea celorlalte.'),
  P('12.4. Prezentul Acord este guvernat de legea română. Litigiile decurgând din acesta se soluționează pe cale amiabilă, iar în caz contrar de către instanțele competențe de la sediul [[PARTEA — a se stabili cu avocatul]].'),
  P('12.5. Încheiat astăzi, [[ZZ.LL.AAAA]], în două exemplare originale, câte unul pentru fiecare Parte.'),

  Spacer(240),
  semnaturi('[[EQUIL SRL]]', '[[DENUMIRE PARTENER]]'),
];

(async () => { await scrie('02-Acord-de-confidentialitate-NDA.docx', construieste(c, { titlu: T })); })();
