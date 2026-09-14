# -*- coding: utf-8 -*-
"""Adauga diacriticele in textul romanesc din generatoarele de documente.
Se aplica numai in interiorul literalilor sir din fisierele gen-*.js."""
import re, glob, sys

# Reguli de fraza, aplicate INAINTE de cele pe cuvant (dezambiguizare).
FRAZE = [
    # "ca" = "că" doar aici; in rest ramane "ca" (comparativ)
    ('Daca apreciati ca v-am', 'Dacă apreciați că v-am'),
    ('certitudine ca s-a produs', 'certitudine că s-a produs'),
    # "aceasta" adjectival -> "această"
    ('aceasta politica', 'această politică'),
    ('aceasta politica', 'această politică'),
    # denumiri de module: forma nearticulata
    ('Analiza si prognoza', 'Analiză și prognoză'),
    ('analiza si prognoza', 'analiză și prognoză'),
    ('Analiza proceselor', 'Analiza proceselor'),
    ('Analiza post-incident', 'Analiza post-incident'),
    ('o analiza', 'o analiză'),
    ('in prezenta unei', 'în prezența unei'),
    ('se aplica', 'se aplică'), ('Se aplica', 'Se aplică'),
    ('de baza', 'de bază'), ('anumita perioada', 'anumită perioadă'),
    ('o perioada', 'o perioadă'), ('aceeasi lista', 'aceeași listă'),
    ('Lista completa', 'Lista completă'), ('lista completa', 'lista completă'),
    ('Aceasta politica', 'Această politică'),
    ('functionarea corecta', 'funcționarea corectă'),
    ('analiza datelor', 'analiza datelor'),
    ('intr-un', 'într-un'), ('intr-o', 'într-o'), ('Intr-un', 'Într-un'),
    ('Partea Emitenta', 'Partea Emitentă'),
    ('partea Emitenta', 'partea Emitentă'),
]

# Cuvinte fara ambiguitate.
W = """
absoluta:absolută accesand:accesând accesarii:accesării accesibila:accesibilă
accidentala:accidentală aceeasi:aceeași acelasi:același acestia:aceștia acorda:acordă
actioneaza:acționează actiunile:acțiunile activitatile:activitățile activitatilor:activităților
actualizari:actualizări actualizarilor:actualizărilor actualizata:actualizată actualizeaza:actualizează
adauga:adaugă adaugati:adăugați aditional:adițional afectata:afectată afecteaza:afectează
aferenta:aferentă afisam:afișăm afisarea:afișarea afisat:afișat aflati:aflați ajuta:ajută
alarma:alarmă aloca:alocă amiabila:amiabilă anonimizate:anonimizate apararea:apărarea
apare:apare aparitia:apariția apartinand:aparținând aplicam:aplicăm aplicare:aplicare
aplicatie:aplicație apreciati:apreciați aproba:aprobă aprobati:aprobați aproximativ:aproximativ
arata:arată asemenea:asemenea asigura:asigură asigurarea:asigurarea asigurari:asigurări
asistenta:asistență astazi:astăzi atacul:atacul atentie:atenție atenuarea:atenuarea
autentificare:autentificare autoritatile:autoritățile autorizati:autorizați avand:având
avem:avem aveti:aveți avocatul:avocatul banca:bancă bancare:bancare
bazate:bazate beneficiul:beneficiul biometrice:biometrice blocarea:blocarea
browserului:browserului bucuresti:București cadru:cadru cale:cale calendarul:calendarul
calitate:calitate calitatea:calitatea camp:câmp campaniilor:campaniilor cand:când
candidati:candidați candidatilor:candidaților candidatului:candidatului candidaturi:candidaturi
candidaturii:candidaturii candidaturilor:candidaturilor caracteristicile:caracteristicile
caracterului:caracterului carora:cărora cat:cât cate:câte categoria:categoria
categorii:categorii categoriile:categoriile catre:către cauzate:cauzate cauzei:cauzei
caz:caz cazul:cazul cazurile:cazurile cea:cea cealalta:cealaltă cel:cel cele:cele
celeilalte:celeilalte celelalte:celelalte centre:centre certitudine:certitudine
cerere:cerere cererea:cererea cererii:cererii cererile:cererile cererilor:cererilor
cereti:cereți cesiunea:cesiunea cesiunii:cesiunii cheilor:cheilor chestiune:chestiune
citit:citit civil:civil clar:clar clauze:clauze clauzelor:clauzelor clientela:clientelă
clienti:clienți clientii:clienții clientilor:clienților clientul:clientul clientului:clientului
codului:codului colaborari:colaborări colaboratori:colaboratori colaboratorilor:colaboratorilor
colectam:colectăm colectare:colectare colectate:colectate colecteaza:colectează
comerciale:comerciale comertului:comerțului comisiei:comisiei comisoriu:comisoriu
compensatii:compensații competenta:competentă competente:competente complet:complet
completa:completa completarea:completarea completari:completări completat:completat
complete:complete completeaza:completează complexe:complexe compromise:compromise
comunica:comunica comunicare:comunicare comunicarea:comunicarea comunicari:comunicări
comunicarile:comunicările comunicarilor:comunicărilor comunicatii:comunicații
comunicatiilor:comunicațiilor concrete:concrete condamnari:condamnări conditiile:condițiile
conducerea:conducerea conectare:conectare conectate:conectate conectorilor:conectorilor
conexe:conexe confidentialitate:confidențialitate confidentialitatea:confidențialitatea
configura:configura configurare:configurare configurarea:configurarea confirmare:confirmare
confirmarii:confirmării conform:conform consecinte:consecințe consecintele:consecințele
consecintelor:consecințelor consemneaza:consemnează considerat:considerat
consimtamant:consimțământ consimtamantul:consimțământul consimtamantului:consimțământului
constata:constată constatare:constatare constatarea:constatarea constatarii:constatării
constituie:constituie consultantii:consultanții consultare:consultare cont:cont
contabile:contabile contabili:contabili contabilitate:contabilitate contabilitatii:contabilității
contactati:contactați continuare:continuare continuitate:continuitate continut:conținut
continutul:conținutul contra:contra contractat:contractat contractate:contractate
contracte:contracte contractelor:contractelor contractual:contractual contractuala:contractuală
contractuale:contractuale contractul:contractul contractului:contractului contrar:contrar
control:control controlat:controlat controlul:controlul conturile:conturile conturilor:conturilor
convin:convin convingerile:convingerile copie:copie copii:copii copiile:copiile
corecta:corecta corectarea:corectarea corespunzator:corespunzător costuri:costuri
crearea:crearea credit:credit creditele:creditele criptare:criptare criptarea:criptarea
criptate:criptate criterii:criterii critic:critic culpa:culpă culpabila:culpabilă
cum:cum cumulata:cumulată cunoscute:cunoscute cunostinta:cunoștință cuprinde:cuprinde
curent:curent curge:curge curs:curs daca:dacă dam:dăm data:data datele:datele
datelor:datelor dati:dați daune:daune decide:decide decizia:decizia decizii:decizii
declararea:declararea decurg:decurg dedicat:dedicat deduc:deduc definitii:definiții
demersuri:demersuri denumire:denumire denumirea:denumirea denumirii:denumirii
denumita:denumită denunta:denunța denuntare:denunțare departament:departament
depasite:depășite dependentelor:dependențelor depune:depune deschiderea:deschiderea
deschiderilor:deschiderilor deschis:deschis descriere:descriere descrierea:descrierea
descrise:descrise desemnarea:desemnarea desemnat:desemnat desfasurare:desfășurare
desfasurarea:desfășurarea desfasurate:desfășurate despre:despre destinatar:destinatar
destinatari:destinatari detalii:detalii detaliile:detaliile detectare:detectare
devine:devine dezabonare:dezabonare dezastru:dezastru dezvalui:dezvălui dezvaluie:dezvăluie
dezvaluirea:dezvăluirea dezvoltare:dezvoltare dezvoltarii:dezvoltării dezvoltator:dezvoltator
diferiti:diferiți dimensiuni:dimensiuni dintre:dintre direct:direct discriminare:discriminare
disponibil:disponibil disponibila:disponibilă disponibilitate:disponibilitate
disponibilitatii:disponibilității dispozitia:dispoziția dispozitii:dispoziții
dispozitiv:dispozitiv dispozitivul:dispozitivul disproportionat:disproporționat
dispune:dispune distinge:distinge distrugerea:distrugerea distrugerii:distrugerii
divulgarea:divulgarea dobandeste:dobândește dobanditor:dobânditor document:document
documentare:documentare documentat:documentat documentata:documentată documentatia:documentația
documentatie:documentație documente:documente documenteaza:documentează documentele:documentele
documentului:documentului doi:doi doilea:doilea dol:dol domeniu:domeniu dosarul:dosarul
doua:două dovada:dovada drept:drept dreptul:dreptul dreptului:dreptului drepturi:drepturi
drepturile:drepturile drepturilor:drepturilor dubla:dublă duce:duce dulapuri:dulapuri
dumneavoastra:dumneavoastră dupa:după durata:durata duratei:duratei dureaza:durează
echilibru:echilibru echipa:echipa echivalent:echivalent economic:economic efect:efect
efecte:efecte efectiv:efectiv efectuata:efectuată efectuate:efectuate eficacitatii:eficacității
eficientei:eficienței efort:efort elaborarii:elaborării ele:ele electronic:electronic
electronice:electronice element:element elementele:elementele eliminarea:eliminarea
enumera:enumera erau:erau eroare:eroare erorilor:erorilor esentiala:esențială
etapa:etapa etapele:etapele etapizate:etapizate eur:EUR european:european europeana:europeană
europene:europene evaluarea:evaluarea evalueaza:evaluează evenimentele:evenimentele
evenimentului:evenimentului eventual:eventual eventuale:eventuale eventualelor:eventualelor
evidenta:evidența exact:exact exacta:exactă exceptia:excepția excesive:excesive
exclusiv:exclusiv exclusiva:exclusivă executarea:executarea exemplare:exemplare
exemple:exemple exemplu:exemplu exercitare:exercitare exercitarea:exercitarea
exercitati:exercitați exfiltrarea:exfiltrarea exista:există exonereaza:exonerează
experienta:experiență expirarea:expirarea explicit:explicit export:export exportul:exportul
expres:expres exprimarea:exprimarea exprimat:exprimat exprimate:exprimate expuse:expuse
externe:externe fac:fac face:face factori:factori facturare:facturare facturi:facturi
facturile:facturile falsa:falsă familie:familie fapta:fapta fara:fără fata:față
fel:fel fie:fie fiecare:fiecare fiecarei:fiecărei figureze:figureze fiind:fiind
filtrare:filtrare finale:finale finalizarea:finalizarea financiar:financiar
financiare:financiare firefox:Firefox fiscal:fiscal fiscala:fiscală fiscale:fiscale
fisiere:fișiere fizic:fizic fizice:fizice fluxuri:fluxuri foloseste:folosește
folosind:folosind folosit:folosit folosite:folosite folositi:folosiți forma:forma
format:format formular:formular formularul:formularul formularului:formularului
formulata:formulată forta:forță fost:fost frankfurt:Frankfurt frauda:fraudă
functia:funcția functie:funcție functiona:funcționa functional:funcțional
functionale:funcționale functionalitate:funcționalitate functionarea:funcționarea
functionarii:funcționării fundatie:fundație furnizare:furnizare furnizarea:furnizarea
furnizarii:furnizării furnizor:furnizor furnizori:furnizori furnizorii:furnizorii
furnizorilor:furnizorilor furnizorul:furnizorul furnizorului:furnizorului furt:furt
furtul:furtul garantie:garanție garantii:garanții garantiile:garanțiile gasiti:găsiți
gazduire:găzduire general:general geografic:geografic gestionare:gestionare
gestionarea:gestionarea gestionati:gestionați gestioneaza:gestionează gheorghe:Gheorghe
grad:grad gratuita:gratuită grava:gravă gravitatea:gravitatea gresit:greșit grup:grup
guvernat:guvernat hartie:hârtie iar:iar identifica:identifică identificare:identificare
identificarea:identificarea identificarii:identificării identificator:identificator
identificatori:identificatori identitate:identitate identitatii:identității ilegal:ilegal
ilicite:ilicite imagine:imagine imbunatatim:îmbunătățim imbunatatirii:îmbunătățirii
imediat:imediat imediate:imediate impiedica:împiedica implementare:implementare
implementarii:implementării implementate:implementate implicat:implicat impotriva:împotriva
improbabila:improbabilă impun:impun impusa:impusă imputernicita:împuternicită
imputernicite:împuternicite inactive:inactive inainte:înainte inca:încă incalcare:încălcare
incalcarea:încălcarea incalcarii:încălcării incalcarile:încălcările incalcat:încălcat
incasate:încasate incat:încât inceput:început inceputul:începutul incetarea:încetarea
inceteaza:încetează incheiat:încheiat incheiate:încheiate incheie:încheie
incheierea:încheierea inchiriem:închiriem incident:incident incidente:incidente
incidentele:incidentele incidentelor:incidentelor incidentul:incidentul incidentului:incidentului
inclusa:inclusă incluse:incluse inclusiv:inclusiv incomplete:incomplete incuiate:încuiate
indata:îndată independent:independent indeplinirea:îndeplinirea indicat:indicat
indicata:indicată indicatori:indicatori indiferent:indiferent indirecte:indirecte
indisponibila:indisponibilă indisponibilitati:indisponibilități individuala:individuală
individuale:individuale inexacte:inexacte inexistente:inexistente informa:informa
informarea:informarea informatic:informatic informatii:informații informatiile:informațiile
informatiilor:informațiilor informative:informative informeaza:informează
infrastructura:infrastructura initiala:inițială inregistrari:înregistrări
inregistrarilor:înregistrărilor inregistrata:înregistrată insa:însă insolventa:insolvență
insotita:însoțită instanta:instanța instantei:instanței instantele:instanțele
instantelor:instanțelor instructiunilor:instrucțiunilor instruire:instruire
instruirea:instruirea instrumente:instrumente intai:întâi intarzia:întârzia
intarziate:întârziate intarziere:întârziere intarzierii:întârzierii integral:integral
integranta:integrantă integritate:integritate integritatii:integrității
intelectuala:intelectuală intelegem:înțelegem intelegeti:înțelegeți intemeiate:întemeiate
intentie:intenție intentioneaza:intenționează interactiune:interacțiune interes:interes
interese:interese interesul:interesul interesului:interesului interfata:interfață
intern:intern interna:internă interni:interni interogari:interogări interventia:intervenția
intocmirea:întocmirea intocmirii:întocmirii intocmit:întocmit intotdeauna:întotdeauna
intrarea:intrarea intre:între intrebare:întrebare intrebari:întrebări intreg:întreg
intregului:întregului intretinere:întreținere introduca:introducă introduse:introduse
intrunite:întrunite invatare:învățare inventarul:inventarul investigatia:investigația
investigatie:investigație invoca:invocă ireversibil:ireversibil ireversibila:ireversibilă
istoricul:istoricul itm:ITM izolarea:izolarea jos:jos judecatoresti:judecătorești
juridic:juridic juridice:juridice jurnale:jurnale jurnalele:jurnalele jurnalelor:jurnalelor
jurnalizare:jurnalizare jurnalizarea:jurnalizarea laptop:laptop legal:legal legala:legală
legalitatea:legalitatea legata:legată legate:legate legatura:legătură lege:lege
legislatia:legislația legitim:legitim liber:liber
libertatile:libertățile limba:limba limbaj:limbaj limitare:limitare limitarea:limitarea
limitarile:limitările limitat:limitat limitata:limitată limitele:limitele linkul:linkul
lista:lista litigiile:litigiile litigiu:litigiu local:local locatia:locația locul:locul
logic:logic logica:logică lor:lor lua:lua luam:luăm luate:luate luati:luați
lucrat:lucrat lucratoare:lucrătoare lucru:lucru luna:luna lunar:lunar lunara:lunară
luni:luni lunii:lunii magheru:Magheru mai:mai mail:mail major:major majora:majoră
maparea:maparea marcile:mărcile mare:mare marketing:marketing marketingului:marketingului
masura:măsura masurare:măsurare masurarea:măsurarea masuri:măsuri masurile:măsurile
masurilor:măsurilor materiale:materiale materialelor:materialelor materializarea:materializarea
materie:materie maximum:maximum mecanismului:mecanismului mediile:mediile mediilor:mediilor
mediu:mediu membri:membri mentine:menține mentinuta:menținută mesaj:mesaj mesaje:mesaje
mesajul:mesajul mici:mici microsoft:Microsoft migrarea:migrarea mijloacele:mijloacele
minimului:minimului minimum:minimum minor:minor mod:mod modifica:modifica modificam:modificăm
modificare:modificare modificarea:modificarea modificari:modificări modificarii:modificării
modul:modul module:module modulele:modulele moment:moment momentul:momentul
monitorizare:monitorizare monitorizarea:monitorizarea motivele:motivele mozilla:Mozilla
mult:mult multe:multe munca:muncă muncii:muncii mutual:mutual nationala:națională
nationale:naționale natura:natura naturii:naturii navigare:navigare navigarea:navigarea
nealterabila:nealterabilă neautorizat:neautorizat neautorizata:neautorizată
neautorizate:neautorizate necesar:necesar necesara:necesară necesare:necesare
necesita:necesită neconditionat:necondiționat necriptat:necriptat nedisponibila:nedisponibilă
neesential:neesențial neesentiale:neesențiale neexecutarea:neexecutarea nefiind:nefiind
nefondate:nefondate negative:negative nejustificata:nejustificată nelimitat:nelimitat
neplata:neplata nerealizat:nerealizat nerespectarea:nerespectarea nevoie:nevoie
nici:nici niciun:niciun nivel:nivel nivelul:nivelul nivelului:nivelului noi:noi
nostri:noștri nostru:nostru notifica:notifică notificare:notificare notificarea:notificarea
notificari:notificări notificarile:notificările notificat:notificat notificate:notificate
noua:nouă numai:numai numar:număr numarul:numărul nume:nume numele:numele
numeroase:numeroase obiectul:obiectul obliga:obligă obligatia:obligația obligatie:obligație
obligatii:obligații obligatiile:obligațiile obligatiilor:obligațiilor
obligativitatea:obligativitatea obligatorie:obligatorie obligatorii:obligatorii
obligatoriu:obligatoriu ofera:oferă operam:operăm operata:operată operatiuni:operațiuni
operatiunilor:operațiunilor operator:operator operatorii:operatorii operatorilor:operatorilor
operatorul:operatorul operatorului:operatorului opiniile:opiniile opozitia:opoziția
opozitie:opoziție oprirea:oprirea optiunea:opțiunea optiuni:opțiuni optiunii:opțiunii
optiunile:opțiunile opuneti:opuneți ora:ora ore:ore organizatie:organizație
organizatorice:organizatorice ori:ori oricand:oricând oricare:oricare orice:orice
oricum:oricum orientative:orientative originale:originale pachet:pachet pact:pact
pagini:pagini paginile:paginile pana:până parole:parole parolei:parolei parolelor:parolelor
parte:parte partea:partea partener:partener parteneri:parteneri partenerilor:partenerilor
parti:părți partile:părțile partilor:părților pastra:păstra pastram:păstrăm
pastrare:păstrare pastrarea:păstrarea pastrarii:păstrării pastreaza:păstrează
pastreze:păstreze paza:pază penale:penale penetrare:penetrare pentru:pentru
percepe:percepe perioada:perioada periodic:periodic periodice:periodice
permanenta:permanentă permis:permis permisiuni:permisiuni permit:permit permite:permite
persoana:persoana persoane:persoane persoanele:persoanele persoanelor:persoanelor
personal:personal personale:personale personalul:personalul personalului:personalului
peste:peste pierdere:pierdere pierderea:pierderea pierderii:pierderii pixeli:pixeli
plan:plan plangere:plângere plasarea:plasarea plasate:plasate plaseaza:plasează
plata:plata platforma:platforma platformei:platformei plati:plăți platilor:plăților
plin:plin plus:plus poate:poate politica:politica politice:politice politici:politici
portabilitate:portabilitate posibil:posibil posibile:posibile posta:poștă
postal:poștal postala:poștală pozitia:poziția prealabil:prealabil prealabila:prealabilă
preciza:preciza precontractuale:precontractuale precum:precum preferabila:preferabilă
preferinte:preferințe preferintele:preferințele pregatirea:pregătirea prejudicii:prejudicii
prejudiciile:prejudiciile prejudiciu:prejudiciu prelucra:prelucra prelucram:prelucrăm
prelucrare:prelucrare prelucrarea:prelucrarea prelucrari:prelucrări prelucrarii:prelucrării
prelucrate:prelucrate prelucreaza:prelucrează prelungire:prelungire prelungit:prelungit
prelungita:prelungită prenume:prenume presa:presă prescriptie:prescripție prestat:prestat
presupune:presupune prevazut:prevăzut prevazute:prevăzute prevenire:prevenire
prevenirea:prevenirea previzibile:previzibile prezentul:prezentul
prezentului:prezentului prezinta:prezintă prima:prima primele:primele primeste:primește
primirea:primirea primite:primite primiti:primiți prin:prin principal:principal
principiului:principiului printre:printre private:private priveste:privește
privind:privind probabile:probabile probelor:probelor procedura:procedura
procedurii:procedurii procedurilor:procedurilor proces:proces procesului:procesului
produca:producă produce:produce productie:producție produs:produs produse:produse
profesional:profesional profesionala:profesională profesionale:profesionale
profesionali:profesionali profiluri:profiluri programul:programul promovare:promovare
proprietate:proprietate proprietatea:proprietatea propriu:propriu propuse:propuse
protectia:protecția protectie:protecție proteja:proteja protejate:protejate
pseudonimizare:pseudonimizare publica:publică publicare:publicare publicarea:publicarea
publicata:publicată publice:publice pun:pun punctului:punctului pune:pune
punerea:punerea putem:putem puteti:puteți putin:puțin raman:rămân raport:raport
raportare:raportare raportarea:raportarea raportari:raportări raporteaza:raportează
raporturilor:raporturilor raspunde:răspunde raspundem:răspundem raspundere:răspundere
raspunderea:răspunderea raspunderii:răspunderii raspuns:răspuns raspunsul:răspunsul
raspunsuri:răspunsuri realizata:realizată realizeaza:realizează receptie:recepție
reciproc:reciproc reclame:reclame recomandari:recomandări recrutare:recrutare
recrutarea:recrutarea rectificare:rectificare recuperare:recuperare redacteaza:redactează
redus:redus reflecte:reflecte refuza:refuza refuzul:refuzul regasesc:regăsesc
registrul:registrul registrului:registrului regiunea:regiunea reglementata:reglementată
regula:regula regulamentul:regulamentul reintroduceti:reintroduceți relatia:relația
relatiei:relației relevante:relevante religioase:religioase remediaza:remediază
remediere:remediere remedierea:remedierea remediu:remediu repaus:repaus repetitiv:repetitiv
reprezentant:reprezentant reprezentanti:reprezentanți reprezentantii:reprezentanții
reprezentantilor:reprezentanților reprezentata:reprezentată reprezinta:reprezintă
resetarea:resetarea respinge:respinge respinsi:respinși responsabil:responsabil
responsabilitati:responsabilități responsabilul:responsabilul responsabilului:responsabilului
restaurarii:restaurării restranse:restrânse restrictionarea:restricționarea
restrictionat:restricționat resursele:resursele resurselor:resurselor retin:rețin
retina:rețină retine:rețin retinerea:reținerea retrage:retrage retragere:retragere
retragerea:retragerea retragerii:retragerii reversibilitate:reversibilitate
revizuire:revizuire revizuirea:revizuirea revocarea:revocarea rezilia:rezilia
reziliere:reziliere rezolva:rezolva rezonabil:rezonabil rezonabila:rezonabilă
rezulta:rezultă ridicat:ridicat risc:risc riscul:riscul riscului:riscului rol:rol
roluri:roluri romana:română romania:România romaniei:României rugam:rugăm safari:Safari
salariu:salariu salarizare:salarizare sanatatea:sănătatea satisfactia:satisfacția
satisfactie:satisfacție satisfactiei:satisfacției scadente:scadente scanarea:scanarea
scanari:scanări scaner:scaner scazut:scăzut schimbarea:schimbarea scoase:scoase
scop:scop scopul:scopul scopuri:scopuri scopurile:scopurile scris:scris scrisa:scrisă
scrisoarea:scrisoarea seama:seama secret:secret sector:sector sectorul:sectorul
securitate:securitate securitatea:securitatea securitatii:securității sediu:sediu
sediul:sediul selectata:selectată selectie:selecție semestrial:semestrial
semnarii:semnării semnate:semnate sensul:sensul separarea:separarea separat:separat
separata:separată servesc:servesc servicii:servicii serviciilor:serviciilor
serviciu:serviciu sesiune:sesiune sesiunea:sesiunea sesiunii:sesiunii sesiunilor:sesiunilor
setari:setări sfarsitul:sfârșitul siglei:siglei sigur:sigur siguranta:siguranță
similare:similare simple:simple simplu:simplu sincronizare:sincronizare singura:singură
sistem:sistem sisteme:sisteme sistemelor:sistemelor situatia:situația situatie:situație
situatii:situații situatiile:situațiile sociale:sociale societate:societate
societatea:societatea societatii:societății soldat:soldat solicita:solicita
solicitam:solicităm solicitare:solicitare solicitari:solicitări solicitarilor:solicitărilor
solicitate:solicitate solutie:soluție solutioneaza:soluționează spatiu:spațiu
spatiului:spațiului special:special speciale:speciale stabileste:stabilește
stabili:stabili stabilite:stabilite standard:standard starea:starea statistice:statistice
statistici:statistici sterge:șterge stergere:ștergere stergerea:ștergerea sterse:șterse
stocare:stocare stocate:stocate strict:strict stricta:strictă stricte:stricte
structurare:structurare structurat:structurat studii:studii sub:sub
subimputerniciti:subîmputerniciți subimputernicitilor:subîmputerniciților
subsolul:subsolul substantiale:substanțiale subzista:subzistă suficienta:suficientă
sumelor:sumelor sunt:sunt suntem:suntem superior:superior suplimentare:suplimentare
suport:suport suportul:suportul supraveghere:supraveghere sursa:sursă survine:survine
sus:sus suspiciune:suspiciune suspiciuni:suspiciuni tabelul:tabelul tablouri:tablouri
tara:țară tarif:tarif taxa:taxă tehnica:tehnică tehnice:tehnice tehnologii:tehnologii
tehnologiile:tehnologiile telefon:telefon telefonic:telefonic temei:temei temeiul:temeiul
teritoriul:teritoriul termen:termen termene:termene termenele:termenele termenul:termenul
tert:terț terti:terți tertilor:terților testare:testare testarea:testarea text:text
timp:timp timpului:timpului tinuti:ținuți tipul:tipul toate:toate totala:totală
traficului:traficului transfer:transfer transferul:transferul transferuri:transferuri
transmis:transmis transmise:transmise transmite:transmite transmitere:transmitere
transmiterea:transmiterea transmiteti:transmiteți tranzactional:tranzacțional
tranzactionale:tranzacționale tranzit:tranzit trebuie:trebuie trimestriala:trimestrială
trimiteti:trimiteți uitat:uitat ulterioare:ulterioare ultima:ultima ultimei:ultimei
ultimele:ultimele umane:umane unde:unde unei:unei unele:unele unici:unici unicul:unicul
unilaterala:unilaterală uniunea:uniunea uniunii:uniunii unor:unor unui:unui
urmarire:urmărire urmata:urmată urmatoarele:următoarele urmatoarelor:următoarelor
usurinta:ușurința utiliza:utiliza utilizare:utilizare utilizarea:utilizarea
utilizat:utilizat utilizati:utilizați utilizatori:utilizatori utilizatorii:utilizatorii
utilizatorilor:utilizatorilor utilizeaza:utilizează vadit:vădit validare:validare
valoarea:valoarea vatamare:vătămare vedere:vedere verbal:verbal verificarea:verificarea
verificati:verificați versiunea:versiunea video:video vietii:vieții vigoare:vigoare
vin:vin vindem:vindem vineri:vineri vizata:vizată vizate:vizate vizeaza:vizează
vizibil:vizibil vizita:vizită vizitarea:vizitarea vizitate:vizitate vizitati:vizitați
vizitatorii:vizitatorii vizitei:vizitei volum:volum volumul:volumul vom:vom
vulnerabilitati:vulnerabilități web:web zile:zile zilnice:zilnice
si:și in:în sa:să va:vă il:îl
inlocuiti:înlocuiți randurile:rândurile realitatii:realității insusi:însuși
coordoneaza:coordonează acreditarilor:acreditărilor autoritati:autorități
abonati:abonați angajatii:angajații competente:competențe anumita:anumită
corecta:corectă completa:completă societatii:societății emitenta:emitentă
primitoare:primitoare pastreze:păstreze
acordata:acordată administrarii:administrării abonarii:abonării aplicand:aplicând
autentificarii:autentificării autoritatii:autorității autorizata:autorizată
calculata:calculată cerinta:cerință circulatie:circulație configuratii:configurații
decurgand:decurgând declarata:declarată derularii:derulării destinatiei:destinației
discutiile:discuțiile evaluarii:evaluării functionalitati:funcționalități
functionalitatilor:funcționalităților functionare:funcționare imprejurarile:împrejurările
impreuna:împreună imputabila:imputabilă imputernicit:împuternicit incalca:încalcă
incalcari:încălcări incepand:începând incerce:încerce incetare:încetare incheia:încheia
informatie:informație informatiei:informației informarii:informării
instructiune:instrucțiune instructiuni:instrucțiuni instructiunii:instrucțiunii
instructiunile:instrucțiunile intarzierea:întârzierea intarzieri:întârzieri
integrala:integrală intelege:înțelege intelegere:înțelegere intelegerea:înțelegerea
intelegeri:înțelegeri intelesul:înțelesul intentia:intenția
internationala:internațională internationale:internaționale interpretata:interpretată
intra:intră intreaga:întreaga intreruperile:întreruperile motivata:motivată
national:național necesitatii:necesității obligata:obligată obligatiei:obligației
odata:odată operationale:operaționale optional:opțional planificata:planificată
presedintiala:președințială prestarii:prestării protectiei:protecției
realizarii:realizării respectarii:respectării restrictionare:restricționare
returnarii:returnării rotatie:rotație simpla:simplă solicitarii:solicitării
solutionata:soluționată specificatii:specificații subimputernicit:subîmputernicit
subimputernicitii:subîmputerniciții tinand:ținând desemneaza:desemnează limiteaza:limitează datoreaza:datorează
protejeaza:protejează prevaleaza:prevalează returneaza:returnează
implementeaza:implementează adreseaza:adresează autorizeaza:autorizează
semneaza:semnează garanteaza:garantează inlocui:înlocui inlocuieste:înlocuiește
insasi:însăși desfasura:desfășura activitati:activități penalitati:penalități
penalitatile:penalitățile anuntata:anunțată automata:automată
international:internațional informatica:informatică sablon:șablon
campurile:câmpurile semnatura:semnătura
"""

MAP = {}
for tok in W.split():
    if ':' in tok:
        a, b = tok.split(':', 1)
        if a != b:
            MAP[a] = b

def capitalizeaza(sursa, dest):
    if len(sursa) > 1 and sursa.isupper():
        return dest.upper()          # titlu scris integral cu majuscule
    if sursa[:1].isupper():
        return dest[:1].upper() + dest[1:]
    return dest

TEHNIC = re.compile(r'[\w.+-]+@[\w.-]+|www\.[\w.-]+|\b[\w-]+\.(?:ro|com|eu|org|io)\b|\b[a-z]+_[a-z_]+\b')

def converteste(text):
    # scoate temporar adresele de e-mail / domeniile / identificatorii cu underscore
    pastrate = []
    def ascunde(m):
        pastrate.append(m.group(0))
        return '\x00%d\x00' % (len(pastrate) - 1)
    text = TEHNIC.sub(ascunde, text)

    for a, b in FRAZE:
        text = text.replace(a, b)
    # abrevieri de forma juridica: SA = societate pe actiuni, nu conjunctia "sa"
    PROTEJATE = {'SA', 'VA', 'CA'}
    def sub(m):
        w = m.group(0)
        if w in PROTEJATE:
            return w
        rep = MAP.get(w.lower())
        return capitalizeaza(w, rep) if rep else w
    text = re.sub(r"[A-Za-zăâîșțĂÂÎȘȚ]+", sub, text)
    return re.sub(r'\x00(\d+)\x00', lambda m: pastrate[int(m.group(1))], text)

if __name__ == '__main__':
    total = 0
    for f in sorted(glob.glob('gen-*.js')) + ['lib.js']:
        s = open(f, encoding='utf-8').read()
        # numai in interiorul literalilor sir cu ghilimele simple
        def pe_literal(m):
            global total
            orig = m.group(1)
            if orig.startswith('./') or orig.endswith('.docx') or orig.endswith('.js'):
                return m.group(0)
            nou = converteste(orig)
            if nou != orig:
                total += 1
            return "'" + nou + "'"
        out = re.sub(r"'([^'\\\n]*)'", pe_literal, s)
        open(f, 'w', encoding='utf-8').write(out)
    print('literali modificati:', total)
