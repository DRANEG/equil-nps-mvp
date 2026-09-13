# -*- coding: utf-8 -*-
"""
EQUIL Light — varianta pentru firme mici (sub ~10 angajati, sub ~500.000 lei / an).

Diferenta fata de versiunea completa nu e "mai putine functii", ci mai putine
lucruri de completat: fara coduri de produs, fara ID-uri, fara tinte pe om,
fara foaie separata de NPS. Clientul se identifica prin nume, ales din lista.

Ruleaza: python3 tools/build_equil_light.py
Rezultat: dist/EQUIL_Light_v0_2.xlsx
"""
import datetime as dt
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from openpyxl import Workbook
from openpyxl.chart import BarChart, Reference
from openpyxl.chart.data_source import StrRef
from openpyxl.chart.label import DataLabelList
from openpyxl.chart.series import DataPoint
from openpyxl.chart.shapes import GraphicalProperties
from openpyxl.drawing.line import LineProperties
from openpyxl.comments import Comment
from openpyxl.formatting.rule import CellIsRule
from openpyxl.styles import Alignment, Font, PatternFill
from openpyxl.utils import get_column_letter

from istoric import adauga_istoric
from piata import adauga_concurenta, adauga_perceptie
from stil import (verifica, INK, TEAL, TEAL_LIGHT, INPUT_FILL, CALC_FILL, WHITE, GREY_TXT,
                  C_SER1, C_SER2, C_GOOD, C_WARN, C_BAD,
                  F_MONEY, F_PCT, F_PCT2, F_DATE, F_NUM, F_INT, BORDER,
                  style_header, title_block, label_value, add_dv, ym, ymd, mon, pct)

N_VANZARI = int(os.environ.get("N_VANZARI", 600))
N_CLIENTI = int(os.environ.get("N_CLIENTI", 120))
N_PLAN = int(os.environ.get("N_PLAN", 12))
OUT = os.environ.get("OUT", "dist/EQUIL_Light_v0_2.xlsx")

HR = 4                 # randul de antet in foile tabelare
R0 = HR + 1            # primul rand de date

wb = Workbook()
wb.remove(wb.active)
wb.calculation.fullCalcOnLoad = True


def tabel(ws, coloane, n_randuri, calc_cols=(), inaltime=34):
    """Antet + grila de randuri. coloane: (titlu, latime, format, ajutor)."""
    for j, (t, w, fmt, ajutor) in enumerate(coloane, start=1):
        c = ws.cell(row=HR, column=j, value=t)
        ws.column_dimensions[get_column_letter(j)].width = w
        if ajutor:
            c.comment = Comment(f"{t}\n\n{ajutor}", "EQUIL")
    style_header(ws, HR, len(coloane), height=inaltime)
    last = HR + n_randuri
    for j, (t, w, fmt, _a) in enumerate(coloane, start=1):
        este_calc = j in calc_cols
        for rr in range(R0, last + 1):
            cell = ws.cell(row=rr, column=j)
            cell.fill = PatternFill("solid", fgColor=CALC_FILL if este_calc else INPUT_FILL)
            cell.border = BORDER
            cell.font = Font(size=10, color=GREY_TXT if este_calc else "000000")
            if fmt:
                cell.number_format = fmt
    ws.freeze_panes = f"B{R0}"
    ws.auto_filter.ref = f"A{HR}:{get_column_letter(len(coloane))}{last}"
    ws.sheet_view.showGridLines = False
    return last


def umple(ws, col, formula, last, fmt=None):
    for rr in range(R0, last + 1):
        c = ws.cell(row=rr, column=col, value=formula.format(r=rr))
        if fmt:
            c.number_format = fmt


# ================================================================ 02_SETARI
# (se construieste prima, ca sa avem referintele la parametri)
ws_set = wb.create_sheet("02_SETARI")
title_block(ws_set, "02 — SETĂRI",
            "Cinci lucruri de stabilit o singură dată. Tot fișierul se recalculează din ele.")
ws_set.column_dimensions["A"].width = 36
ws_set.column_dimensions["B"].width = 16
ws_set.column_dimensions["C"].width = 68


def sectiune(ws, r, text, ncol=3):
    ws.cell(row=r, column=1, value=text).font = Font(bold=True, size=11, color=WHITE)
    for k in range(1, ncol + 1):
        ws.cell(row=r, column=k).fill = PatternFill("solid", fgColor=TEAL)
    ws.row_dimensions[r].height = 20


sectiune(ws_set, 4, "PERIOADA")
label_value(ws_set, 5, "Analizez de la", dt.date(2026, 1, 1), "Prima zi a perioadei.", F_DATE)
label_value(ws_set, 6, "Analizez până la", dt.date(2026, 6, 30), "Ultima zi a perioadei.", F_DATE)
label_value(ws_set, 7, "Compar cu — de la", dt.date(2025, 1, 1),
            "De obicei aceeași perioadă de anul trecut. Dacă firma e prea nouă, lasă perioada anterioară.", F_DATE)
label_value(ws_set, 8, "Compar cu — până la", dt.date(2025, 6, 30), "", F_DATE)
label_value(ws_set, 9, "Monedă", "RON", "Toate sumele din fișier trebuie să fie în aceeași monedă.")

sectiune(ws_set, 11, "OBIECTIV")
label_value(ws_set, 12, "Cât își propune să vândă în perioadă", 0,
            "Un singur număr. Dacă nu are un buget, întreabă-l „cât ți-ai dori?” și scrie cifra aceea.", F_MONEY)

sectiune(ws_set, 14, "PRAGURI (le poți lăsa așa)")
label_value(ws_set, 15, "Scădere care mă îngrijorează", -0.15,
            "Sub această variație față de perioada comparativă, clientul apare ca „a scăzut”.", F_PCT)
label_value(ws_set, 16, "Marjă normală în domeniu", 0.30,
            "Sub ea, apare semnalul de marjă mică. Întreabă-l pe client cât e normal la el.", F_PCT)
label_value(ws_set, 17, "Zile fără comandă = client adormit", 90,
            "Pentru servicii recurente, pune mai puțin. Pentru vânzări rare, mai mult.", F_INT)
label_value(ws_set, 18, "Sub ce notă e client nemulțumit", 6,
            "Pe scara 0-10. Nota 6 sau mai mică înseamnă nemulțumit.", F_INT)
label_value(ws_set, 19, "Data de referință", "=IF($B$6=\"\",TODAY(),$B$6)",
            "Față de ea se numără zilele fără comandă. Implicit, ultima zi a perioadei.",
            F_DATE, input_cell=False)

# liste pentru validari, tinute in marginea foii
LISTE = {"E": ("Segment", ["Client mare", "Client mediu", "Client mic", "Ocazional"]),
         "F": ("Status plan", ["De făcut", "În lucru", "Gata", "Renunțat"]),
         "G": ("Ușurință", []), "H": ("Monedă", ["RON", "EUR", "USD"])}
ws_set.cell(row=HR, column=5, value="— liste (nu se șterg) —").font = Font(size=9, italic=True, color=GREY_TXT)
for col, (nume, valori) in LISTE.items():
    if not valori:
        continue
    j = ord(col) - 64
    ws_set.cell(row=R0, column=j, value=nume).font = Font(size=9, bold=True, color=GREY_TXT)
    ws_set.column_dimensions[col].width = 15
    for i, v in enumerate(valori, start=1):
        ws_set.cell(row=R0 + i, column=j, value=v).font = Font(size=9, color=GREY_TXT)


def lista(col, valori):
    j = ord(col) - 64
    L = get_column_letter(j)
    return f"'02_SETARI'!${L}${R0+1}:${L}${R0+len(valori)}"


L_SEGMENT = lista("E", LISTE["E"][1])
L_STATUS = lista("F", LISTE["F"][1])
add_dv(ws_set, lista("H", LISTE["H"][1]), "B9")

S = lambda row: f"'02_SETARI'!$B${row}"
P_DE_LA, P_PANA, P_CMP_DE_LA, P_CMP_PANA = S(5), S(6), S(7), S(8)
P_MONEDA, P_TINTA = S(9), S(12)
P_SCADERE, P_MARJA, P_ZILE, P_NOTA, P_AZI = S(15), S(16), S(17), S(18), S(19)

# ================================================================ 11_CLIENTI
ws_cl = wb.create_sheet("11_CLIENTI")
title_block(ws_cl, "11 — CLIENȚII",
            "Lista clienților. Se scrie o dată, la început. Nota din coloana D se ia sunându-i — "
            "pentru o firmă mică e realist să-i întrebi pe toți.")
COL_CLIENTI = [
    ("Client", 30, None, "Numele clientului, exact cum îl scrii și în foaia de vânzări. "
                         "Scrie-l o singură dată aici; în 10_VANZARI îl alegi din listă."),
    ("Segment", 15, None, "Cât de important e: Client mare / mediu / mic / Ocazional."),
    ("Client din", 13, F_DATE, "Când a cumpărat prima dată. Dacă nu știi exact, aproximează anul."),
    ("Notă 0-10", 11, F_INT, "„Pe o scară de la 0 la 10, cât de probabil ne-ați recomanda unui prieten?” "
                             "Asta e tot. O întrebare, la telefon."),
    ("Ce a spus", 42, None, "Motivul notei, cu cuvintele lui. Aici stă informația cea mai valoroasă din tot fișierul."),
    ("Data întrebării", 14, F_DATE, "Când l-ai întrebat."),
    ("Observații", 28, None, "Orice context util: cine decide, ce contract are, ce probleme știi."),
]
LAST_CL = tabel(ws_cl, COL_CLIENTI, N_CLIENTI)
add_dv(ws_cl, L_SEGMENT, f"B{R0}:B{LAST_CL}")
ws_cl.cell(row=R0, column=1, value="Exemplu SRL")
ws_cl.cell(row=R0, column=2, value="Client mare")
ws_cl.cell(row=R0, column=5, value="Exemplu — șterge rândul înainte de utilizare")

CL_NUME = f"'11_CLIENTI'!$A${R0}:$A${LAST_CL}"
CL_SEG = f"'11_CLIENTI'!$B${R0}:$B${LAST_CL}"
CL_NOTA = f"'11_CLIENTI'!$D${R0}:$D${LAST_CL}"

# ================================================================ 10_VANZARI
ws_v = wb.create_sheet("10_VANZARI")
title_block(ws_v, "10 — VÂNZĂRI",
            "Singura foaie în care intră volum de date. O linie = o factură (sau o lună, dacă "
            "facturezi lunar același lucru). Coloanele gri se calculează singure.")
COL_VANZARI = [
    ("Data", 12, F_DATE, "Data facturii. Dacă lucrezi pe luni, pune ultima zi a lunii."),
    ("Client", 28, None, "Se alege din lista din 11_CLIENTI. Dacă lipsește, adaugă-l acolo întâi."),
    ("Ce a cumpărat", 28, None, "Produsul sau serviciul, în cuvinte. Nu ai nevoie de coduri, "
                                "dar scrie-l la fel de fiecare dată."),
    ("Cantitate", 11, F_NUM, "Bucăți, ore, luni de abonament. Poate rămâne gol."),
    ("Încasat (fără TVA)", 15, F_MONEY, "Cât a plătit, fără TVA și după discount. Aceasta e cifra care contează."),
    ("Cât te-a costat", 15, F_MONEY, "Costul direct: marfa, materialul, ora plătită altcuiva. "
                                     "NU chiria și nu salariile administrative."),
    ("Profit brut", 13, F_MONEY, "Calculat automat: încasat minus cost."),
    ("Marjă", 10, F_PCT, "Calculat automat: profit brut împărțit la încasat."),
    ("Lună", 10, None, "Calculat automat, pentru grafice."),
    ("Observații", 24, None, "Orice notă pe linia respectivă."),
]
LAST_V = tabel(ws_v, COL_VANZARI, N_VANZARI, calc_cols=(7, 8, 9))
umple(ws_v, 7, '=IF($E{r}="","",$E{r}-N($F{r}))', LAST_V, F_MONEY)
umple(ws_v, 8, '=IFERROR($G{r}/$E{r},"")', LAST_V, F_PCT)
umple(ws_v, 9, '=IF($A{r}="","",' + ym("$A{r}") + ')', LAST_V)
add_dv(ws_v, CL_NUME, f"B{R0}:B{LAST_V}")
ws_v.cell(row=R0, column=1, value=dt.date(2026, 1, 31))
ws_v.cell(row=R0, column=2, value="Exemplu SRL")
ws_v.cell(row=R0, column=3, value="Exemplu — șterge rândul")
ws_v.cell(row=R0, column=5, value=1000)
ws_v.cell(row=R0, column=6, value=600)

V_DATA = f"'10_VANZARI'!$A${R0}:$A${LAST_V}"
V_CLIENT = f"'10_VANZARI'!$B${R0}:$B${LAST_V}"
V_VENIT = f"'10_VANZARI'!$E${R0}:$E${LAST_V}"
V_COST = f"'10_VANZARI'!$F${R0}:$F${LAST_V}"
V_PROFIT = f"'10_VANZARI'!$G${R0}:$G${LAST_V}"


def win(a, b):
    return f'{V_DATA},">="&{a},{V_DATA},"<="&{b}'


def sum_in(camp, a, b, extra=""):
    return f'SUMIFS({camp},{win(a, b)}{extra})'


A, B = P_DE_LA, P_PANA
CA, CB = P_CMP_DE_LA, P_CMP_PANA

f_venit = lambda a, b: sum_in(V_VENIT, a, b)
f_profit = lambda a, b: sum_in(V_PROFIT, a, b)
f_linii = lambda a, b: f'SUMPRODUCT(({V_DATA}>={a})*({V_DATA}<={b})*({V_VENIT}<>""))'
f_activi = lambda a, b: (f'SUMPRODUCT(({CL_NUME}<>"")*'
                         f'(SUMIFS({V_VENIT},{V_CLIENT},{CL_NUME},{win(a, b)})<>0))')
f_top1 = lambda a, b: (f'SUMPRODUCT(MAX(({CL_NUME}<>"")*'
                       f'SUMIFS({V_VENIT},{V_CLIENT},{CL_NUME},{win(a, b)})))')
f_intrebati = f'SUMPRODUCT(({CL_NUME}<>"")*({CL_NOTA}<>""))'
f_promotori = f'SUMPRODUCT(({CL_NUME}<>"")*({CL_NOTA}>=9))'
f_detractori = f'SUMPRODUCT(({CL_NUME}<>"")*({CL_NOTA}<>"")*({CL_NOTA}<=6))'
f_pasivi = f'SUMPRODUCT(({CL_NUME}<>"")*({CL_NOTA}>=7)*({CL_NOTA}<=8))'
f_nps = f'IFERROR((({f_promotori})-({f_detractori}))/({f_intrebati})*100,"")'

# ================================================================ 12 / 13 — piata
CONC = adauga_concurenta(wb, "12_CONCURENTA", n_randuri=10, light=True)
PERC = adauga_perceptie(wb, "13_CE_CRED_OAMENII", CONC,
                        nps_scor=f_nps, nps_nr=f_intrebati, light=True)

# ================================================================ 20_REZULTATE
ws_r = wb.create_sheet("20_REZULTATE")
title_block(ws_r, "20 — REZULTATE",
            "Se completează singură. Nu scrie nimic aici.")
for col, w in zip("ABCDE", (32, 16, 16, 13, 58)):
    ws_r.column_dimensions[col].width = w

sectiune(ws_r, 4, "CIFRELE", 5)
ws_r.cell(row=5, column=1, value="Indicator")
ws_r.cell(row=5, column=2, value="Perioada asta")
ws_r.cell(row=5, column=3, value="Perioada comparată")
ws_r.cell(row=5, column=4, value="Diferență")
ws_r.cell(row=5, column=5, value="Ce înseamnă")
style_header(ws_r, 5, 5, height=24)

KPI = [
    ("Încasat (fără TVA)", f_venit, F_MONEY, "Câți bani au intrat din vânzări în perioadă."),
    ("Profit brut", f_profit, F_MONEY, "Ce rămâne după costurile directe, înainte de chirie și salarii."),
    ("Marjă", None, F_PCT, "Din fiecare 100 de lei încasați, atâția rămân ca profit brut."),
    ("Clienți care au cumpărat", f_activi, F_INT, "Câți clienți diferiți au cumpărat măcar o dată."),
    ("Încasat mediu pe client", None, F_MONEY, "Dacă scade, clienții cumpără mai puțin, chiar dacă sunt la fel de mulți."),
    ("Număr de facturi", f_linii, F_INT, "Cât de des cumpără clienții."),
    ("Valoare medie pe factură", None, F_MONEY, "Dacă scade, se vinde mai mărunt."),
    ("Cel mai mare client", None, F_PCT, "Cât din tot venitul vine de la un singur client. Peste 30%, e risc."),
    ("Nota medie (NPS)", None, F_PCT2, "De la −100 la +100. Peste 30 e bine, peste 50 e foarte bine."),
    ("Clienți întrebați", None, F_INT, "Câți clienți ți-au dat o notă. Sub 10, cifra e doar orientativă."),
    ("Cât își propunea să vândă", None, F_MONEY, "Din 02_SETARI."),
    ("Cât din obiectiv a atins", None, F_PCT, "Încasat împărțit la obiectiv."),
    ("Cât mai lipsește", None, F_MONEY, "Aici începe planul de acțiune."),
]
RAND = {}
r = 6
for nume, fn, fmt, expl in KPI:
    RAND[nume] = r
    ws_r.cell(row=r, column=1, value=nume).font = Font(bold=True, size=10, color=INK)
    if fn:
        ws_r.cell(row=r, column=2, value="=" + fn(A, B))
        ws_r.cell(row=r, column=3, value="=" + fn(CA, CB))
    e = ws_r.cell(row=r, column=5, value=expl)
    e.font = Font(size=9, color=GREY_TXT)
    e.alignment = Alignment(wrap_text=True, vertical="center")
    for k in (2, 3, 4):
        c = ws_r.cell(row=r, column=k)
        c.fill = PatternFill("solid", fgColor=CALC_FILL)
        c.border = BORDER
        c.number_format = fmt
        c.font = Font(size=10, bold=(k == 2), color=INK if k == 2 else GREY_TXT)
    ws_r.row_dimensions[r].height = 22
    r += 1
ULTIM_KPI = r - 1


def pune(nume, col, formula):
    ws_r.cell(row=RAND[nume], column=col, value=formula)


for col, (a, b) in ((2, (A, B)), (3, (CA, CB))):
    pune("Marjă", col, f'=IFERROR({f_profit(a, b)}/{f_venit(a, b)},0)')
    pune("Încasat mediu pe client", col, f'=IFERROR({f_venit(a, b)}/({f_activi(a, b)}),0)')
    pune("Valoare medie pe factură", col, f'=IFERROR({f_venit(a, b)}/({f_linii(a, b)}),0)')
    pune("Cel mai mare client", col, f'=IFERROR({f_top1(a, b)}/{f_venit(a, b)},0)')
pune("Nota medie (NPS)", 2, f'={f_nps}')
pune("Clienți întrebați", 2, f'={f_intrebati}')
pune("Cât își propunea să vândă", 2, f'={P_TINTA}')
pune("Cât din obiectiv a atins", 2, f'=IFERROR({f_venit(A, B)}/{P_TINTA},"")')
pune("Cât mai lipsește", 2, f'=IF({P_TINTA}=0,"",MAX(0,{P_TINTA}-{f_venit(A, B)}))')
for nume in ("Nota medie (NPS)", "Clienți întrebați", "Cât își propunea să vândă",
             "Cât din obiectiv a atins", "Cât mai lipsește"):
    ws_r.cell(row=RAND[nume], column=3, value="—").alignment = Alignment(horizontal="center")

for nume, rr in RAND.items():
    ws_r.cell(row=rr, column=4,
              value=f'=IFERROR(IF(OR(B{rr}="",C{rr}="",C{rr}="—"),"",B{rr}-C{rr}),"")')
ws_r.conditional_formatting.add(f"D6:D{ULTIM_KPI}",
                                CellIsRule(operator="lessThan", formula=["0"], font=Font(color="B02A37")))
ws_r.conditional_formatting.add(f"D6:D{ULTIM_KPI}",
                                CellIsRule(operator="greaterThan", formula=["0"], font=Font(color="1B7A3D")))

# --- concluzii
K = lambda nume: f"'20_REZULTATE'!$B${RAND[nume]}"
_v, _p, _m = K("Încasat (fără TVA)"), K("Profit brut"), K("Marjă")
_cl, _med, _top = K("Clienți care au cumpărat"), K("Încasat mediu pe client"), K("Cel mai mare client")
_nps, _intr = K("Nota medie (NPS)"), K("Clienți întrebați")
_tinta, _atins, _lipsa = K("Cât își propunea să vândă"), K("Cât din obiectiv a atins"), K("Cât mai lipsește")
_vc = f"'20_REZULTATE'!$C${RAND['Încasat (fără TVA)']}"

r += 1
sectiune(ws_r, r, "CE SPUN CIFRELE", 5); r += 1
CONCLUZII = [
    f'=IF({_v}=0,"Nu sunt vânzări în perioada aleasă. Verifică foaia 10_VANZARI și datele din 02_SETARI.",'
    f'"S-au încasat "&{mon(_v)}&" "&{P_MONEDA}&", din care "&{mon(_p)}&" profit brut (marjă '
    f'"&{pct(_m)}&")."&IF({_vc}=0,"",IF({_v}>={_vc}," Cu "&{pct(f"({_v}-{_vc})/{_vc}")}&" mai mult decât în perioada comparată.",'
    f'" Cu "&{pct(f"({_vc}-{_v})/{_vc}")}&" mai puțin decât în perioada comparată.")))',

    f'=IF({_v}=0,"—",IF({_m}<{P_MARJA},'
    f'"Marja e sub cât e normal în domeniu ("&{pct(P_MARJA)}&"). Fiecare procent recuperat la preț sau la cost înseamnă "'
    f'&{mon(f"{_v}*0.01")}&" "&{P_MONEDA}&" în plus, fără să vinzi nimic nou.",'
    f'"Marja e peste pragul pe care l-ai pus ("&{pct(P_MARJA)}&"). Se poate crește volumul fără grijă."))',

    f'=IF({_cl}=0,"—","Au cumpărat "&{mon(_cl)}&" clienți, în medie "&{mon(_med)}&" "&{P_MONEDA}&" fiecare. '
    f'Cel mai mare aduce "&{pct(_top)}&" din tot."&IF({_top}>0.3," Asta e mult: dacă pleacă el, pleacă și profitul anului.",""))',

    f'=IF({_intr}=0,"Niciun client nu are notă în 11_CLIENTI. Zece telefoane de câte două minute îți spun '
    f'mai multe decât toate cifrele de mai sus.",'
    f'"Nota medie e "&{mon(_nps)}&", din "&{mon(_intr)}&" clienți întrebați."&'
    f'IF({_intr}<10," Prea puțini ca să fie o concluzie — mai sună câțiva.",'
    f'IF({_nps}<30," Sub 30 înseamnă că relația scârțâie undeva; citește ce au spus.",'
    f'" Peste 30 e o relație sănătoasă; cere-le recomandări.")))',

    f'=IF({_tinta}=0,"Nu ai pus un obiectiv în 02_SETARI. Fără el nu știi dacă "&{mon(_v)}&" e mult sau puțin.",'
    f'IF({_lipsa}=0,"Obiectivul e atins. Următorul pas e să afli ce a funcționat, ca să repeți.",'
    f'"S-a atins "&{pct(_atins)}&" din obiectiv. Mai lipsesc "&{mon(_lipsa)}&" "&{P_MONEDA}&". '
    f'Uită-te în 21_CE_SE_INTAMPLA: de obicei suma asta se găsește la 3-4 clienți."))',

    f'=IF(AND({CONC["nr_concurenti"]}=0,{PERC["total_recenzii"]}=0),'
    f'"Nu ai completat încă nimic despre concurență și reputație (foile 12 și 13). '
    f'E cel mai ieftin context din tot fișierul: o oră pe internet, fără să întrebi pe nimeni.",'
    f'"Urmărim "&{mon(CONC["nr_concurenti"])}&" concurenți. "&'
    f'IF({CONC["nota_noastra"]}="","Firma nu are încă notă publică — verifică dacă are fișă Google Business. '
    f'Un client nou o caută acolo înainte să sune.",'
    f'"Nota publică e "&FIXED({CONC["nota_noastra"]},1)&" din 5"&'
    f'IF({CONC["nota_concurenti"]}="",".",", față de "&FIXED({CONC["nota_concurenti"]},1)&" media concurenților"&'
    f'IF({CONC["nota_noastra"]}>{CONC["nota_concurenti"]}+0.2," — stăm mai bine decât ei.",'
    f'IF({CONC["nota_noastra"]}<{CONC["nota_concurenti"]}-0.2," — stăm mai slab; asta se rezolvă înainte de a crește volumul.",'
    f'" — la fel ca ei."))))&'
    f'IF({f_intrebati}=0," NPS nu e măsurat încă: scorul de percepție din foaia 13 ține locul, dar nu îl înlocuiește.",""))',
]
for formula in CONCLUZII:
    ws_r.merge_cells(start_row=r, start_column=1, end_row=r, end_column=5)
    c = ws_r.cell(row=r, column=1, value=formula)
    c.fill = PatternFill("solid", fgColor=TEAL_LIGHT)
    c.border = BORDER
    c.font = Font(size=10, color="1A2E2E")
    c.alignment = Alignment(wrap_text=True, vertical="center")
    ws_r.row_dimensions[r].height = 32
    r += 1
ws_r.sheet_view.showGridLines = False

# ================================================================ 21_CE_SE_INTAMPLA
ws_a = wb.create_sheet("21_CE_SE_INTAMPLA")
title_block(ws_a, "21 — CE SE ÎNTÂMPLĂ CU FIECARE CLIENT",
            "Se completează singură din 10_VANZARI și 11_CLIENTI. Filtrează coloana „Ce se întâmplă” "
            "ca să vezi unde ai de lucru.")
COL_ANALIZA = [
    ("Client", 28, None), ("Segment", 14, None),
    ("Încasat acum", 14, F_MONEY), ("Încasat înainte", 14, F_MONEY), ("Diferență", 11, F_PCT),
    ("Profit brut", 13, F_MONEY), ("Marjă", 10, F_PCT), ("% din total", 11, F_PCT),
    ("Ultima comandă", 14, F_DATE), ("Zile de atunci", 12, F_INT), ("Notă", 9, F_INT),
    ("Ce se întâmplă", 24, None), ("Ce ai de făcut", 52, None), ("Cât poți recupera", 14, F_MONEY),
]
for j, (t, w, fmt) in enumerate(COL_ANALIZA, start=1):
    ws_a.cell(row=HR, column=j, value=t)
    ws_a.column_dimensions[get_column_letter(j)].width = w
style_header(ws_a, HR, len(COL_ANALIZA), height=30)
LAST_A = HR + N_CLIENTI
for rr in range(R0, LAST_A + 1):
    for j, (t, w, fmt) in enumerate(COL_ANALIZA, start=1):
        c = ws_a.cell(row=rr, column=j)
        c.fill = PatternFill("solid", fgColor=CALC_FILL)
        c.border = BORDER
        c.font = Font(size=10, color=GREY_TXT)
        c.alignment = Alignment(wrap_text=True, vertical="center")
        if fmt:
            c.number_format = fmt
ws_a.freeze_panes = f"B{R0}"
ws_a.auto_filter.ref = f"A{HR}:{get_column_letter(len(COL_ANALIZA))}{LAST_A}"
ws_a.sheet_view.showGridLines = False

sursa = f"'11_CLIENTI'!$A{{s}}"
FORMULE_A = {
    1: f'=IF({sursa}="","",{sursa})',
    2: f'=IF($A{{r}}="","",IFERROR(INDEX({CL_SEG},MATCH($A{{r}},{CL_NUME},0)),""))',
    3: f'=IF($A{{r}}="","",SUMIFS({V_VENIT},{V_CLIENT},$A{{r}},{win(A, B)}))',
    4: f'=IF($A{{r}}="","",SUMIFS({V_VENIT},{V_CLIENT},$A{{r}},{win(CA, CB)}))',
    5: '=IF($A{r}="","",IFERROR(IF($D{r}=0,"",($C{r}-$D{r})/ABS($D{r})),""))',
    6: f'=IF($A{{r}}="","",SUMIFS({V_PROFIT},{V_CLIENT},$A{{r}},{win(A, B)}))',
    7: '=IF($A{r}="","",IFERROR($F{r}/$C{r},""))',
    8: f'=IF($A{{r}}="","",IFERROR($C{{r}}/{f_venit(A, B)},""))',
    # Un storno (venit negativ) nu e o achiziție: nu trebuie să facă un client
    # adormit să pară activ.
    9: (f'=IF($A{{r}}="","",IFERROR(IF(SUMPRODUCT(MAX(({V_CLIENT}=$A{{r}})*({V_VENIT}>0)*{V_DATA}))=0,"",'
        f'SUMPRODUCT(MAX(({V_CLIENT}=$A{{r}})*({V_VENIT}>0)*{V_DATA}))),""))'),
    10: f'=IF(OR($A{{r}}="",$I{{r}}=""),"",{P_AZI}-$I{{r}})',
    11: (f'=IF($A{{r}}="","",IFERROR(IF(INDEX({CL_NOTA},MATCH($A{{r}},{CL_NUME},0))="","",'
         f'INDEX({CL_NOTA},MATCH($A{{r}},{CL_NUME},0))),""))'),
    12: ('=IF($A{r}="","",'
         f'IF(AND($K{{r}}<>"",$K{{r}}<={P_NOTA}),"Nemulțumit",'
         'IF(AND($D{r}>0,$C{r}=0),"Nu mai cumpără",'
         f'IF(AND($J{{r}}<>"",$J{{r}}>{P_ZILE},$D{{r}}>0),"Adormit",'
         f'IF(AND($E{{r}}<>"",$E{{r}}<={P_SCADERE}),"A scăzut",'
         f'IF(AND($C{{r}}>0,$G{{r}}<>"",$G{{r}}<{P_MARJA}),"Marjă mică",'
         'IF(AND($E{r}<>"",$E{r}>=0.2),"În creștere",'
         'IF($C{r}=0,"Fără activitate","Merge bine"))))))))'),
    13: ('=IF($A{r}="","",'
         'IF($L{r}="Nu mai cumpără","Sună-l săptămâna asta și întreabă direct ce s-a schimbat. Nu trimite email.",'
         'IF($L{r}="Adormit","Sună-l cu un motiv concret: o ofertă, o noutate, o reamintire de sezon.",'
         'IF($L{r}="A scăzut","Întreabă-l dacă a împărțit comenzile cu altcineva. De obicei asta s-a întâmplat.",'
         'IF($L{r}="Nemulțumit","Citește ce a spus în 11_CLIENTI. Rezolvă exact acel lucru, apoi sună-l să-i confirmi. Știi deja cauza — nu mai e nevoie să o cauți.",'
         'IF($L{r}="Marjă mică","Verifică ce discount are și cât te costă să-l servești. Poate merită renegociat.",'
         'IF($L{r}="În creștere","Întreabă-l ce altceva i-ar mai trebui. Acum e momentul, nu peste șase luni.",'
         'IF($L{r}="Fără activitate","Client în listă, dar fără vânzări în perioadă. Verifică dacă mai e client.",'
         '"Nimic urgent. Ține-l cald."))))))))'),
    14: ('=IF($A{r}="","",IFERROR('
         'IF($L{r}="Nu mai cumpără",$D{r},'
         'IF($L{r}="Adormit",$D{r},'
         'IF($L{r}="A scăzut",MAX(0,$D{r}-$C{r}),'
         f'IF($L{{r}}="Marjă mică",MAX(0,$C{{r}}*({P_MARJA}-$G{{r}})),'
         '$C{r}*0.15)))),""))'),
}
for j, tmpl in FORMULE_A.items():
    for rr in range(R0, LAST_A + 1):
        ws_a.cell(row=rr, column=j, value=tmpl.format(r=rr, s=R0 + rr - R0))
for rr in range(R0, LAST_A + 1):
    ws_a.cell(row=rr, column=1, value=FORMULE_A[1].format(s=rr))

CULORI_SEMNAL = {"Nu mai cumpără": "F8D7DA", "Adormit": "FBE3C2", "A scăzut": "F8D7DA",
                 "Nemulțumit": "F8D7DA", "Marjă mică": "FFF3CD", "În creștere": "D6F0D6",
                 "Fără activitate": "EDEDED"}
for semnal, culoare in CULORI_SEMNAL.items():
    ws_a.conditional_formatting.add(
        f"L{R0}:L{LAST_A}",
        CellIsRule(operator="equal", formula=[f'"{semnal}"'],
                   fill=PatternFill("solid", fgColor=culoare)))

# cheie de clasament pentru grafic (ascunsa)
KEY_COL = len(COL_ANALIZA) + 1
KEY_L = get_column_letter(KEY_COL)
for rr in range(R0, LAST_A + 1):
    ws_a.cell(row=rr, column=KEY_COL,
              value=f'=IF(OR($A{rr}="",$C{rr}="",N($C{rr})<=0),"",$C{rr}+ROW()/1000000)')
ws_a.column_dimensions[KEY_L].hidden = True
A_KEY = f"'21_CE_SE_INTAMPLA'!${KEY_L}${R0}:${KEY_L}${LAST_A}"
A_NUME = f"'21_CE_SE_INTAMPLA'!$A${R0}:$A${LAST_A}"
A_VENIT = f"'21_CE_SE_INTAMPLA'!$C${R0}:$C${LAST_A}"

# ================================================================ 30_PLAN
ws_p = wb.create_sheet("30_PLAN")
title_block(ws_p, "30 — PLANUL",
            "Maximum zece rânduri. Ia semnalele din foaia 21 și scrie ce faci concret. "
            "Ordinea se calculează singură: primele trei sunt cele de făcut acum.")
COL_PLAN = [
    ("Ce fac", 44, None, "O acțiune concretă, cu verb. „Sun cinci clienți adormiți”, nu „îmbunătățesc relația”."),
    ("Cu cine / la ce client", 24, None, "Numele clientului sau al produsului."),
    ("De ce (ce am văzut în cifre)", 34, None, "Semnalul din foaia 21. Dacă nu poți scrie un motiv, acțiunea nu e justificată."),
    ("Cât cred că aduce", 14, F_MONEY, "O estimare. Nu trebuie să fie exactă, trebuie să fie comparabilă între rânduri."),
    ("Cât de ușor e", 11, F_PCT, "1 = pot face azi singur. 0,5 = îmi ia o săptămână. 0,2 = greu, depinde de alții."),
    ("Scor", 13, F_MONEY, "Calculat: cât aduce × cât de ușor e."),
    ("Când", 11, None, "Calculat: primele trei ca scor sunt „ACUM”."),
    ("Până când", 12, F_DATE, "O dată concretă. Fără dată, nu se întâmplă."),
    ("Status", 13, None, "De făcut / În lucru / Gata / Renunțat."),
    ("Ce a ieșit", 26, None, "După ce ai făcut-o: a mers sau nu, și cât a adus."),
]
LAST_P = tabel(ws_p, COL_PLAN, N_PLAN, calc_cols=(6, 7), inaltime=38)
umple(ws_p, 6, '=IF(OR($D{r}="",$E{r}=""),"",$D{r}*$E{r})', LAST_P, F_MONEY)
SCOR = f"$F${R0}:$F${LAST_P}"
umple(ws_p, 7,
      '=IF($F{r}="","",IF(COUNTIF(' + SCOR + ',">"&$F{r})<3,"ACUM",'
      'IF(COUNTIF(' + SCOR + ',">"&$F{r})<6,"URMEAZĂ","MAI TÂRZIU")))', LAST_P)
add_dv(ws_p, L_STATUS, f"I{R0}:I{LAST_P}")
for cand, culoare, text in (("ACUM", "F8D7DA", "9C2A2A"), ("URMEAZĂ", "FFF3CD", "8A6D1F"),
                            ("MAI TÂRZIU", "EDEDED", "5B6770")):
    ws_p.conditional_formatting.add(
        f"G{R0}:G{LAST_P}",
        CellIsRule(operator="equal", formula=[f'"{cand}"'],
                   fill=PatternFill("solid", fgColor=culoare), font=Font(bold=True, color=text)))
EXEMPLE = [
    ("Sun toți clienții care nu au mai comandat de 3 luni", "", "Filtrate din foaia 21: „Adormit”", "", 0.9),
    ("Întreb primii 10 clienți ce notă ne dau", "", "Nicio notă completată în 11_CLIENTI", "", 1),
    ("Renegociez prețul la clientul cu marja cea mai mică", "", "Foaia 21: „Marjă mică”", "", 0.5),
]
for k, (ce, cine, dece, cat, usor) in enumerate(EXEMPLE):
    ws_p.cell(row=R0 + k, column=1, value=ce)
    ws_p.cell(row=R0 + k, column=3, value=dece)
    ws_p.cell(row=R0 + k, column=5, value=usor)
    ws_p.cell(row=R0 + k, column=9, value="De făcut")
ws_p.cell(row=LAST_P + 2, column=1,
          value="Rândurile de mai sus sunt exemple. Șterge-le și scrie ale tale — "
                "completează „Cât cred că aduce”, altfel scorul rămâne gol.").font = \
    Font(size=9, italic=True, color=GREY_TXT)

# ================================================================ 40_GRAFICE
ws_g = wb.create_sheet("40_GRAFICE")
title_block(ws_g, "40 — GRAFICE",
            "Se desenează singure. Dacă par goale, apasă Ctrl+Alt+F9.")
ws_g.sheet_view.showGridLines = False
D0 = 40
LUNI = 12
m0, m1 = D0 + 1, D0 + LUNI


def antet(celula, text, w=None):
    c = ws_g[celula]
    c.value = text
    c.font = Font(bold=True, size=9, color=WHITE)
    c.fill = PatternFill("solid", fgColor=INK)
    c.alignment = Alignment(horizontal="center", wrap_text=True)
    if w:
        ws_g.column_dimensions[celula[0]].width = w


def calcul(celula, formula, fmt=None):
    c = ws_g[celula]
    c.value = formula
    c.fill = PatternFill("solid", fgColor=CALC_FILL)
    c.border = BORDER
    c.font = Font(size=9, color=GREY_TXT)
    if fmt:
        c.number_format = fmt


ws_g.cell(row=D0 - 1, column=1,
          value="ZONA DE CALCUL — nu se editează, nu se șterge.").font = Font(bold=True, size=10, color="9C2A2A")
for col, (t, w) in zip("ABCD", [("Lună", 11), ("Etichetă", 11), ("Încasat", 13), ("Profit brut", 13)]):
    antet(f"{col}{D0}", t, w)
for k in range(1, LUNI + 1):
    rr = D0 + k
    ms, me = f"$A{rr}", f'DATE(YEAR($A{rr}),MONTH($A{rr})+1,0)'
    calcul(f"A{rr}", f'=DATE(YEAR({B}),MONTH({B})+{k}-{LUNI},1)', "yyyy-mm")
    calcul(f"B{rr}", f'={ym(ms)}')
    calcul(f"C{rr}", f'=SUMIFS({V_VENIT},{V_DATA},">="&{ms},{V_DATA},"<="&{me})', F_MONEY)
    calcul(f"D{rr}", f'=SUMIFS({V_PROFIT},{V_DATA},">="&{ms},{V_DATA},"<="&{me})', F_MONEY)

antet(f"F{D0}", "Top 8 clienți", 26)
antet(f"G{D0}", "Încasat", 13)
for k in range(1, 9):
    rr = D0 + k
    mt = f'MATCH(LARGE({A_KEY},{k}),{A_KEY},0)'
    calcul(f"F{rr}", f'=IFERROR(INDEX({A_NUME},{mt}),"")')
    calcul(f"G{rr}", f'=IFERROR(INDEX({A_VENIT},{mt}),0)', F_MONEY)

antet(f"I{D0}", "Notele clienților", 20)
antet(f"J{D0}", "Câți", 10)
for k, (eticheta, formula) in enumerate([("Mulțumiți (9-10)", f_promotori),
                                         ("Neutri (7-8)", f_pasivi),
                                         ("Nemulțumiți (0-6)", f_detractori)], start=1):
    calcul(f"I{D0+k}", f'="{eticheta}"')
    calcul(f"J{D0+k}", f'={formula}', F_INT)


def axe(ch, numfmt=F_MONEY, grid=True):
    orizontal = getattr(ch, "type", "col") == "bar"
    ch.x_axis.axPos = "l" if orizontal else "b"
    ch.y_axis.axPos = "b" if orizontal else "l"
    ch.x_axis.delete = False
    ch.y_axis.delete = False
    ch.y_axis.numFmt = numfmt
    if not grid:
        ch.y_axis.majorGridlines = None
    for ax in (ch.x_axis, ch.y_axis):
        ax.spPr = GraphicalProperties()
        ax.spPr.ln = LineProperties(solidFill="C3C2B7", w=6350)
    ch.style = None


def culoare(ser, hexa):
    ser.graphicalProperties = GraphicalProperties(solidFill=hexa)
    ser.graphicalProperties.line = LineProperties(noFill=True)


def etichete_text(ch, ref):
    for ser in ch.series:
        if ser.cat is not None:
            ser.cat.numRef = None
            ser.cat.strRef = StrRef(f=ref)


g1 = BarChart()
g1.type, g1.grouping, g1.gapWidth, g1.overlap = "col", "clustered", 60, -10
g1.title = "Cât s-a încasat și cât a rămas, pe lună"
g1.add_data(Reference(ws_g, min_col=3, max_col=4, min_row=D0, max_row=m1), titles_from_data=True)
g1.set_categories(Reference(ws_g, min_col=2, min_row=m0, max_row=m1))
culoare(g1.series[0], C_SER1)
culoare(g1.series[1], C_SER2)
etichete_text(g1, f"'40_GRAFICE'!$B${m0}:$B${m1}")
axe(g1)
g1.legend.position = "b"
g1.width, g1.height = 17, 8.5
ws_g.add_chart(g1, "A4")

g2 = BarChart()
g2.type, g2.gapWidth = "bar", 45
g2.title = "Cei mai importanți 8 clienți"
g2.add_data(Reference(ws_g, min_col=7, min_row=D0, max_row=D0 + 8), titles_from_data=True)
g2.set_categories(Reference(ws_g, min_col=6, min_row=m0, max_row=D0 + 8))
culoare(g2.series[0], C_SER1)
etichete_text(g2, f"'40_GRAFICE'!$F${m0}:$F${D0+8}")
axe(g2, grid=False)
g2.legend = None
g2.dataLabels = DataLabelList()
g2.dataLabels.showVal = True
g2.dataLabels.numFmt = F_MONEY
g2.width, g2.height = 17, 9
ws_g.add_chart(g2, "L4")

g3 = BarChart()
g3.type, g3.gapWidth = "col", 80
g3.title = "Ce cred clienții despre tine"
g3.add_data(Reference(ws_g, min_col=10, min_row=D0, max_row=D0 + 3), titles_from_data=True)
g3.set_categories(Reference(ws_g, min_col=9, min_row=m0, max_row=D0 + 3))
culoare(g3.series[0], C_GOOD)
g3.series[0].data_points = [
    DataPoint(idx=i, spPr=GraphicalProperties(solidFill=h, ln=LineProperties(noFill=True)))
    for i, h in enumerate((C_GOOD, C_WARN, C_BAD))]
etichete_text(g3, f"'40_GRAFICE'!$I${m0}:$I${D0+3}")
axe(g3, numfmt=F_INT, grid=False)
g3.legend = None
g3.dataLabels = DataLabelList()
g3.dataLabels.showVal = True
g3.width, g3.height = 17, 8.5
ws_g.add_chart(g3, "A22")

# ================================================================ 01_FIRMA
ws_f = wb.create_sheet("01_FIRMA")
title_block(ws_f, "01 — DESPRE FIRMĂ",
            "Paisprezece rânduri, completate în discuția de început. Restul se vede din cifre.")
# A = etichete, B/C/D = cei trei ani din istoricul financiar, E = explicații
for _col, _w in (("A", 34), ("B", 17), ("C", 17), ("D", 17), ("E", 58)):
    ws_f.column_dimensions[_col].width = _w
CAMPURI = [
    ("Cod client EQUIL", "", "ID-ul tău intern: EQ-0001, EQ-0002…"),
    ("Denumirea firmei", "", ""),
    ("CUI", "", ""),
    ("Ce vinde, pe scurt", "", "O propoziție, în cuvintele lui."),
    ("Câți oameni lucrează acolo", "", "Cu tot cu patron."),
    ("Câți clienți are, aproximativ", "", ""),
    ("Cum emite facturile", "", "Smartbill, Oblio, FGO, Word, carnet — orice ar fi."),
    ("Poate exporta facturile în Excel?", "", "Da / Nu / Nu știu. De asta depinde cât durează totul."),
    ("Ce vrea să obțină în 12 luni", "", "În cifre, dacă se poate."),
    ("Ce îl supără cel mai tare acum", "", "De obicei aici e adevărata problemă."),
    ("Cine decide", "", "Numele omului care semnează."),
    ("Perioada pe care o analizăm", "", "Trebuie să fie aceeași ca în 02_SETARI."),
    ("Data discuției", "", ""),
]
r = 4
for eticheta, valoare, nota in CAMPURI:
    label_value(ws_f, r, eticheta, valoare, nota, span=3, note_col=5)
    r += 1

ISTORIC = adauga_istoric(ws_f, r + 1, an_ref=P_PANA, moneda_ref=P_MONEDA, note_col=5)

# ================================================================ 00_START
ws_s = wb.create_sheet("00_START")
title_block(ws_s, "EQUIL LIGHT — PORNIRE",
            "Varianta pentru firme mici. Completezi doar celulele galbene; cele gri se calculează singure.")
ws_s.column_dimensions["A"].width = 30
ws_s.column_dimensions["B"].width = 98
GHID = [
    ("", ""),
    ("PENTRU CINE E", ""),
    ("Potrivit", "Firme sub 10 angajați, până în ~500.000 lei pe an, sub 100 de clienți, fără ERP și fără CRM. "
                 "Adică: facturează dintr-un program simplu sau din Word, și ține minte clienții pe de rost."),
    ("Nepotrivit", "Dacă firma are ERP, echipă de vânzări cu ținte individuale și peste 100 de clienți, "
                   "folosește varianta completă — acolo ai analiză pe produse, pe oameni și pe ținte."),
    ("Se poate trece", "Datele de aici sunt un subset al variantei complete. Dacă firma crește, "
                       "se mută coloanele și nu pierzi nimic din istoric."),
    ("", ""),
    ("CE CERI DE LA CLIENT", ""),
    ("Un singur lucru", "Exportul facturilor pe ultimele 24 de luni, în Excel sau CSV, cu: data, clientul, "
                        "ce a cumpărat și suma fără TVA."),
    ("Al doilea lucru", "Costul direct pentru fiecare vânzare — cât l-a costat marfa sau materialul. "
                        "Dacă nu îl are pe linie, cere-i un procent mediu și calculezi tu."),
    ("Dacă nu poate exporta", "Nu e capăt de drum. Ia ultimele 12 luni din facturier și tastează-le. "
                              "La 100.000 € pe an înseamnă câteva sute de linii, adică o după-amiază."),
    ("De la cine", "La o firmă mică sunt doi oameni: patronul (context, obiective) și contabilul "
                   "(facturi, costuri). Nu ai nevoie de mai mult."),
    ("", ""),
    ("ORDINEA DE LUCRU", ""),
    ("1. 01_FIRMA", "14 rânduri, în discuția de început. 15 minute."),
    ("2. 11_CLIENTI", "Scrie lista de clienți. Notele le poți adăuga mai târziu, după ce suni. 20 de minute."),
    ("3. 10_VANZARI", "Lipește sau tastează vânzările. Aici se duce timpul: 30 de minute până la 2 ore."),
    ("4. 02_SETARI", "Perioada și obiectivul. 5 minute."),
    ("5. 20_REZULTATE", "Citești cifrele și concluziile. Nu scrii nimic. 15 minute."),
    ("6. 21_CE_SE_INTAMPLA", "Vezi ce se întâmplă cu fiecare client și ce ai de făcut. 20 de minute."),
    ("7. 30_PLAN", "Alegi maximum zece acțiuni. Primele trei sunt cele de acum. 20 de minute."),
    ("8. 40_GRAFICE", "Trei grafice, pentru discuția cu clientul. Se desenează singure."),
    ("Total", "Aproximativ 2 ore de lucru, dacă datele vin curate. Jumătate din varianta completă."),
    ("", ""),
    ("TREI REGULI", ""),
    ("Sumele fără TVA", "Toate. Dacă amesteci, cifrele ies greșite cu 19% și nu îți dai seama."),
    ("Numele clientului la fel", "De asta îl alegi din listă în 10_VANZARI, în loc să îl scrii de fiecare dată."),
    ("Costul direct, nu toate costurile", "Marfa și materialul intră. Chiria și contabilul nu — "
                                          "acelea se scad din profitul brut, mai încolo."),
    ("", ""),
    ("CULORI", ""),
    ("Galben", "Scrii tu."),
    ("Gri", "Se calculează singur. Dacă scrii peste, strici calculul și nu te anunță nimeni."),
]
r = 3
for eticheta, text in GHID:
    if not eticheta and not text:
        r += 1
        continue
    ce = ws_s.cell(row=r, column=1, value=eticheta)
    ct = ws_s.cell(row=r, column=2, value=text)
    titlu = text == ""
    ce.font = Font(bold=True, size=11 if titlu else 10, color=TEAL if titlu else INK)
    ce.alignment = Alignment(vertical="top", wrap_text=True)
    ct.font = Font(size=10, color="333333")
    ct.alignment = Alignment(wrap_text=True, vertical="top")
    if titlu:
        for k in (1, 2):
            ws_s.cell(row=r, column=k).fill = PatternFill("solid", fgColor=TEAL_LIGHT)
    ws_s.row_dimensions[r].height = 30 if len(text) > 95 else 16
    r += 1
for eticheta, culoare_ in (("Galben", INPUT_FILL), ("Gri", CALC_FILL)):
    for rr in range(3, r):
        if ws_s.cell(row=rr, column=1).value == eticheta:
            ws_s.cell(row=rr, column=3).fill = PatternFill("solid", fgColor=culoare_)
            ws_s.cell(row=rr, column=3).border = BORDER
ws_s.sheet_view.showGridLines = False

ORDINE = ["00_START", "01_FIRMA", "02_SETARI", "10_VANZARI", "11_CLIENTI",
          "12_CONCURENTA", "13_CE_CRED_OAMENII",
          "20_REZULTATE", "21_CE_SE_INTAMPLA", "30_PLAN", "40_GRAFICE"]
wb._sheets = [wb[x] for x in ORDINE]
wb.active = 0
verifica(wb)
wb.save(OUT)
print("OK ->", OUT)
print("Foi:", len(wb.sheetnames))
