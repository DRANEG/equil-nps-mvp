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

Teste: `npm test` (19 teste — calculul NPS, fluxul de răspuns, autentificare, export).

## 2. Ce face

| Zonă | Ce poți face |
|------|--------------|
| Sondaj | Pagină mobil-first, scala 0–10 + motivul scorului. Funcționează fără JavaScript. |
| Campanii | Fiecare val de măsurare e o campanie (ex. „NPS trimestrial Q1”), cu întrebări proprii și link public `/s/<slug>`. |
| Contacte | Le lipești ca text (`email, nume, companie, segment`); fiecare primește un link unic `/r/<token>`, deci știi cine a răspuns. |
| Trimitere | Export CSV cu linkuri, gata de mail-merge în Gmail/Outlook/Mailchimp. Aplicația nu trimite emailuri — vezi secțiunea 5. |
| Dashboard | Scor NPS, marjă de eroare, rată de răspuns, distribuție 0–10, evoluție lunară, defalcare pe segment, ultimele comentarii. |
| Răspunsuri | Listă filtrabilă, export CSV și buton „Închide bucla” pentru cazurile în care ai revenit către client. |
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

## 5. Trimiterea invitațiilor

MVP-ul nu trimite emailuri intenționat (ca să nu depinzi de un cont SMTP/API din prima zi).
Fluxul recomandat:

1. Admin → Campanii → deschizi campania → lipești contactele → **Generează linkuri**.
2. **Export CSV pentru mail-merge** → obții coloanele `email, nume, companie, segment, link`.
3. Trimiți din Gmail (Mail Merge), Outlook, Mailchimp sau Brevo, cu textul:

   > Bună, {{nume}}. Ne-ar ajuta un minut din timpul tău: {{link}}

4. Opțional, pui butoanele de scor direct în email — linkul acceptă scorul preselectat:
   `{{link}}?scor=9`. Omul dă un click în email și ajunge pe pagină cu 9 deja bifat,
   unde poate adăuga motivul.

Când vrei trimitere automată, adaugi un pas de SMTP peste aceeași listă de invitații —
structura de date e deja pregătită (`invites.sent_at`).

## 6. Structura codului

```
src/
  server.js          rutare HTTP + pornirea serverului
  db.js              schema SQLite și toate interogările
  nps.js             calculul NPS (categorii, scor, marjă de eroare)
  http.js            helpere: formulare, cookie-uri, CSV, escape HTML
  routes/public.js   sondaj, trimitere răspuns, API JSON
  routes/admin.js    dashboard, campanii, invitații, exporturi
  views/             HTML-ul (layout + CSS, sondaj, admin)
  seed.js            date demo
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
| GET | `/healthz` | verificare de sănătate pentru hosting |

## 7. Punere în producție

- Setează `ADMIN_TOKEN` (parolă lungă) și `PUBLIC_URL` (domeniul real, cu `https://`).
- Rulează în spatele unui reverse proxy cu TLS (Caddy, Nginx) — cookie-ul de admin e
  `HttpOnly` + `SameSite=Lax`, dar parola circulă doar criptat dacă ai HTTPS.
- Backup = copierea fișierului `data/nps.db` (oprește serverul sau folosește
  `sqlite3 data/nps.db ".backup backup.db"`).
- Serviciu systemd / container: comanda e `node src/server.js`, nimic de compilat.

## 8. Limite cunoscute (conștiente, pentru un MVP)

- O singură parolă de admin, fără conturi per utilizator.
- Fără trimitere de email și fără remindere automate.
- Fără grafic interactiv (dashboardul desenează bare simple în HTML/CSS).
- Fără multi-tenant: o instalare = o organizație.

Fiecare dintre ele se adaugă peste structura existentă fără rescriere.
