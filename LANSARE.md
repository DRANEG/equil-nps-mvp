# Lansarea MVP-ului

Drumul de la codul de pe GitHub la primul client care îți dă o notă. Durează
**o zi de lucru pentru partea tehnică** și **o săptămână de pilot** înainte de primul val real.

Fiecare pas are o verificare: dacă nu trece, nu mergi mai departe.

---

## Faza 0 — Ce îți trebuie înainte să începi

| De care ai nevoie | Detalii | Cost |
|---|---|---|
| Un server | VPS mic (1 vCPU, 1 GB RAM) la Hetzner, DigitalOcean sau un furnizor român | ~5 €/lună |
| Un subdomeniu | `nps.firma-ta.ro`, cu un A record către IP-ul serverului | inclus în domeniu |
| Un cont de email tranzacțional | Brevo, Mailgun, SendGrid sau Amazon SES | gratuit la volume mici |
| Acces la DNS-ul domeniului | pentru SPF și DKIM — fără ele, emailurile ajung în spam | — |
| **Un om care sună detractorii** | nu e opțional; fără el, restul nu contează | — |

> Ultima linie e singura care decide dacă proiectul reușește. Stabilește **numele**
> persoanei și **în cât timp** sună (recomandat: 48 de ore), înainte să configurezi orice.

---

## Faza 1 — Instalarea pe server (30 de minute)

```bash
# pe server, ca root
git clone https://github.com/DRANEG/equil-nps-mvp.git /opt/equil-nps
cd /opt/equil-nps
bash deploy/instalare.sh
```

Scriptul instalează Node 22, creează utilizatorul `equil` fără drepturi de administrare,
pregătește folderul de date și pune serviciul systemd. Nu pornește încă aplicația.

**Verificare:** `node -v` arată `v22.x` sau mai nou.

---

## Faza 2 — Configurarea (30 de minute)

Completează `/etc/equil-nps.env`. Minimul obligatoriu:

```bash
PORT=3000
PUBLIC_URL=https://nps.firma-ta.ro
ADMIN_TOKEN=<o parolă lungă, generată: openssl rand -base64 24>
NPS_DB=/opt/equil-nps/data/nps.db
TRUST_PROXY=1                      # pentru că stai în spatele Caddy

SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_SECURE=starttls
SMTP_USER=<de la furnizorul de email>
SMTP_PASS=<de la furnizorul de email>
MAIL_FROM=Firma Ta <nps@firma-ta.ro>
MAIL_REPLY_TO=contact@firma-ta.ro

OPERATOR_NAME=Firma Ta SRL
OPERATOR_CUI=RO12345678
OPERATOR_ADDRESS=Str. Exemplu 1, București
OPERATOR_EMAIL=contact@firma-ta.ro

ALERT_EMAILS=sef@firma-ta.ro, suport@firma-ta.ro
ALERT_WEBHOOK_URL=                 # opțional: Slack sau Telegram
```

Apoi pune HTTPS în față:

```bash
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile   # schimbă domeniul din fișier
sudo systemctl reload caddy
```

**Verificare — pasul care prinde greșelile:**

```bash
cd /opt/equil-nps
sudo -u equil env $(grep -v '^#' /etc/equil-nps.env | xargs) npm run verifica
```

Nu porni cât timp scrie „Nu porni încă”. Verificarea prinde parola implicită, domeniul
fără HTTPS, expeditorul de pe Gmail, datele de firmă lipsă și baza de date pusă în `/tmp`.

```bash
sudo systemctl enable --now equil-nps
journalctl -u equil-nps -f          # vezi dacă a pornit curat
```

---

## Faza 3 — DNS pentru email (15 minute, apoi aștepți propagarea)

Furnizorul de email îți dă două-trei înregistrări DNS. Le adaugi la domeniu:

- **SPF** — spune că furnizorul are voie să trimită în numele tău;
- **DKIM** — semnează mesajele, ca să nu poată fi falsificate;
- **DMARC** (opțional la început) — spune ce să facă serverele cu mesajele nesemnate.

**Verificare:** trimite-ți ție o invitație din aplicație și deschide-o pe Gmail.
„Afișează originalul” trebuie să arate `SPF: PASS` și `DKIM: PASS`. Dacă nu, nu trimite
nimic către clienți — ajungi în spam și îți strici reputația domeniului.

---

## Faza 4 — Proba pe tine (15 minute)

Înainte de orice client real, fă tu tot traseul:

1. **Șterge datele demo.** Dacă ai rulat `npm run seed`, oprește campania `demo-nps` sau
   pornește cu o bază curată (șterge `data/nps.db` și repornește).
2. Creează campania reală și adaugă 2–3 întrebări. Nu mai multe.
3. Adaugă-te pe tine ca unic contact și apasă **„Trimite acum”**.
4. Deschide emailul pe telefon. Apasă pe nota **3**.
5. Verifică: ți-a venit alerta pe email? A apărut în **Admin → Alerte**? Butonul
   **Sună** deschide telefonul?
6. Apasă „Am rezolvat, închide bucla” și vezi că dispare din listă.
7. Adaugă o locație, printează afișul, **scanează codul QR cu telefonul** și răspunde.
8. Deschide `/confidentialitate` și citește nota de informare cu datele firmei tale.

Dacă toate opt funcționează, sistemul e gata. Dacă nu, oprește-te aici.

---

## Faza 5 — Pilotul (o săptămână, 20–30 de clienți)

Nu începe cu toată baza de clienți. Alege **20–30 de clienți cu care ai relație bună**,
de preferat dintr-un singur segment sau dintr-o singură locație.

Ce urmărești în săptămâna de pilot:

| Semnal | Ce înseamnă |
|---|---|
| Rata de răspuns sub 10% | Emailul ajunge în spam sau subiectul nu convinge |
| Răspunsuri care vin, dar fără comentarii | Întrebările sunt prea multe sau prea lungi |
| Alerte care nu ajung | Verifică jurnalul din pagina Alerte |
| Detractori nesunați după 48 de ore | **Problema e de proces, nu de software** — oprește-te și rezolvă asta |

La final de pilot, ai între 3 și 10 răspunsuri. **Nu te uita la scor** — la volumul ăsta
marja de eroare e de ±40 de puncte. Te uiți doar dacă mecanismul funcționează.

---

## Faza 6 — Primul val real

Abia acum încarci lista completă. Ritm recomandat:

- **NPS relațional** — o dată la 3 luni, către clienții activi;
- **NPS tranzacțional** — la 24–72 de ore după livrare, instalare sau tichet de suport.

Robotul trimite singur, doar în intervalul 9:00–20:00, în zile lucrătoare, fără sărbători
legale românești, și o singură reamintire după 5 zile.

---

## Întreținere

| Când | Ce faci |
|---|---|
| Zilnic | te uiți la **Admin → Alerte**; nimic altceva |
| Săptămânal | verifici că rămân zero detractori nesunați |
| Lunar | te uiți la dashboard: trend, locații, segmente |
| Automat | copie de siguranță zilnică la 3:00, curățenie GDPR la 3:30 (vezi `deploy/cron.txt`) |
| La nevoie | `git pull && sudo systemctl restart equil-nps` |

Copiile de siguranță se fac singure, dar **testează o restaurare o dată**: copiază un fișier
din `data/backup/` peste `data/nps.db` pe o instalare de probă și vezi că se deschide.
O copie neverificată nu e o copie.

---

## Când știi că a mers

După primele trei luni, întrebările care contează nu sunt despre scor:

1. Câți detractori au primit un telefon în 48 de ore? (țintă: toți)
2. Câte lucruri ați schimbat efectiv din ce v-au spus clienții? (țintă: cel puțin unul pe lună)
3. Rata de răspuns se menține sau scade? (dacă scade, întrebi prea des)

Scorul NPS e util abia din al doilea sau al treilea val, când ai cu ce să-l compari.
Până atunci, e doar un număr.
