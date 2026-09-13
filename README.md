# equil-nps-mvp

Pachetul EQUIL Growth Intelligence: un workbook Excel care transformă datele brute
ale unei firme în KPI, semnale de risc și oportunități de creștere prioritizate.

## Ce e în repo

Sunt două variante ale fișierului, pentru două mărimi de firmă.

| Cale | Ce conține |
|---|---|
| `dist/EQUIL_Growth_Intelligence_v0_2.xlsx` | Varianta completă (20 de foi) |
| `dist/EQUIL_Light_v0_2.xlsx` | Varianta Light, pentru firme mici (9 foi) |
| `tools/build_equil_workbook.py` | Generatorul variantei complete |
| `tools/build_equil_light.py` | Generatorul variantei Light |
| `tools/stil.py` | Culorile, formatele și helperii comuni ambelor variante |
| `tools/piata.py` | Modulul de concurență și percepție, folosit de ambele variante |
| `tools/istoric.py` | Istoricul financiar pe trei ani + cele două grafice, în `01_FIRMA` |
| `tools/test_workbook.py` | Test automat pentru varianta completă |
| `tools/test_light.py` | Test automat pentru varianta Light |
| `tools/audit_cifre.py` | Audit numeric: recalculează în Python fiecare celulă calculată și o compară cu Excel |
| `tools/audit_formulas.py` | Audit static: paranteze, referințe, funcții incompatibile cu Excel 2016 |
| `tools/verifica_fisier.py` | Verificare structurală a fișierului salvat — exact lucrurile pentru care Excel cere „repararea" |
| `tools/glosar.py` | Cei 74 de termeni din foaia `04_DICTIONAR` |
| `tools/build_ghid_html.py` | Generează ghidul HTML (glosar căutabil + proces + timpi) din aceleași date |
| `dist/ghid_equil.html` | Ghidul de teren, publicat ca pagină |

Fișierul nu se editează structural direct în Excel — se modifică generatorul și se
regenerează, ca să nu se piardă modificările:

```bash
pip install openpyxl
python3 tools/build_equil_workbook.py     # -> dist/EQUIL_Growth_Intelligence_v0_2.xlsx
python3 tools/build_equil_light.py        # -> dist/EQUIL_Light_v0_2.xlsx
pip install formulas                      # doar pentru test
python3 tools/audit_formulas.py           # verificare statică a formulelor
python3 tools/verifica_fisier.py          # verificare structurală a fișierelor salvate
python3 tools/test_workbook.py            # verifică valorile calculate pe date de test
python3 tools/test_light.py               # același test, pentru varianta Light
python3 tools/audit_cifre.py              # recalculează independent fiecare celulă calculată
```

## Structura workbook-ului (20 de foi)

**Colectare de date — cine dă ce**
- `00_GHID` — mod de lucru, cod de culori, setul minim viabil, reguli de igienă a datelor
- `01_FIRMA` — profilul firmei plus istoricul financiar pe trei ani (cifră de afaceri, profit
  brut, profit net, angajați), cu marje, creștere, cifră pe angajat și două grafice
- `02_CONTACTE` — data owners: ce set de date deține fiecare om din firmă, cu termen și status
- `03_CHECKLIST_DATE` — fiecare câmp cerut: ce înseamnă, format, exemplu, din ce sistem se scoate,
  ce rol îl poate da, ce KPI deblochează, status și dată de primire; are și un contor de progres
- `04_DICTIONAR` — 74 de termeni (NDA, ERP, CRM, COGS, FTE, NPS…) explicați, fiecare cu formularea
  pe care o poți folosi direct în discuția cu clientul

**Control**
- `09_PARAMETRI` — perioada analizată, perioada de comparație și toate pragurile de semnal

**Date de intrare**
- `10_CLIENTI`, `11_PRODUSE`, `12_OAMENI` — nomenclatoare
- `13_VANZARI` — tranzacții (faptic)
- `14_TINTE` — ținte pe companie / persoană / produs / client
- `15_NPS` — răspunsuri NPS cu respondent, motiv, temă și follow-up

**Piață și percepție**
- `16_CONCURENTA` — firma și concurenții pe aceleași criterii: cifre publice, notă, recenzii,
  preț, puncte tari și slabe; cotă în grupul urmărit
- `17_CE_CRED_OAMENII` — recenziile publice, zece verificări de specialist, scorul de percepție
  și drumul în trei niveluri către NPS

**Analiză**
- `20_KPI` — 27 de indicatori, curent vs. comparativ, cu Δ și Δ%
- `21_ANALIZA_CLIENTI`, `22_ANALIZA_PRODUSE`, `23_ANALIZA_OAMENI` — semnale automate
  (client pierdut, dormant, scădere, detractor, risc de concentrare, marjă sub referință…)
  și oportunitatea sugerată pentru fiecare

**Rezultat**
- `30_OPORTUNITATI` — prioritizare: scor = impact × probabilitate × ușurință
- `40_RAPORT` — structura pentru clientul final, cu 8 concluzii generate automat din date
- `41_GRAFICE` — 6 grafice native Excel, desenate din datele introduse
- `90_LISTE` — listele pentru validările de tip dropdown

## Compatibilitate

Fără funcții dinamice (`UNIQUE`, `FILTER`, `LET`, `IFS`, `MAXIFS`) și fără `TEXT()` cu
coduri de format — acelea depind de limba interfeței Excel. Funcționează în Excel 2016+,
Microsoft 365, LibreOffice Calc și Google Sheets, în interfață română sau engleză.
`tools/audit_formulas.py` refuză build-ul dacă apare vreuna dintre funcțiile interzise.

## Varianta Light (9 foi)

Pentru firme sub 10 angajați, până în ~500.000 lei pe an, sub 100 de clienți, fără ERP și fără CRM.
Aceeași logică, dar fără coduri de client sau produs (clientul se alege după nume dintr-o listă),
fără analiză pe produse și pe oameni, cu NPS-ul ca o coloană în lista de clienți în loc de o foaie
separată, și cu prioritizare prin clasament (ACUM / URMEAZĂ / MAI TÂRZIU) în loc de praguri de scor.
Aproximativ 2 ore de completat, față de 4-6.

`00_START` · `01_FIRMA` · `02_SETARI` · `10_VANZARI` · `11_CLIENTI` · `12_CONCURENTA` ·
`13_CE_CRED_OAMENII` · `20_REZULTATE` · `21_CE_SE_INTAMPLA` · `30_PLAN` · `40_GRAFICE`

Datele din Light sunt un subset al celor din varianta completă, deci trecerea înseamnă copiere de
coloane, nu reluare de la zero.

## Drumul către NPS

Multe firme nu au măsurat niciodată ce cred clienții despre ele. Modulul de percepție adună trei
surse, în ordinea efortului, și le ține separate în loc să le amestece:

1. **Ce se vede public** — nota și recenziile de pe Google și Facebook, ale firmei și ale
   concurenților. 30 de minute, fără să întrebi pe nimeni.
2. **Părerea specialistului** — zece verificări structurate (cât de clar se înțelege oferta, cât de
   repede răspunde la o cerere reală, cu ce se diferențiază). 1-2 ore.
3. **NPS real** — o întrebare pusă clienților. Singura care spune ce cred cei care plătesc.

Scorul de percepție (media primelor două, pe 0-100) ține locul NPS-ului până când firma începe să
măsoare, dar nu îl înlocuiește: fișierul le afișează separat, arată la ce nivel e firma și scrie
următorul pas. Când sursele nu sunt de acord, dezacordul e concluzia — o notă publică mult peste
NPS înseamnă o firmă care arată mai bine pe internet decât în relația reală.

## Verificarea fișierelor

Un fișier poate fi valid ca formule și totuși să ceară „reparare” la deschiderea în Excel, dacă
XML-ul încalcă schema. De aceea sunt trei niveluri de verificare:

1. `stil.verifica()` — rulează în generator, înainte de salvare: paranteze și ghilimele.
2. `tools/audit_formulas.py` — funcții interzise, referințe rupte, foi inexistente.
3. `tools/verifica_fisier.py` — structura pachetului: XML bine format, relații întregi, reguli de
   formatare condiționată cu operator valid pentru tipul lor, zone îmbinate care nu se suprapun,
   validări de date corecte, grafice care indică foi existente.
4. `tools/audit_cifre.py` — corectitudinea cifrelor: construiește o versiune redusă, o populează cu
   date alese să fie dificile (storno negativ, client pierdut, client adormit, produs fără vânzări,
   om plecat la mijlocul perioadei, ținte pe mai multe niveluri, răspunsuri NPS în afara perioadei)
   și recalculează în Python fiecare celulă din foile de analiză, comparând-o cu ce dă Excel.

Verificarea finală se face deschizând fișierul cu LibreOffice Calc și exportând fiecare foaie în CSV:
dacă apare vreun `#NAME?`, `#REF!` sau `Err:` undeva, iese la iveală acolo.

```bash
soffice --headless --convert-to xlsx --outdir /tmp/verif dist/EQUIL_Light_v0_2.xlsx
```

## Un fișier pentru fiecare firmă

Fiecare firmă primește un cod în `01_FIRMA` (EQ-0001, EQ-0002…) și un fișier propriu,
numit `EQUIL_<cod>_<NumeFirma>_<AAAA-LL>.xlsx`. Șablonul curat rămâne nemodificat.
