# -*- coding: utf-8 -*-
"""Test pentru EQUIL Light: construieste o versiune mica, o populeaza cu date
de firma reala (aprox. 100.000 EUR / an) si verifica valorile calculate.

Ruleaza: python3 tools/test_light.py
"""
import datetime as dt
import os
import subprocess
import sys

MIC = dict(N_VANZARI="40", N_CLIENTI="8", N_PLAN="5", OUT="/tmp/light_test.xlsx")
subprocess.run([sys.executable, "tools/build_equil_light.py"], env=dict(os.environ, **MIC), check=True)

import openpyxl
path = MIC["OUT"]
wb = openpyxl.load_workbook(path)
R0 = 5

CUR = (dt.date(2026, 1, 1), dt.date(2026, 6, 30))
CMP = (dt.date(2025, 1, 1), dt.date(2025, 6, 30))
TINTA = 260000

# firma de servicii: 6 clienti, ~500.000 lei pe an
clienti = [
    ("Panificatie Mureș SRL", "Client mare", dt.date(2021, 5, 1), 9, "Livrați mereu la timp", dt.date(2026, 6, 15), ""),
    ("Hotel Ceahlău SRL", "Client mediu", dt.date(2023, 2, 1), 5, "Ne-ați schimbat prețul fără să anunțați", dt.date(2026, 6, 15), ""),
    ("Cofetăria Ana", "Client mic", dt.date(2024, 9, 1), 10, "Foarte mulțumiți", dt.date(2026, 6, 16), ""),
    ("Restaurant Bulevard", "Client mediu", dt.date(2022, 3, 1), 8, "Ok, dar putea fi mai ieftin", dt.date(2026, 6, 16), ""),
    ("Pensiunea Bradul", "Client mic", dt.date(2023, 7, 1), None, "", None, "Nu am apucat să-l sun"),
    ("Magazin Universal SRL", "Ocazional", dt.date(2022, 1, 1), None, "", None, ""),
]
# (data, client, ce, cantitate, incasat, cost)
V = [
    # perioada comparativa: ian-iun 2025
    (dt.date(2025, 2, 28), "Panificatie Mureș SRL", "Contract mentenanță", 1, 42000, 25000),
    (dt.date(2025, 3, 31), "Hotel Ceahlău SRL", "Contract mentenanță", 1, 36000, 21000),
    (dt.date(2025, 4, 30), "Restaurant Bulevard", "Reparație echipament", 3, 9000, 6000),
    (dt.date(2025, 5, 31), "Magazin Universal SRL", "Reparație echipament", 2, 7000, 4800),
    (dt.date(2025, 6, 30), "Cofetăria Ana", "Contract mentenanță", 1, 12000, 7000),
    (dt.date(2025, 6, 30), "Pensiunea Bradul", "Reparație echipament", 1, 4000, 2600),
    # perioada curenta: ian-iun 2026
    (dt.date(2026, 1, 31), "Panificatie Mureș SRL", "Contract mentenanță", 1, 48000, 27000),
    (dt.date(2026, 2, 28), "Hotel Ceahlău SRL", "Contract mentenanță", 1, 22000, 16000),
    (dt.date(2026, 3, 31), "Cofetăria Ana", "Contract mentenanță", 1, 15000, 8000),
    (dt.date(2026, 4, 30), "Restaurant Bulevard", "Reparație echipament", 4, 11000, 7200),
    (dt.date(2026, 5, 31), "Cofetăria Ana", "Piese schimb", 5, 3000, 2100),
    (dt.date(2026, 6, 30), "Panificatie Mureș SRL", "Reparație echipament", 2, 6000, 3500),
]

ws = wb["11_CLIENTI"]
for r in range(R0, ws.max_row + 1):
    for c in range(1, ws.max_column + 1):
        v = ws.cell(row=r, column=c).value
        if isinstance(v, str) and not v.startswith("="):
            ws.cell(row=r, column=c, value=None)
for i, row in enumerate(clienti):
    for j, v in enumerate(row, start=1):
        ws.cell(row=R0 + i, column=j, value=v)

ws = wb["10_VANZARI"]
for r in range(R0, ws.max_row + 1):
    for c in (1, 2, 3, 4, 5, 6, 10):
        v = ws.cell(row=r, column=c).value
        if not (isinstance(v, str) and v.startswith("=")):
            ws.cell(row=r, column=c, value=None)
for i, (d, cl, ce, q, inc, cost) in enumerate(V):
    for j, v in enumerate((d, cl, ce, q, inc, cost), start=1):
        ws.cell(row=R0 + i, column=j, value=v)

wb["02_SETARI"]["B12"] = TINTA
wb.save(path)

# --------------------------------------------------- asteptari, calculate in Python
cur = [v for v in V if CUR[0] <= v[0] <= CUR[1]]
cmpp = [v for v in V if CMP[0] <= v[0] <= CMP[1]]
inc = lambda rows: sum(r[4] for r in rows)
prof = lambda rows: sum(r[4] - r[5] for r in rows)
note = [c[3] for c in clienti if c[3] is not None]
promotori = sum(1 for n in note if n >= 9)
detractori = sum(1 for n in note if n <= 6)

AST = {
    "Încasat (fără TVA)": (inc(cur), inc(cmpp)),
    "Profit brut": (prof(cur), prof(cmpp)),
    "Marjă": (prof(cur) / inc(cur), prof(cmpp) / inc(cmpp)),
    "Clienți care au cumpărat": (len({r[1] for r in cur}), len({r[1] for r in cmpp})),
    "Număr de facturi": (len(cur), len(cmpp)),
    "Nota medie (NPS)": ((promotori - detractori) / len(note) * 100, None),
    "Clienți întrebați": (len(note), None),
    "Cât își propunea să vândă": (TINTA, None),
    "Cât mai lipsește": (max(0, TINTA - inc(cur)), None),
}

wb2 = openpyxl.load_workbook(path)
for w in wb2.worksheets:
    for row in w.iter_rows():
        for c in row:
            if isinstance(c.value, str) and c.value.startswith("="):
                c.value = c.value.replace("[", "(").replace("]", ")")
    w.data_validations.dataValidation = []
ascii_path = path.replace(".xlsx", "_a.xlsx")
wb2.save(ascii_path)

print("\n== Se calculeaza (motorul 'formulas') ==")
import formulas
sol = formulas.ExcelModel().loads(ascii_path).finish().calculate()
BOOK = os.path.basename(ascii_path)
val = lambda sh, cell: sol[f"'[{BOOK}]{sh}'!{cell}"].value[0, 0]

rez = wb["20_REZULTATE"]
randuri = {rez.cell(row=r, column=1).value: r for r in range(6, rez.max_row + 1)}
ok = bad = 0
print("\n%-30s %14s %14s %14s" % ("Indicator", "Excel", "Așteptat", "Comparativ"))
for nume, (ec, ep) in AST.items():
    r = randuri[nume]
    g, gc = val("20_REZULTATE", f"B{r}"), val("20_REZULTATE", f"C{r}")
    bun = abs(float(g) - float(ec)) < 0.01
    if ep is not None:
        bun = bun and abs(float(gc) - float(ep)) < 0.01
    ok, bad = (ok + 1, bad) if bun else (ok, bad + 1)
    print("%-30s %14s %14s %14s  %s" % (nume, g, ec, gc, "OK" if bun else "<<< DIFERIT"))

print("\n== Ce spun cifrele ==")
for r in range(randuri["Cât mai lipsește"] + 2, rez.max_row + 1):
    v = val("20_REZULTATE", f"A{r}")
    if isinstance(v, str) and len(v) > 20:
        print("  •", v)

print("\n== Ce se întâmplă cu fiecare client ==")
for i in range(len(clienti)):
    r = R0 + i
    print("  %-24s încasat=%-8s Δ=%-8s notă=%-4s → %-18s %s" % (
        val("21_CE_SE_INTAMPLA", f"A{r}"), val("21_CE_SE_INTAMPLA", f"C{r}"),
        val("21_CE_SE_INTAMPLA", f"E{r}"), val("21_CE_SE_INTAMPLA", f"K{r}"),
        val("21_CE_SE_INTAMPLA", f"L{r}"), str(val("21_CE_SE_INTAMPLA", f"M{r}"))[:64]))

print("\n== Grafice: top clienți ==")
for i in range(1, 5):
    print("   ", val("40_GRAFICE", f"F{40+i}"), val("40_GRAFICE", f"G{40+i}"))
print("== Grafice: note ==")
for i in range(1, 4):
    print("   ", val("40_GRAFICE", f"I{40+i}"), val("40_GRAFICE", f"J{40+i}"))

print(f"\nRezultat: {ok} corecți, {bad} diferiți.")
sys.exit(1 if bad else 0)
