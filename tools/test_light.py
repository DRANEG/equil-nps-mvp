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


# --- piata si perceptie ---------------------------------------------------
CONCURENTI = [
    # cine, site, angajati, cifra, sursa, nota, recenzii, verificat, pret, castiga, pierde
    ("NOI (firma analizată)", "instalatii-mures.ro", 4, 210000, "Date publice / bilanț", 4.1, 23,
     dt.date(2026, 6, 20), "La fel", "Răspunde repede la urgențe", "Nu are ofertă scrisă"),
    ("Termo Instal SRL", "termoinstal.ro", 11, 640000, "Date publice / bilanț", 4.7, 186,
     dt.date(2026, 6, 20), "Mai scump", "Garanție 5 ani, contract clar", "Programare la 2 săptămâni"),
    ("Clima Expert SRL", "climaexpert.ro", 6, 380000, "Date publice / bilanț", 4.4, 71,
     dt.date(2026, 6, 20), "Mai ieftin", "Preț bun la montaj", "Reclamații pe termene"),
    ("Instal Rapid", "", 2, 90000, "Estimare proprie", 3.6, 12,
     dt.date(2026, 6, 20), "Mult mai ieftin", "Vine în aceeași zi", "Lucrări refăcute des"),
]
wsc = wb["12_CONCURENTA"]
col_c = {wsc.cell(row=4, column=j).value: j for j in range(1, wsc.max_column + 1)}
for i, row in enumerate(CONCURENTI):
    rr = R0 + i
    for camp, v in zip(["Cine", "Site", "Angajați", "Cifră de afaceri", "De unde e cifra",
                        "Notă publică (1-5)", "Câte recenzii", "Verificat la data",
                        "Preț față de noi", "Cu ce câștigă", "Unde pierde"], row):
        wsc.cell(row=rr, column=col_c[camp], value=v)

wsp = wb["13_CE_CRED_OAMENII"]
# recenzii publice: Google + Facebook
for i, (sursa, nota, nr, neg) in enumerate([("Google", 4.1, 23, 3), ("Facebook", 4.5, 8, 0)]):
    rr = 6 + i
    wsp.cell(row=rr, column=1, value=sursa)
    wsp.cell(row=rr, column=4, value=nota)
    wsp.cell(row=rr, column=5, value=nr)
    wsp.cell(row=rr, column=6, value=neg)
# evaluarea specialistului: 10 note
NOTE_SPEC = [3, 2, 5, 4, 3, 4, 2, 2, 3, 3]
dim_first = 15
for i, n in enumerate(NOTE_SPEC):
    wsp.cell(row=dim_first + i, column=2, value=n)


# --- istoric financiar pe trei ani (cifre de tip bilanț) ------------------
wsf = wb["01_FIRMA"]
rand_ani = next(r for r in range(1, wsf.max_row + 1) if wsf.cell(row=r, column=1).value == "An")
ISTORIC_DATE = {
    "Cifră de afaceri": (405000, 468000, 512000),
    "Profit brut":      (109000, 117000, 108000),
    "Profit net":       (91000, 98000, 89000),
    "Număr angajați":   (3, 4, 4),
}
for eticheta, valori in ISTORIC_DATE.items():
    rr = next(r for r in range(rand_ani, rand_ani + 8) if wsf.cell(row=r, column=1).value == eticheta)
    for k, v in enumerate(valori):
        wsf.cell(row=rr, column=2 + k, value=v)

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




# ---- verificare completă a foii 21, coloană cu coloană ------------------
print("\n== 21_CE_SE_INTAMPLA: toate coloanele calculate ==")


def _venit(f, client=None):
    return sum(r[4] for r in V
               if f[0] <= r[0] <= f[1] and (client is None or r[1] == client))


def _profit(f, client=None):
    return sum(r[4] - r[5] for r in V
               if f[0] <= r[0] <= f[1] and (client is None or r[1] == client))


def _ultima(client):
    d = [r[0] for r in V if r[1] == client and r[4] > 0]
    return max(d) if d else None


gresite_21 = 0
for i, cl in enumerate(clienti):
    r = R0 + i
    nume = cl[0]
    vc, vp = _venit(CUR, nume), _venit(CMP, nume)
    pb = _profit(CUR, nume)
    ua = _ultima(nume)
    astept = {
        "C": vc,
        "D": vp,
        "E": "" if vp == 0 else (vc - vp) / abs(vp),
        "F": pb,
        "G": pb / vc if vc else "",
        "H": vc / _venit(CUR),
        "J": (CUR[1] - ua).days if ua else "",
        "K": cl[3] if cl[3] is not None else "",
    }
    for col, a in astept.items():
        g = val("21_CE_SE_INTAMPLA", f"{col}{r}")
        if isinstance(a, str):
            potrivit = g in (None, "", 0) if a == "" else str(g) == a
        else:
            try:
                potrivit = abs(float(g) - float(a)) < 0.01
            except (TypeError, ValueError):
                potrivit = False
        if not potrivit:
            gresite_21 += 1
            print(f"   DIFERIT {nume} col {col}: Excel={g!r} așteptat={a!r}")
print(f"   {len(clienti) * 8 - gresite_21} din {len(clienti) * 8} valori corecte")

print("\n== Istoric financiar (01_FIRMA) ==")
wsf2 = wb["01_FIRMA"]
ra = next(r for r in range(1, wsf2.max_row + 1) if wsf2.cell(row=r, column=1).value == "An")
def _v(sh, cell):
    try:
        return val(sh, cell)
    except KeyError:
        return ""

for rr in range(ra, ra + 10):
    et = wsf2.cell(row=rr, column=1).value
    if not et or et == "Sursa cifrelor":
        continue
    vals = [_v("01_FIRMA", f"{c}{rr}") for c in "BCD"]
    print("   %-28s %-12s %-12s %-12s" % (str(et)[:28], *[str(v)[:12] for v in vals]))
rc = next(r for r in range(ra, ra + 14) if wsf2.cell(row=r, column=1).value == "Ce se vede")
print("\n   »", val("01_FIRMA", f"B{rc}"))

print("\n== Piață și percepție ==")
wsc2 = wb["12_CONCURENTA"]
cc = {wsc2.cell(row=4, column=j).value: j for j in range(1, wsc2.max_column + 1)}
from openpyxl.utils import get_column_letter as GL
for i in range(4):
    rr = R0 + i
    print("  %-24s cotă=%-8s %s" % (
        val("12_CONCURENTA", f"{GL(cc['Cine'])}{rr}"),
        val("12_CONCURENTA", f"{GL(cc['Cotă în grup'])}{rr}"),
        val("12_CONCURENTA", f"{GL(cc['Cum stăm față de el'])}{rr}")))
sc = next(j for j in range(1, wsc2.max_column + 1)
          if wsc2.cell(row=4, column=j).value == "CUM ARATĂ PIAȚA")
print("  --- panou ---")
for k, eticheta in enumerate(["Concurenți urmăriți", "Cifra totală a grupului", "Cota noastră în grup",
                              "Piața totală estimată", "Cota noastră din piață", "Nota noastră publică",
                              "Nota medie a concurenților", "Diferența"], start=1):
    print("   %-28s %s" % (eticheta, val("12_CONCURENTA", f"{GL(sc+1)}{4+k}")))

print("\n== Scorul de percepție (13_CE_CRED_OAMENII) ==")
wsp2 = wb["13_CE_CRED_OAMENII"]
for rr in range(26, 45):
    et = wsp2.cell(row=rr, column=1).value
    if et and not str(et).startswith(("3.", "4.")):
        v = val("13_CE_CRED_OAMENII", f"B{rr}")
        if v not in (None, ""):
            print("   %-34s %s" % (str(et)[:34], v))

print("\n== Grafice: top clienți ==")
for i in range(1, 5):
    print("   ", val("40_GRAFICE", f"F{40+i}"), val("40_GRAFICE", f"G{40+i}"))
print("== Grafice: note ==")
for i in range(1, 4):
    print("   ", val("40_GRAFICE", f"I{40+i}"), val("40_GRAFICE", f"J{40+i}"))

print(f"\nRezultat: {ok} corecți, {bad} diferiți.")
sys.exit(1 if bad else 0)
