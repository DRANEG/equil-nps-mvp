# Equil NPS — sistem minimal de măsurare NPS

Aplicație completă, dar simplă, pentru a colecta și urmări **Net Promoter Score**:
sondaj cu scala 0–10 + întrebare deschisă, linkuri personalizate pe contact,
dashboard cu scorul și evoluția lui, export CSV.

Fără dependențe externe: rulează pe **Node.js 22.5+** cu SQLite inclus în Node
(`node:sqlite`). Nu ai nevoie de `npm install`, de un server de baze de date sau
de un abonament la o platformă.

---

## 1. Pornire în 3 comenzi

```bash
cp .env.example .env      # și schimbă ADMIN_TOKEN
npm run seed              # opțional: date demo, ca să vezi dashboardul plin
npm start                 # pornește pe http://localhost:3000
```

- Sondaj public demo: <http://localhost:3000/s/demo-nps>
- Administrare: <http://localhost:3000/admin> (parola = `ADMIN_TOKEN` din `.env`)

Teste: `npm test` (76 de teste — calculul NPS, fluxul de răspuns, autentificare, export,
protocolul SMTP, robotul de trimitere, dezabonarea, întrebările proprii, locațiile,
generatorul de coduri QR, fișierele aplicației instalabile și alertele la detractori).

## 2. Ce face

| Zonă | Ce poți face |
|------|--------------|
| Sondaj | Pagină mobil-first, scala 0–10 + motivul scorului. Funcționează fără JavaScript și chiar fără semnal. |
| Întrebări proprii | Pe lângă NPS: note 1–5, alegere dintr-o listă sau text liber, pe teme de produs / experiență / locație. |
| Coduri QR | Un cod QR per locație, de lipit la casă sau pe masă. Clientul scanează și răspunde; tu vezi din ce locație vine feedbackul. |
| Aplicație instalabilă | PWA: se instalează pe telefon (Android, iPhone) din browser, fără App Store. |
| Campanii | Fiecare val de măsurare e o campanie (ex. „NPS trimestrial Q1”), cu întrebări proprii și link public `/s/<slug>`. |
| Contacte | Le lipești ca text (`email, nume, companie, segment`); fiecare primește un link unic `/r/<token>`, deci știi cine a răspuns. |
| Trimitere | Automată pe email (SMTP), cu o singură reamintire după 5 zile. Alternativ, export CSV cu linkuri pentru mail-merge. |
| Dezabonare | Link în fiecare email + buton „Unsubscribe” al Gmail/Outlook; dezabonații nu mai primesc nimic. |
| Dashboard | Scor NPS, marjă de eroare, rată de răspuns, distribuție 0–10, evoluție lunară, defalcare pe segment, ultimele comentarii. |
| Răspunsuri | Listă filtrabilă, export CSV și buton „Închide bucla” pentru cazurile în care ai revenit către client. |
| Alerte | Orice scor 0–6 declanșează imediat un email către echipă și un webhook (Slack/Telegram), plus o listă de lucru cu detractorii deschiși. |
| API | `POST /api/raspunsuri` cu JSON, pentru widget în aplicație sau integrare cu alt sistem. |

## 3. Cum se calculează scorul

- **0–6 detractori**, **7–8 pasivi**, **9–10 promotori**
- `NPS = % promotori − % detractori`, rotunjit, între −100 și +100
- Pasivii nu se scad, dar intră în numitor — de aceea „mulți de 8” trag scorul în jos.
- Dashboardul arată și **marja de eroare (95%)**: la 30 de răspunsuri ea e de ±15–20 puncte,
  deci o variație de 5 puncte între trimestre nu înseamnă nimic. Sub ~100 de răspunsuri,
  citește trendul, nu cifra exactă.

## 4. De ce ai nevoie ca să funcționeze (partea non-tehnică)

Programul e partea ușoară. Ca măsurătoarea să fie utilă, ai nevoie de:

1. **O listă de contacte** cu email și, ideal, un câmp de segment (Enterprise / IMM /
   Startup, oraș, tip de serviciu). Fără segment ai un singur număr; cu el afli *unde*
   e problema.
2. **Un moment de trimitere** stabilit dinainte. Două variante uzuale:
   - *relațional*: la 3 sau 6 luni, către toți clienții activi;
   - *tranzacțional*: la 24–72h după o livrare, un tichet de suport, o instalare.
3. **Un ritm**: trimestrial e suficient pentru NPS relațional. Nu întreba același om
   mai des de o dată la 3 luni (oboseală de sondaj = rată de răspuns în scădere).
4. **Un owner** — cineva care se uită săptămânal la detractori și răspunde. Fără asta
   sondajul strică relația în loc să o repare.
5. **Un proces de „închidere a buclei”**: orice detractor (0–6) primește un telefon sau
   un email în 48h. Butonul „Închide bucla” din listă marchează cazul ca rezolvat.
6. **Așteptări realiste**: rata de răspuns normală e 10–30% pe email. Un B2B cu relație
   bună ajunge la 40%. NPS bun în B2B servicii: +30…+50.
7. **Nota de GDPR**: pui un rând în sondaj/emailul de invitație despre scopul prelucrării
   și păstrezi datele doar cât ai nevoie. Aplicația salvează email, nume, companie,
   segment, scor și comentariu — nimic altceva, local, în fișierul tău SQLite.

## 5. Trimiterea automată pe email

### Cum funcționează

1. Adaugi contactele în campanie → fiecare primește un link unic.
2. După `SEND_DELAY_MINUTES` (implicit 10), robotul trimite **invitația**. Pauza aceea
   e intenționată: ai timp să corectezi lista dacă ai lipit greșit ceva. Butonul
   **„Trimite acum ce e în așteptare”** o sare.
3. După `REMINDER_DAYS` (implicit 5) trimite **o singură reamintire**, doar celor care
   nu au răspuns. Cine a răspuns sau s-a dezabonat nu mai primește nimic.
4. Fiecare trimitere apare în jurnalul din pagina campaniei (trimis / eroare, cu motivul).

Emailul conține butoanele 0–10: un click din inbox duce direct în sondaj cu nota bifată,
unde omul poate scrie motivul. Rata de răspuns crește sensibil față de un simplu link.

### Configurare SMTP

Pui datele în `.env` și repornești:

```bash
SMTP_HOST=smtp.brevo.com      # sau smtp.gmail.com, smtp-relay.sendinblue.com, smtp.office365.com...
SMTP_PORT=587
SMTP_SECURE=starttls          # starttls (587) sau tls (465)
SMTP_USER=...
SMTP_PASS=...
MAIL_FROM=Equil <nps@firma-ta.ro>
```

**Fără `SMTP_HOST` nu pleacă niciun email**: mesajele se scriu ca fișiere `.eml` în
`data/outbox/`, ca să le deschizi și să verifici textul înainte de a-l trimite clienților.
Pagina campaniei spune clar în ce mod ești.

Ca să ajungi în inbox, nu în spam: folosește un domeniu al tău cu **SPF** și **DKIM**
configurate (orice furnizor de email tranzacțional — Brevo, Mailgun, SendGrid, Amazon SES —
îți dă cele două înregistrări DNS de adăugat). Gmail personal merge pentru teste, nu pentru
trimiteri către sute de clienți.

### Dezabonare

Fiecare email are link de dezabonare și antetele `List-Unsubscribe`, deci funcționează și
butonul „Unsubscribe” din Gmail/Outlook. Un simplu GET nu dezabonează pe nimeni (scanerele
de linkuri din firewall-urile de email ar face-o din greșeală) — se cere confirmare.

### Cron, în loc de robotul din server

```bash
SEND_ENABLED=0        # oprește robotul intern
0 * * * * cd /opt/equil-nps && npm run trimite    # și îl rulezi din cron, la fiecare oră
```

Ambele variante sunt sigure dacă rulează simultan: invitația se rezervă în baza de date
înainte de trimitere, deci același om nu primește de două ori același email.

### Varianta fără SMTP (mail-merge)

Rămâne disponibilă: **Export CSV pentru mail-merge** îți dă `email, nume, companie, segment, link`
și trimiți din Gmail Mail Merge, Outlook sau Mailchimp cu textul tău.

## 6. Întrebări suplimentare, locații și coduri QR

### Întrebări proprii

În pagina campaniei, secțiunea **Întrebări suplimentare**. Trei tipuri:

- **notă 1–5** — pentru lucruri pe care vrei să le urmărești în timp (produs, livrare, curățenie);
- **alegere dintr-o listă** — răspunsuri comparabile („Ce ți-a plăcut cel mai mult?”);
- **text liber** — pentru context.

Butonul **„Adaugă setul standard”** îți pune dintr-un click cinci întrebări gata scrise, câte una
pentru produs, experiență și locație. Fiecare poate fi obligatorie sau opțională și se poate reordona.

Sfat practic: **maximum 3–4 întrebări în plus**. Fiecare întrebare adăugată scade rata de răspuns;
NPS-ul plus două note și un câmp liber îți spun deja unde e problema.

Rezultatele apar în dashboard, sub NPS: medie pe fiecare notă, distribuția alegerilor și ultimele
răspunsuri libere.

### Locații și coduri QR

**Admin → Locații** → adaugi locația (nume + adresă) → primești pe loc codul QR.

- Fiecare locație are linkul ei: `/s/<campanie>?loc=<locație>`, iar răspunsul se salvează cu locația.
- **Afiș de printat** deschide o pagină A4 gata de tipărit: „Cum a fost la noi?”, cod QR mare,
  numele și adresa locației. „Printează toate afișele” scoate câte o pagină per locație.
- În dashboard apare **Defalcare pe locație**: vezi care magazin trage scorul în jos.

Codurile QR sunt generate în aplicație (SVG, deci se printează la orice dimensiune fără pixeli).

### Scanare fără semnal

Dacă în magazin nu e semnal bun, pagina sondajului se încarcă din memoria telefonului, iar răspunsul
se salvează local și pleacă singur când revine conexiunea. Clientul vede „răspunsul tău este salvat”,
nu o eroare.

## 7. Alerte la detractori

Un detractor care așteaptă trei zile e un client pierdut. De aceea, la fiecare răspuns cu
**scor 0–6** pleacă imediat o alertă, iar clientul rămâne într-o listă de lucru până când
cineva revine la el.

### Cele două canale

```bash
ALERT_EMAILS=sef@firma.ro, suport@firma.ro      # email către echipă
ALERT_WEBHOOK_URL=https://hooks.slack.com/...   # notificare pe telefon
```

- **Email**: scorul, ce a scris omul, răspunsurile la întrebările suplimentare, locația și un
  buton **„Răspunde clientului”** (deschide direct emailul, de pe telefon).
- **Webhook**: mesaj gata formatat, compatibil direct cu **Slack** (câmpul `text`). Pentru
  **Telegram** pui adresa `https://api.telegram.org/bot<TOKEN>/sendMessage?chat_id=<ID>`; merge și
  cu Zapier, Make sau un endpoint propriu — corpul conține și câmpuri structurate
  (`scor`, `comentariu`, `locatie`, `campanie`, `email`, `link`).

Dacă nu configurezi niciunul, nu se trimite nimic — dar detractorii apar oricum în **Admin → Alerte**.

### Pagina Alerte

**Admin → Alerte** este lista de lucru: fiecare detractor la care nu s-a revenit, cu scorul,
comentariul, locația și două butoane — „Răspunde pe email” și „Am rezolvat, închide bucla”.
Numărul din bara de sus îți arată câți te așteaptă.

### Protecții

- **O singură alertă per răspuns.** Marcajul se pune înainte de trimitere, deci nici robotul,
  nici o actualizare a aceluiași răspuns nu duplică alerta.
- **Limită orară** (`ALERT_MAX_PER_HOUR`, implicit 20): dacă intră brusc 200 de răspunsuri
  proaste, nu primești 200 de emailuri. Restul rămân în pagina de alerte, iar limita e notată în jurnal.
- **Nu încetinește clientul.** Alertele pleacă în fundal: răspunsul e confirmat în câteva
  milisecunde, indiferent cât durează emailul.
- **Dacă niciun canal nu reușește**, alerta se eliberează și se reîncearcă la următorul răspuns
  — și, oricum, apare în jurnal cu motivul exact.
- **Pragul se poate cobori** (`ALERT_MAX_SCORE=3`) dacă primești prea multe alerte și vrei doar
  cazurile grave.
- Se pot opri **per campanie**, din pagina campaniei.

## 8. Aplicație instalabilă pe telefon (PWA)

Nu e nevoie de App Store și nici de cont de developer.

**Pe Android (Chrome):** deschizi adresa aplicației → meniul ⋮ → **„Instalează aplicația”**
(sau „Adaugă la ecranul principal”). Apare ca icoană separată, pornește pe dashboard și rulează
pe tot ecranul, fără bara de browser.

**Pe iPhone (Safari):** butonul Share → **„Add to Home Screen”**.

Condiție obligatorie în producție: aplicația trebuie servită prin **HTTPS** (pe `localhost` merge
și fără). Fără HTTPS, Chrome nu oferă instalarea.

Ce am pregătit pentru asta: `public/manifest.webmanifest` (nume, culori, icoane 192/512 + maskable,
scurtături către Dashboard / Răspunsuri / Locații) și `public/sw.js` (service worker: paginile de
sondaj merg offline, restul arată o pagină clară „Nu ai conexiune”). Paginile de administrare nu se
păstrează în cache, ca să nu vezi date vechi.

## 9. Structura codului

```
src/
  server.js          rutare HTTP + pornirea serverului
  db.js              schema SQLite și toate interogările
  nps.js             calculul NPS (categorii, scor, marjă de eroare)
  http.js            helpere: formulare, cookie-uri, CSV, escape HTML
  routes/public.js   sondaj, trimitere răspuns, API JSON
  routes/admin.js    dashboard, campanii, invitații, exporturi
  views/             HTML-ul (layout + CSS, sondaj, admin)
  qr.js              generator de coduri QR (SVG), scris de la zero
  alerts.js          alerta imediata la detractori (email + webhook)
  mailer.js          client SMTP propriu (fara dependente) + modul .eml pentru probe
  emails.js          șabloanele de invitație și de reamintire
  scheduler.js       robotul: ce se trimite, când și cu ce protecții
  send.js            o singură trecere de trimitere, pentru cron
  seed.js            date demo
public/
  manifest.webmanifest  aplicatia instalabila (PWA)
  sw.js                 service worker: offline si cache
  sondaj.js             trimitere fara semnal, cu coada locala
  icons/                icoanele aplicatiei
test/                teste pentru calcul și pentru fluxul complet
data/nps.db          baza de date (nu se urcă în git)
```

Rute principale:

| Metodă | Rută | Rol |
|--------|------|-----|
| GET | `/s/:slug` | sondaj public, anonim |
| GET | `/r/:token` | sondaj personalizat (acceptă `?scor=9`) |
| POST | `/raspunde` | salvarea răspunsului din formular |
| POST | `/api/raspunsuri` | același lucru, JSON: `{ "slug": "...", "score": 9, "comment": "..." }` |
| GET | `/admin` | dashboard (necesită autentificare) |
| GET | `/admin/raspunsuri.csv` | export răspunsuri |
| GET | `/s/:slug?loc=<locație>` | sondaj deschis prin scanarea unui cod QR |
| GET | `/admin/alerte` | detractorii deschiși + jurnalul alertelor |
| GET | `/admin/locatii` | locații + coduri QR |
| GET | `/admin/afise` | afișele de printat (A4, un cod QR per locație) |
| GET | `/manifest.webmanifest`, `/sw.js` | fișierele aplicației instalabile |
| GET | `/dezabonare/:token` | pagina de dezabonare (confirmare) |
| POST | `/dezabonare/:token` | dezabonarea propriu-zisă (și butonul din Gmail) |
| GET | `/healthz` | verificare de sănătate pentru hosting |

## 10. Punere în producție

- Setează `ADMIN_TOKEN` (parolă lungă) și `PUBLIC_URL` (domeniul real, cu `https://`).
- Rulează în spatele unui reverse proxy cu TLS (Caddy, Nginx) — cookie-ul de admin e
  `HttpOnly` + `SameSite=Lax`, dar parola circulă doar criptat dacă ai HTTPS. HTTPS este și
  condiția ca aplicația să poată fi instalată pe telefon.
- Backup = copierea fișierului `data/nps.db` (oprește serverul sau folosește
  `sqlite3 data/nps.db ".backup backup.db"`).
- Serviciu systemd / container: comanda e `node src/server.js`, nimic de compilat.

## 11. Limite cunoscute (conștiente, pentru un MVP)

- O singură parolă de admin, fără conturi per utilizator.
- Fără aplicație nativă în App Store / Google Play: aplicația se instalează ca PWA, direct din
  browser. Pentru NPS asta e și varianta cu rata cea mai bună de răspuns.
- Codurile QR folosesc corecție de erori nivel M (suportă ~15% deteriorare). Dacă afișul stă
  în locuri unde se murdărește sau se zgârie, printează-l mai mare.
- O singură reamintire per invitație; nu există secvențe de mai multe mesaje.
- Fără grafic interactiv (dashboardul desenează bare simple în HTML/CSS).
- Fără multi-tenant: o instalare = o organizație.

Fiecare dintre ele se adaugă peste structura existentă fără rescriere.
