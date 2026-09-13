# -*- coding: utf-8 -*-
"""Verificare structurala a unui .xlsx: exact lucrurile pentru care Excel cere
sa "repare" fisierul la deschidere si pe care openpyxl le scrie fara sa se planga.

Ruleaza: python3 tools/verifica_fisier.py cale.xlsx
"""
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from itertools import combinations

from openpyxl.utils import range_boundaries

# Operatorii acceptati de Excel pentru fiecare tip de regula de formatare conditionata.
OPERATORI = {
    "cellIs": {"lessThan", "lessThanOrEqual", "equal", "notEqual",
               "greaterThanOrEqual", "greaterThan", "between", "notBetween"},
    "containsText": {"containsText"},
    "notContainsText": {"notContains"},
    "beginsWith": {"beginsWith"},
    "endsWith": {"endsWith"},
    "timePeriod": {"today", "yesterday", "tomorrow", "last7Days", "thisMonth",
                   "lastMonth", "nextMonth", "thisWeek", "lastWeek", "nextWeek"},
}
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}


def verifica_fisier(cale):
    erori = []
    z = zipfile.ZipFile(cale)
    nume = z.namelist()

    # 1. fiecare parte XML trebuie sa fie bine formata
    for n in nume:
        if n.endswith((".xml", ".rels")):
            try:
                ET.fromstring(z.read(n))
            except ET.ParseError as e:
                erori.append(f"XML nevalid în {n}: {e}")

    # 2. relatiile trebuie sa indice fisiere care exista
    for n in [x for x in nume if x.endswith(".rels")]:
        baza = n.rsplit("_rels/", 1)[0]
        for m in re.finditer(r'Target="([^"]+)"[^>]*?(TargetMode="External")?/?>', z.read(n).decode()):
            tinta, extern = m.group(1), m.group(2)
            if extern or tinta.startswith(("http", "mailto", "../")) or "://" in tinta:
                continue
            cale_tinta = (baza + tinta.lstrip("/")).replace("//", "/")
            if cale_tinta not in nume and tinta.lstrip("/") not in nume:
                erori.append(f"Relație ruptă în {n}: {tinta}")

    foi = {}
    for n in [x for x in nume if re.match(r"xl/worksheets/sheet\d+\.xml$", x)]:
        x = z.read(n).decode("utf-8")
        foi[n] = x

        # 3. reguli de formatare conditionata cu operator nepotrivit tipului
        for cf in re.finditer(r'<cfRule\b([^>]*)>', x):
            attr = cf.group(1)
            tip = re.search(r'type="([^"]+)"', attr)
            op = re.search(r'operator="([^"]+)"', attr)
            if tip and op:
                t, o = tip.group(1), op.group(1)
                if t in OPERATORI and o not in OPERATORI[t]:
                    erori.append(f'{n}: regulă „{t}” cu operator „{o}” — Excel nu o acceptă')
            if tip and tip.group(1) in ("containsText", "notContainsText", "beginsWith", "endsWith") \
                    and 'text="' not in attr:
                erori.append(f'{n}: regulă „{tip.group(1)}” fără atributul text=')

        # 4. zone imbinate care se suprapun
        imbinate = re.findall(r'<mergeCell ref="([^"]+)"', x)
        cutii = []
        for ref in imbinate:
            try:
                cutii.append((ref, range_boundaries(ref)))
            except ValueError:
                erori.append(f"{n}: zonă îmbinată nevalidă {ref}")
        for (r1, (c1, ro1, c2, ro2)), (r2, (c3, ro3, c4, ro4)) in combinations(cutii, 2):
            if c1 <= c4 and c3 <= c2 and ro1 <= ro4 and ro3 <= ro2:
                erori.append(f"{n}: zonele îmbinate {r1} și {r2} se suprapun")

        # 5. validari de date fara formula sau cu zona goala
        for dv in re.finditer(r'<dataValidation\b([^>]*)>(.*?)</dataValidation>', x, re.S):
            attr, corp = dv.groups()
            if 'type="list"' in attr and "<formula1>" not in corp:
                erori.append(f"{n}: validare de tip listă fără sursă")
            f1 = re.search(r"<formula1>(.*?)</formula1>", corp, re.S)
            if f1 and f1.group(1).startswith("="):
                erori.append(f"{n}: validare cu formulă care începe cu „=” ({f1.group(1)[:40]})")
            if 'sqref=""' in attr:
                erori.append(f"{n}: validare fără zonă de aplicare")

    # 6. graficele trebuie sa arate spre foi care exista
    wb = z.read("xl/workbook.xml").decode()
    nume_foi = set(re.findall(r'<sheet name="([^"]+)"', wb))
    for n in [x for x in nume if re.match(r"xl/charts/chart\d+\.xml$", x)]:
        for ref in set(re.findall(r"<c?:?f>'([^']+)'!", z.read(n).decode())):
            if ref not in nume_foi:
                erori.append(f"{n}: trimite la foaia inexistentă „{ref}”")

    # 7. caractere de control interzise in text
    for n in [x for x in nume if x.endswith(".xml")]:
        text = z.read(n).decode("utf-8", errors="replace")
        for ch in re.findall(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", text):
            erori.append(f"{n}: caracter de control interzis {hex(ord(ch))}")
            break

    return erori


if __name__ == "__main__":
    cai = sys.argv[1:] or ["dist/EQUIL_Growth_Intelligence_v0_2.xlsx", "dist/EQUIL_Light_v0_2.xlsx"]
    total = 0
    for cale in cai:
        erori = verifica_fisier(cale)
        total += len(erori)
        print(f"{cale}: {'OK — nicio problemă structurală' if not erori else str(len(erori)) + ' probleme'}")
        for e in erori[:25]:
            print("   -", e)
    sys.exit(1 if total else 0)
