# Documente legale EQUIL

Șapte șabloane în limba română, construite pe Regulamentul (UE) 2016/679 (GDPR) și
pe legislația românească aplicabilă.

> **Nu sunt acte juridice finalizate.** Sunt modele de lucru care acoperă structura și
> clauzele obligatorii. Înainte de a le semna cu un client sau de a le publica, trebuie
> completate cu datele reale ale societății și validate de un avocat sau consilier juridic.
> Câmpurile evidențiate cu galben, în forma `[ASA]`, cer completare.

## Ce conține fiecare document

| Fișier | La ce folosește | Când îl semnezi / publici |
|---|---|---|
| `01-Acord-prelucrare-date-DPA.docx` | Acordul art. 28 GDPR, prin care prelucrezi date în numele clientului | **Obligatoriu** la fiecare client, odată cu contractul |
| `02-Acord-de-confidentialitate-NDA.docx` | Confidențialitate reciprocă în discuțiile precontractuale | Înainte de a arăta date sau detalii tehnice |
| `03-Contract-cadru-servicii.docx` | Contractul comercial: preț, durată, SLA, răspundere, încetare | La semnarea cu clientul |
| `04-Politica-de-confidentialitate.docx` | Informarea persoanelor vizate, art. 13-14 GDPR | Se **publică pe site**, link în subsol |
| `05-Politica-de-cookie-uri.docx` | Informarea privind cookie-urile, Legea 506/2004 | Se **publică pe site**, lângă bannerul de consimțământ |
| `06-Registrul-activitatilor-de-prelucrare.docx` | Evidența cerută de art. 30 GDPR | Document **intern**, se prezintă la control ANSPDCP |
| `07-Procedura-incidente-de-securitate.docx` | Ce faci în primele 72 de ore după o breșă, art. 33-34 | Document **intern**, se aplică la incident |

## Ordinea în care le folosești cu un client

1. **NDA** — înainte de prima discuție tehnică serioasă
2. **Contract-cadru** + **DPA** — semnate împreună; DPA e anexă la contract
3. Pe site trebuie să fie deja publicate **politica de confidențialitate** și **cea de cookie-uri**
4. **Registrul** și **procedura de incidente** — le ai pregătite intern, indiferent de clienți

## Ce trebuie verificat de un jurist (nu te baza pe șablon)

- **Plafonul de răspundere** din contract, art. 11.2 — cifra trebuie corelată cu asigurarea și cu riscul real
- **Instanța competentă** — apare în toate cele trei contracte, lăsată nedecisă intenționat
- **Penalitățile** de întârziere și cele din NDA, art. 11.3
- **Termenele de păstrare** din politica de confidențialitate — trebuie să reflecte ce faceți efectiv
- **Lista subîmputerniciților** (Anexa 3 la DPA) — trebuie să fie exactă și completă
- Dacă aveți nevoie de un **DPO** desemnat, conform art. 37 GDPR

## Atenție la declarațiile de conformitate

Anexa 2 la DPA și mai multe secțiuni menționează SOC 2, ISO 27001, teste de penetrare,
găzduire în UE. **Păstrați doar ce aveți efectiv.** O măsură declarată dar neimplementată
se transformă în răspundere la primul control sau incident.

## Cum au fost generate

Documentele sunt produse din scripturi, ca să poată fi regenerate la nevoie:

```bash
npm install          # o singură dată
node gen-01-dpa.js   # sau oricare alt generator
```

`lib.js` conține stilurile comune. `diacritice.py` a fost folosit pentru adăugarea
diacriticelor în text. Modificările de conținut se fac în fișierele `gen-*.js`,
nu direct în `.docx` — altfel se pierd la regenerare.
