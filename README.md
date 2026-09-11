# equil-nps-mvp

Pachetul EQUIL Growth Intelligence: un workbook Excel care transformă datele brute
ale unei firme în KPI, semnale de risc și oportunități de creștere prioritizate.

## Ce e în repo

| Cale | Ce conține |
|---|---|
| `dist/EQUIL_Growth_Intelligence_v0_2.xlsx` | Fișierul de lucru, gata de folosit |
| `tools/build_equil_workbook.py` | Generatorul fișierului (sursa adevărului) |
| `tools/test_workbook.py` | Test automat: construiește o versiune mică, o populează cu date și verifică valorile calculate |

Fișierul nu se editează structural direct în Excel — se modifică generatorul și se
regenerează, ca să nu se piardă modificările:

```bash
pip install openpyxl
python3 tools/build_equil_workbook.py     # -> dist/EQUIL_Growth_Intelligence_v0_2.xlsx
pip install formulas                      # doar pentru test
python3 tools/test_workbook.py            # verifică formulele pe date de test
```

## Structura workbook-ului (18 foi)

**Colectare de date — cine dă ce**
- `00_GHID` — mod de lucru, cod de culori, setul minim viabil, reguli de igienă a datelor
- `01_FIRMA` — profilul firmei, completat la kickoff
- `02_CONTACTE` — data owners: ce set de date deține fiecare om din firmă, cu termen și status
- `03_CHECKLIST_DATE` — fiecare câmp cerut: ce înseamnă, format, exemplu, din ce sistem se scoate,
  ce rol îl poate da, ce KPI deblochează, status și dată de primire; are și un contor de progres

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
- `40_RAPORT` — structura pentru clientul final, populată automat
- `90_LISTE` — listele pentru validările de tip dropdown

## Compatibilitate

Fără funcții dinamice (`UNIQUE`, `FILTER`, `LET`, `IFS`, `MAXIFS`). Funcționează în
Excel 2016+, Microsoft 365, LibreOffice Calc și Google Sheets.
