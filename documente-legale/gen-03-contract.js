const { Title, Sub, H1, H2, P, Bullet, Nota, Spacer, tabel, semnaturi, construieste, scrie, AVERTISMENT } = require('./lib');
const { Paragraph, PageBreak } = require('docx');
const T = 'Contract-cadru de furnizare servicii';
const Break = () => new Paragraph({ children: [new PageBreak()] });

const c = [
  Title('CONTRACT-CADRU DE FURNIZARE A SERVICIILOR EQUIL'),
  Sub('nr. [[NUMĂR]] din [[ZZ.LL.AAAA]]'),
  Nota(AVERTISMENT),

  H1('PĂRȚILE'),
  P('[[EQUIL — DENUMIRE COMPLETĂ SRL]], cu sediul în [[ADRESA]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], cont bancar [[IBAN]] deschis la [[BANCĂ]], reprezentată prin [[NUME]], [[FUNCȚIA]], denumită în continuare "Furnizorul",'),
  P('și'),
  P('[[DENUMIRE CLIENT SRL/SA]], cu sediul în [[ADRESA]], înregistrată la Registrul Comerțului sub nr. [[J__/____/____]], CUI [[RO________]], cont bancar [[IBAN]] deschis la [[BANCĂ]], reprezentată prin [[NUME]], [[FUNCȚIA]], denumită în continuare "Clientul",'),
  P('denumite împreună "Părțile", au convenit încheierea prezentului contract.'),

  H1('ART. 1 — DEFINIȚII'),
  P('"Platforma" — solutia informatică EQUIL, pusa la dispozitie în regim de serviciu (SaaS), accesibilă prin internet.'),
  P('"Servicii" — accesul la Platforma, modulele contractate, implementarea, mentenanta și asistență tehnică, astfel cum sunt descrise în Anexa 1.'),
  P('"Datele Clientului" — toate datele introduse în Platforma de Client sau de utilizatorii acestuia, ori colectate prin Platforma în numele Clientului.'),
  P('"Utilizator" — persoana fizica autorizată de Client să acceseze Platforma.'),
  P('"Disponibilitate" — procentul de timp, calculat lunar, în care Platforma este accesibilă, conform art. 7.'),

  H1('ART. 2 — OBIECTUL CONTRACTULUI'),
  P('2.1. Furnizorul acordă Clientului dreptul neexclusiv, netransferabil și limitat de a utiliza Platforma, iar Clientul se obligă să plateasca pretul convenit.'),
  P('2.2. Modulele contractate, numărul de sisteme conectate și condițiile comerciale sunt prevăzute în Anexa 1.'),
  P('2.3. Contractul nu are ca obiect transferul dreptului de proprietate asupra Platformei sau asupra vreunei componente a acesteia.'),

  H1('ART. 3 — DURATA'),
  P('3.1. Contractul se încheie pe o perioadă de [[12]] luni, începând cu data de [[ZZ.LL.AAAA]].'),
  P('3.2. La expirare, Contractul se prelungeste automat pe perioade succesive egale, dacă niciuna dintre Părți nu notifică intenția de încetare cu cel puțin [[30]] de zile înainte de expirarea perioadei în curs.'),
  P('3.3. Perioada de implementare este de [[__]] zile lucrătoare de la semnare, conform calendarului din Anexa 1.'),

  H1('ART. 4 — PRETUL ȘI MODALITATEA DE PLATA'),
  P('4.1. Pretul serviciilor este de [[SUMA]] EUR/luna, la care se adaugă TVA, conform Anexei 1.'),
  P('4.2. Facturarea se face [[lunar/trimestrial/anual]], în avans, în primele [[5]] zile lucrătoare ale perioadei facturate.'),
  P('4.3. Termenul de plata este de [[15]] zile calendaristice de la data emiterii facturii.'),
  P('4.4. Pentru întârzierea la plata, Clientul datorează penalități de [[0,05]]% pe zi de întârziere, calculate la suma restanta. Penalitățile pot depasi cuantumul sumei asupra careia sunt calculate.'),
  P('4.5. În cazul unei întârzieri mai mari de [[30]] de zile, Furnizorul poate suspenda accesul la Platforma, după o notificare prealabilă de [[7]] zile. Suspendarea nu exonerează Clientul de obligația de plata.'),
  P('4.6. Furnizorul poate ajusta pretul o data pe an, cu o notificare prealabilă de [[60]] de zile. Dacă majorarea depaseste [[__]]%, Clientul poate denunța Contractul fără penalități, în termen de 30 de zile de la notificare.'),

  H1('ART. 5 — OBLIGAȚIILE FURNIZORULUI'),
  P('Furnizorul se obligă:'),
  Bullet('să puna la dispozitie Platforma în condițiile de disponibilitate prevăzute la art. 7;'),
  Bullet('să realizeze implementarea și configurarea inițială conform Anexei 1;'),
  Bullet('să asigure asistență tehnică în condițiile art. 7;'),
  Bullet('să aplice măsurile tehnice și organizatorice de securitate prevăzute în acordul de prelucrare a datelor;'),
  Bullet('să efectueze copii de siguranță ale Datelor Clientului cu o frecventa de cel puțin [[24]] de ore;'),
  Bullet('să notifice Clientul cu cel puțin [[5]] zile înainte de lucrarile de mentenanta planificată;'),
  Bullet('să păstreze confidențialitatea informațiilor Clientului, conform art. 10.'),

  H1('ART. 6 — OBLIGAȚIILE CLIENTULUI'),
  P('Clientul se obligă:'),
  Bullet('să plateasca pretul la termenele convenite;'),
  Bullet('să utilizeze Platforma conform destinației și prevederilor legale;'),
  Bullet('să asigure confidențialitatea datelor de autentificare ale Utilizatorilor și să notifice de îndată orice compromitere a acestora;'),
  Bullet('să desemneze o persoana de contact responsabila de relația cu Furnizorul;'),
  Bullet('să furnizeze la timp informațiile și accesele necesare implementării;'),
  Bullet('să se asigure ca dispune de un temei legal valabil pentru datele cu caracter personal introduse în Platforma;'),
  Bullet('să nu încerce decompilarea, dezasamblarea sau reproducerea Platformei și să nu o puna la dispoziția unor terți.'),

  H1('ART. 7 — NIVELUL SERVICIILOR (SLA)'),
  H2('7.1. Disponibilitate'),
  P('Furnizorul garantează o disponibilitate lunară a Platformei de minimum [[99,9]]%, calculată ca raport între timpul de funcționare și timpul total al lunii, din care se exclud perioadele de mentenanta planificată și anunțată, precum și întreruperile imputabile Clientului sau unor cauze de forță majoră.'),
  H2('7.2. Asistență tehnică'),
  Spacer(50),
  tabel(
    ['Nivel de urgenta', 'Descriere', 'Timp de răspuns', 'Timp de remediere'],
    [
      ['Critic', 'Platforma indisponibilă sau pierdere de date', '[[1]] ora', '[[4]] ore'],
      ['Major', 'Funcționalitate esențială nedisponibilă, fără soluție alternativa', '[[4]] ore', '[[1]] zi lucrătoare'],
      ['Mediu', 'Funcționalitate afectată, există soluție alternativa', '[[1]] zi lucrătoare', '[[5]] zile lucrătoare'],
      ['Minor', 'Întrebări, solicitări de configurare', '[[2]] zile lucrătoare', 'de comun acord'],
    ],
    [0.9, 2, 1, 1.1]
  ),
  Spacer(130),
  P('Programul de asistență este [[luni-vineri, 09:00-18:00, ora României]], prin [[e-mail și telefon]].'),
  H2('7.3. Compensații pentru nerespectarea disponibilității'),
  Spacer(50),
  tabel(
    ['Disponibilitate lunară realizată', 'Credit acordat din abonamentul lunar'],
    [
      ['între 99,0% și 99,9%', '[[10]]%'],
      ['între 98,0% și 99,0%', '[[25]]%'],
      ['sub 98,0%', '[[50]]%'],
    ],
    [1.6, 1]
  ),
  Spacer(130),
  P('Creditele se acordă la cererea scrisă a Clientului, formulată în termen de [[30]] de zile de la sfârșitul lunii afectate, și se deduc din facturile ulterioare. Creditele reprezintă unicul remediu pentru nerespectarea nivelului de disponibilitate.'),

  Break(),

  H1('ART. 8 — PROPRIETATE INTELECTUALĂ'),
  P('8.1. Platforma, codul-sursă, documentația, mărcile și orice element component rămân proprietatea exclusivă a Furnizorului, fiind protejate de Legea nr. 8/1996 privind dreptul de autor și drepturile conexe.'),
  P('8.2. Clientul dobândește exclusiv un drept de utilizare, pe durata Contractului și în limitele acestuia.'),
  P('8.3. Datele Clientului rămân proprietatea exclusivă a Clientului. Furnizorul nu dobândește niciun drept asupra acestora, cu excepția dreptului limitat de a le prelucra în scopul furnizării Serviciilor.'),
  P('8.4. Furnizorul poate utiliza date agregate și anonimizate, care nu permit identificarea Clientului sau a persoanelor vizate, în scopul îmbunătățirii Platformei și al elaborării de statistici.'),
  P('8.5. Utilizarea denumirii și a siglei Clientului în materiale de promovare se face numai cu acordul scris prealabil al acestuia.'),

  H1('ART. 9 — PROTECȚIA DATELOR CU CARACTER PERSONAL'),
  P('9.1. În raport cu Datele Clientului, Clientul are calitatea de operator, iar Furnizorul pe cea de persoana împuternicită de operator, în sensul GDPR.'),
  P('9.2. Condițiile prelucrării sunt stabilite prin Acordul de prelucrare a datelor, încheiat separat și care face parte integrantă din prezentul Contract.'),
  P('9.3. În raport cu datele de contact ale reprezentanților Clientului, prelucrate în scopul administrării relației contractuale, Furnizorul are calitatea de operator independent.'),

  H1('ART. 10 — CONFIDENȚIALITATE'),
  P('10.1. Fiecare Parte se obligă să păstreze confidențialitatea informațiilor primite de la cealaltă Parte în executarea Contractului și să nu le dezvăluie terților fără acord scris.'),
  P('10.2. Obligația subzistă pe durata Contractului și [[3]] ani după încetarea acestuia.'),
  P('10.3. Nu constituie încălcare dezvăluirea impusă de lege sau de o autoritate competentă, cu informarea prealabilă a celeilalte Părți, în măsura în care legea permite.'),

  H1('ART. 11 — RĂSPUNDERE ȘI LIMITAREA RĂSPUNDERII'),
  P('11.1. Fiecare Parte răspunde pentru prejudiciile cauzate celeilalte prin neexecutarea culpabilă a obligațiilor contractuale.'),
  P('11.2. Răspunderea totală a Furnizorului, cumulată pentru toate evenimentele produse într-un an contractual, este limitată la valoarea sumelor efectiv încasate de la Client în ultimele [[12]] luni anterioare evenimentului.'),
  P('11.3. Furnizorul nu răspunde pentru beneficiul nerealizat, pierderea de clientelă, prejudicii de imagine sau alte prejudicii indirecte.'),
  P('11.4. Limitările de la art. 11.2 și 11.3 nu se aplică în caz de dol, culpă gravă, vătămare a integrității fizice, încălcare a obligațiilor de confidențialitate sau a obligațiilor privind protecția datelor cu caracter personal.'),
  P('11.5. Furnizorul nu răspunde pentru indisponibilități cauzate de: infrastructura de comunicații a Clientului, servicii ale unor terți asupra cărora nu are control, utilizarea Platformei contrar instrucțiunilor, sau fapta Clientului ori a Utilizatorilor sai.'),

  H1('ART. 12 — FORȚĂ MAJORĂ'),
  P('12.1. Forță majoră, în sensul art. 1351 din Codul civil, exonerează de răspundere Partea care o invocă.'),
  P('12.2. Partea afectată notifică cealaltă Parte în termen de [[5]] zile de la apariția evenimentului și face dovada acestuia în [[15]] zile.'),
  P('12.3. Dacă forță majoră durează mai mult de [[60]] de zile, oricare dintre Părți poate denunța Contractul, fără daune-interese.'),

  H1('ART. 13 — ÎNCETAREA CONTRACTULUI'),
  P('13.1. Contractul încetează prin: acordul Părților; expirarea duratei; denunțare unilaterală în condițiile art. 3.2; reziliere; forță majoră prelungită.'),
  P('13.2. Oricare dintre Părți poate rezilia Contractul, de plin drept și fără intervenția instanței (pact comisoriu), prîntr-o notificare scrisă, dacă cealaltă Parte nu remediază o încălcare esențială în termen de [[15]] zile de la punerea în întârziere.'),
  P('13.3. Furnizorul poate rezilia Contractul de îndată în caz de: utilizare a Platformei în scopuri ilicite; neplata menținută peste [[60]] de zile; deschiderea procedurii de insolvență față de Client.'),
  P('13.4. Încetarea Contractului nu afectează obligațiile de plata scadente anterior.'),

  H1('ART. 14 — REVERSIBILITATE'),
  P('14.1. În termen de [[30]] de zile de la încetarea Contractului, Clientul poate solicita exportul integral al Datelor Clientului într-un format structurat, utilizat în mod curent și care poate fi citit automat ([[CSV, JSON]]).'),
  P('14.2. Exportul se realizează fără costuri suplimentare.'),
  P('14.3. După expirarea acestui termen, Furnizorul șterge Datele Clientului conform Acordului de prelucrare a datelor.'),
  P('14.4. La cererea Clientului, Furnizorul acordă asistență pentru migrarea către un alt furnizor, contra unui tarif de [[__]] EUR/ora.'),

  H1('ART. 15 — DISPOZIȚII FINALE'),
  P('15.1. Anexele fac parte integrantă din prezentul Contract.'),
  P('15.2. Orice modificare se face prin act adițional scris.'),
  P('15.3. Comunicările între Părți se fac în scris, la adresele de e-mail: pentru Furnizor [[EMAIL]], pentru Client [[EMAIL]].'),
  P('15.4. Cesiunea Contractului către un terț se poate face numai cu acordul scris al celeilalte Părți, cu excepția cesiunii către o societate din același grup, caz în care este suficientă notificarea.'),
  P('15.5. Contractul este guvernat de legea română. Litigiile se soluționează pe cale amiabilă, iar în caz contrar de instanțele competențe de la sediul [[PARTEA — a se stabili cu avocatul]].'),
  P('15.6. Încheiat astăzi, [[ZZ.LL.AAAA]], în două exemplare originale.'),

  Spacer(220),
  semnaturi('FURNIZOR\n[[EQUIL SRL]]', 'CLIENT\n[[DENUMIRE CLIENT]]'),

  Break(),

  H1('ANEXA 1 — SERVICII CONTRACTATE ȘI PRETURI'),
  Spacer(60),
  tabel(
    ['Element', 'Detalii'],
    [
      ['Pachet contractat', '[[Fundație / Echilibru / Enterprise]]'],
      ['Module incluse', '[[a se enumera modulele contractate]]'],
      ['Număr de sisteme conectate', '[[__]]'],
      ['Număr de utilizatori', 'Nelimitat'],
      ['Abonament lunar', '[[____]] EUR + TVA'],
      ['Taxă de implementare', '[[Inclusă / ____ EUR + TVA]]'],
      ['Durata implementării', '[[__]] zile lucrătoare'],
      ['Persoana de contact — Furnizor', '[[NUME, e-mail, telefon]]'],
      ['Persoana de contact — Client', '[[NUME, e-mail, telefon]]'],
    ],
    [1, 1.6]
  ),
  Spacer(160),
  H2('Calendarul implementării'),
  Spacer(50),
  tabel(
    ['Etapa', 'Conținut', 'Termen'],
    [
      ['1. Analiza', 'Sesiune de lucru, inventarul sistemelor, maparea datelor', '[[__]] zile'],
      ['2. Conectare', 'Configurarea conectorilor, sincronizare inițială, validare', '[[__]] zile'],
      ['3. Configurare', 'Fluxuri de lucru, indicatori, tablouri de bord', '[[__]] zile'],
      ['4. Instruire', 'Sesiune de instruire a utilizatorilor, documentație', '[[__]] zile'],
      ['5. Recepție', 'Testare, proces-verbal de recepție, intrarea în producție', '[[__]] zile'],
    ],
    [0.8, 2.2, 0.8]
  ),
];

(async () => { await scrie('03-Contract-cadru-servicii.docx', construieste(c, { titlu: T })); })();
