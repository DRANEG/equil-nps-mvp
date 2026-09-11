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
| `tools/test_workbook.py` | Test automat pentru varianta completă |
| `tools/test_light.py` | Test automat pentru varianta Light |
| `tools/audit_formulas.py` | Audit static: paranteze, referințe, funcții incompatibile cu Excel 2016 |
| `tools/glosar.py` | Cei 66 de termeni din foaia `04_DICTIONAR` |
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
python3 tools/test_workbook.py            # verifică valorile calculate pe date de test
python3 tools/test_light.py               # același test, pentru varianta Light
```

## Structura workbook-ului (20 de foi)

**Colectare de date — cine dă ce**
- `00_GHID` — mod de lucru, cod de culori, setul minim viabil, reguli de igienă a datelor
- `01_FIRMA` — profilul firmei, completat la kickoff
- `02_CONTACTE` — data owners: ce set de date deține fiecare om din firmă, cu termen și status
- `03_CHECKLIST_DATE` — fiecare câmp cerut: ce înseamnă, format, exemplu, din ce sistem se scoate,
  ce rol îl poate da, ce KPI deblochează, status și dată de primire; are și un contor de progres
- `04_DICTIONAR` — 66 de termeni (NDA, ERP, CRM, COGS, FTE, NPS…) explicați, fiecare cu formularea
  pe care o poți folosi direct în discuția cu clientul

**Control**
- `09_PARAMETRI` — perioada analizată, perioada de comparație și toate pragurile de semnal

**Date de intrare**
- `10_CLIENTI`, `11_PRODUSE`, `12_OAMENI` — nomenclatoare
- `13_VANZARI` — tranzacții (faptic)
- `14_TINTE` — ținte pe companie / persoană / produs / client
- `15_NPS` — răspunsuri NPS cu respondent, motiv, temă și follow-up

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

`00_START` · `01_FIRMA` · `02_SETARI` · `10_VANZARI` · `11_CLIENTI` · `20_REZULTATE` ·
`21_CE_SE_INTAMPLA` · `30_PLAN` · `40_GRAFICE`

Datele din Light sunt un subset al celor din varianta completă, deci trecerea înseamnă copiere de
coloane, nu reluare de la zero.

## Un fișier pentru fiecare firmă

Fiecare firmă primește un cod în `01_FIRMA` (EQ-0001, EQ-0002…) și un fișier propriu,
numit `EQUIL_<cod>_<NumeFirma>_<AAAA-LL>.xlsx`. Șablonul curat rămâne nemodificat.
