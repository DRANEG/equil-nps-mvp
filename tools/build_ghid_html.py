# -*- coding: utf-8 -*-
"""Generează ghidul HTML (glosar + proces + estimări de timp) din aceleași date
ca foaia 04_DICTIONAR, ca să nu existe două variante care se depărtează una de alta.

Ruleaza: python3 tools/build_ghid_html.py  ->  dist/ghid_equil.html
"""
import html
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from glosar import DICTIONAR

E = html.escape

PASI = [
    ("Kickoff", "20-30 min",
     "Completezi profilul firmei împreună cu clientul: ce face, cât de mare e, ce sisteme folosește, ce vrea să obțină în 12 luni.",
     "01_FIRMA"),
    ("Harta oamenilor", "10-15 min",
     "Notezi cine deține fiecare set de date. Nu firma îți dă cifrele, ci un om anume, cu nume și email.",
     "02_CONTACTE"),
    ("Cererea de date", "15 min + 3-10 zile de așteptare",
     "Trimiți lista de câmpuri, filtrată pe cele obligatorii. Fiecare rând spune din ce sistem se scoate și cine îl poate da. Urmează două-trei reveniri scurte.",
     "03_CHECKLIST_DATE"),
    ("Importul", "30-60 min curat, 2-4 ore murdar",
     "Lipești exporturile în foile de date. Timpul real depinde de cât de inconsecvente sunt denumirile și de câte valori vin ca text în loc de cifre.",
     "10-15"),
    ("Parametrii", "5 min",
     "Setezi perioada analizată, perioada de comparație și pragurile. Tot fișierul se recalculează din ele.",
     "09_PARAMETRI"),
    ("Citirea semnalelor", "30-45 min",
     "Citești indicatorii și semnalele generate automat pe clienți, produse și oameni. Verifici dacă au sens: un semnal care contrazice realitatea din teren e de obicei o problemă de date.",
     "20-23"),
    ("Prioritizarea", "45-60 min",
     "Transformi semnalele în oportunități cu impact estimat, probabilitate, ușurință și responsabil. Scorul le ordonează singur.",
     "30_OPORTUNITATI"),
    ("Raportul", "30-45 min",
     "Concluziile se scriu singure din date și îți dau schița. Tu scrii varianta pentru client și alegi primele trei acțiuni.",
     "40-41"),
]

CATEGORII = []
for _, cat, *_rest in DICTIONAR:
    if cat not in CATEGORII:
        CATEGORII.append(cat)

TERMENI = [{"t": t, "c": c, "ce": ce, "de": de, "cum": cum}
           for t, c, ce, de, cum in DICTIONAR]

CSS = """
:root {
  color-scheme: light;
  --ground:        #f4f6f3;
  --surface:       #ffffff;
  --surface-sunk:  #eceee9;
  --ink:           #16302f;
  --ink-soft:      #4a5c5a;
  --ink-faint:     #7c8b89;
  --rule:          #d8ded9;
  --accent:        #0e6e6b;
  --accent-wash:   #dceae7;
  --ochre:         #9a6a16;
  --ochre-wash:    #f2e9d8;
  --shadow:        0 1px 2px rgba(22,48,47,.06), 0 8px 24px -16px rgba(22,48,47,.24);
  --step--1: .8125rem;
  --step-0:  1rem;
  --step-1:  1.1875rem;
  --step-2:  1.5rem;
  --step-3:  2rem;
  --step-4:  2.75rem;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
    --ground:       #0e1716;
    --surface:      #16211f;
    --surface-sunk: #101a19;
    --ink:          #e8efec;
    --ink-soft:     #a8b8b5;
    --ink-faint:    #7b8c89;
    --rule:         #26332f;
    --accent:       #4fb0a8;
    --accent-wash:  #16332f;
    --ochre:        #d6a24e;
    --ochre-wash:   #2e2717;
    --shadow:       0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
  }
}
:root[data-theme="dark"] {
  color-scheme: dark;
  --ground:       #0e1716;
  --surface:      #16211f;
  --surface-sunk: #101a19;
  --ink:          #e8efec;
  --ink-soft:     #a8b8b5;
  --ink-faint:    #7b8c89;
  --rule:         #26332f;
  --accent:       #4fb0a8;
  --accent-wash:  #16332f;
  --ochre:        #d6a24e;
  --ochre-wash:   #2e2717;
  --shadow:       0 1px 2px rgba(0,0,0,.4), 0 8px 24px -16px rgba(0,0,0,.8);
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--ground);
  color: var(--ink);
  font-family: "Public Sans", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  font-size: var(--step-0);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.wrap {
  max-width: 74rem;
  margin: 0 auto;
  padding-inline: 20px;
  padding-block: 0 72px;
}

h1, h2, h3 {
  font-family: Newsreader, ui-serif, Georgia, serif;
  font-weight: 500;
  text-wrap: balance;
  margin: 0;
  line-height: 1.15;
}

.eyebrow {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--step--1);
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--accent);
}

/* ---------- antet ---------- */
header.masthead {
  border-bottom: 1px solid var(--rule);
  padding-block: 56px 32px;
  display: grid;
  gap: 18px;
}
header.masthead h1 { font-size: var(--step-4); letter-spacing: -.015em; }
header.masthead p.lede {
  max-width: 60ch; margin: 0;
  font-size: var(--step-1); color: var(--ink-soft);
}
nav.jump { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
nav.jump a {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--step--1);
  text-decoration: none;
  color: var(--ink-soft);
  border: 1px solid var(--rule);
  border-radius: 2px;
  padding: 5px 11px;
  background: var(--surface);
}
nav.jump a:hover { color: var(--accent); border-color: var(--accent); }

section { padding-block: 56px 0; }
section > h2 { font-size: var(--step-3); letter-spacing: -.01em; margin-bottom: 8px; }
section > p.intro { max-width: 62ch; color: var(--ink-soft); margin: 0 0 28px; }

/* ---------- proces ---------- */
ol.pasi { list-style: none; margin: 0; padding: 0; display: grid; gap: 0; }
ol.pasi li {
  display: grid;
  grid-template-columns: 3.25rem minmax(0, 1fr) auto;
  gap: 4px 20px;
  align-items: baseline;
  padding-block: 20px;
  border-top: 1px solid var(--rule);
}
ol.pasi li:last-child { border-bottom: 1px solid var(--rule); }
.pas-nr {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--step--1);
  color: var(--ink-faint);
  font-variant-numeric: tabular-nums;
  grid-row: span 2;
}
.pas-nume { font-family: Newsreader, ui-serif, Georgia, serif; font-size: var(--step-2); }
.pas-timp {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--step--1);
  color: var(--accent);
  background: var(--accent-wash);
  padding: 3px 9px;
  border-radius: 2px;
  white-space: nowrap;
  justify-self: end;
}
.pas-text { grid-column: 2; color: var(--ink-soft); margin: 0; max-width: 68ch; }
.pas-foaie {
  grid-column: 3; justify-self: end;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: var(--step--1); color: var(--ink-faint);
}
.total {
  margin-top: 24px; padding: 20px 24px;
  background: var(--surface); border: 1px solid var(--rule); border-left: 3px solid var(--accent);
  display: grid; gap: 6px;
}
.total strong { font-size: var(--step-1); }
.total span { color: var(--ink-soft); font-size: var(--step--1); }

/* ---------- verdict Office ---------- */
.verdict {
  background: var(--surface); border: 1px solid var(--rule);
  padding: 28px 28px 24px; box-shadow: var(--shadow);
  display: grid; gap: 14px;
}
.verdict .call {
  font-family: Newsreader, ui-serif, Georgia, serif;
  font-size: var(--step-3); color: var(--accent); line-height: 1.1;
}
.verdict p { margin: 0; max-width: 68ch; color: var(--ink-soft); }
table.compat { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: var(--step--1); }
table.compat th, table.compat td { text-align: left; padding: 9px 12px 9px 0; border-bottom: 1px solid var(--rule); vertical-align: top; }
table.compat th { font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 400; color: var(--ink-faint); text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; }
table.compat td:first-child { font-weight: 600; white-space: nowrap; padding-right: 20px; }
table.compara { width: 100%; border-collapse: collapse; font-size: var(--step--1); background: var(--surface); border: 1px solid var(--rule); }
table.compara th, table.compara td { text-align: left; padding: 11px 14px; border-bottom: 1px solid var(--rule); vertical-align: top; }
table.compara th { font-family: "IBM Plex Mono", ui-monospace, monospace; font-weight: 400; color: var(--ink-faint); text-transform: uppercase; letter-spacing: .08em; font-size: .72rem; }
table.compara th:nth-child(2) { color: var(--accent); }
table.compara td:first-child { color: var(--ink-faint); width: 11rem; }
table.compara tr:last-child td { border-bottom: 0; }
table.compara td:nth-child(2) { background: var(--accent-wash); }
.nota-variante { margin-top: 20px; max-width: 68ch; color: var(--ink-soft); }
@media (max-width: 640px) {
  table.compara th, table.compara td { padding: 9px 10px; }
  table.compara td:first-child { width: auto; }
}
.yes { color: var(--accent); }
.later { color: var(--ochre); }

/* ---------- fisier per firma ---------- */
.regula { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1px; background: var(--rule); border: 1px solid var(--rule); }
.regula div { background: var(--surface); padding: 20px 22px; display: grid; gap: 6px; align-content: start; }
.regula h3 { font-size: var(--step-1); }
.regula p { margin: 0; color: var(--ink-soft); font-size: var(--step--1); }
code.fname {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: .78rem; background: var(--surface-sunk); padding: 2px 6px;
  border-radius: 2px; color: var(--ink); overflow-wrap: anywhere;
}

/* ---------- dictionar ---------- */
.filtre { display: grid; gap: 14px; margin-bottom: 8px; position: sticky; top: 0; z-index: 5;
          background: var(--ground); padding-block: 12px; border-bottom: 1px solid var(--rule); }
.cauta { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.cauta input {
  flex: 1 1 260px; min-width: 0;
  font: inherit; font-size: var(--step-0);
  padding: 10px 14px; color: var(--ink);
  background: var(--surface); border: 1px solid var(--rule); border-radius: 2px;
}
.cauta input:focus-visible { outline: 2px solid var(--accent); outline-offset: 1px; }
.numar { font-family: "IBM Plex Mono", ui-monospace, monospace; font-size: var(--step--1); color: var(--ink-faint); font-variant-numeric: tabular-nums; }
.chips { display: flex; flex-wrap: wrap; gap: 6px; }
.chips button {
  font: inherit; font-size: var(--step--1); cursor: pointer;
  padding: 5px 12px; border-radius: 2px;
  border: 1px solid var(--rule); background: var(--surface); color: var(--ink-soft);
}
.chips button:hover { border-color: var(--accent); color: var(--accent); }
.chips button[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
.chips button:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

dl.termeni { margin: 0; display: grid; gap: 0; }
dl.termeni > div {
  display: grid; grid-template-columns: minmax(0, 15rem) minmax(0, 1fr);
  gap: 6px 28px; padding-block: 22px; border-bottom: 1px solid var(--rule);
}
dt { display: grid; gap: 8px; align-content: start; }
.termen { font-family: Newsreader, ui-serif, Georgia, serif; font-size: var(--step-1); line-height: 1.2; }
.cat {
  justify-self: start;
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: .68rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-faint); border: 1px solid var(--rule); padding: 2px 7px; border-radius: 2px;
}
dd { margin: 0; display: grid; gap: 10px; }
.camp { display: grid; grid-template-columns: 7.5rem minmax(0, 1fr); gap: 4px 16px; }
.camp b {
  font-family: "IBM Plex Mono", ui-monospace, monospace;
  font-size: .68rem; letter-spacing: .1em; text-transform: uppercase;
  color: var(--ink-faint); font-weight: 400; padding-top: 4px;
}
.camp span { color: var(--ink-soft); }
.camp.cum span { color: var(--ink); border-left: 2px solid var(--accent-wash); padding-left: 12px; }
.gol { padding: 40px 0; color: var(--ink-faint); }

footer {
  margin-top: 64px; padding-top: 24px; border-top: 1px solid var(--rule);
  color: var(--ink-faint); font-size: var(--step--1); display: grid; gap: 6px;
}

@media (max-width: 720px) {
  header.masthead { padding-block: 36px 24px; }
  header.masthead h1 { font-size: var(--step-3); }
  ol.pasi li { grid-template-columns: 2.5rem minmax(0, 1fr); }
  .pas-timp { grid-column: 2; justify-self: start; }
  .pas-text { grid-column: 2; }
  .pas-foaie { grid-column: 2; justify-self: start; }
  dl.termeni > div { grid-template-columns: minmax(0, 1fr); gap: 12px; }
  .camp { grid-template-columns: minmax(0, 1fr); }
  .camp b { padding-top: 0; }
}
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
"""

JS = """
const TERMENI = __DATA__;
const lista = document.getElementById('lista');
const cauta = document.getElementById('cauta');
const numar = document.getElementById('numar');
const chips = document.getElementById('chips');
let catActiva = 'toate';

const norm = s => s.toLowerCase()
  .replace(/[ăâ]/g, 'a').replace(/î/g, 'i').replace(/ș|ş/g, 's').replace(/ț|ţ/g, 't');

function randTermen(t) {
  const d = document.createElement('div');
  d.innerHTML = `<dt><span class="termen"></span><span class="cat"></span></dt>
    <dd>
      <div class="camp"><b>Ce înseamnă</b><span class="v-ce"></span></div>
      <div class="camp"><b>De ce contează</b><span class="v-de"></span></div>
      <div class="camp cum"><b>Cum îl ceri</b><span class="v-cum"></span></div>
    </dd>`;
  d.querySelector('.termen').textContent = t.t;
  d.querySelector('.cat').textContent = t.c;
  d.querySelector('.v-ce').textContent = t.ce;
  d.querySelector('.v-de').textContent = t.de;
  d.querySelector('.v-cum').textContent = t.cum;
  return d;
}

function deseneaza() {
  const q = norm(cauta.value.trim());
  const vizibile = TERMENI.filter(t =>
    (catActiva === 'toate' || t.c === catActiva) &&
    (!q || norm(t.t + ' ' + t.ce + ' ' + t.de + ' ' + t.cum).includes(q)));
  lista.replaceChildren(...vizibile.map(randTermen));
  numar.textContent = vizibile.length === TERMENI.length
    ? `${TERMENI.length} termeni`
    : `${vizibile.length} din ${TERMENI.length}`;
  document.getElementById('gol').hidden = vizibile.length > 0;
}

chips.addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  catActiva = b.dataset.cat;
  chips.querySelectorAll('button').forEach(x =>
    x.setAttribute('aria-pressed', String(x === b)));
  deseneaza();
});
cauta.addEventListener('input', deseneaza);
deseneaza();
"""


def build():
    chips = ['<button type="button" data-cat="toate" aria-pressed="true">Toate</button>']
    for c in CATEGORII:
        n = sum(1 for t in TERMENI if t["c"] == c)
        chips.append(f'<button type="button" data-cat="{E(c)}" aria-pressed="false">{E(c)} <span class="numar">{n}</span></button>')

    pasi = []
    for i, (nume, timp, text, foaie) in enumerate(PASI, start=1):
        pasi.append(
            f'<li><span class="pas-nr">{i:02d}</span>'
            f'<span class="pas-nume">{E(nume)}</span>'
            f'<span class="pas-timp">{E(timp)}</span>'
            f'<p class="pas-text">{E(text)}</p>'
            f'<span class="pas-foaie">{E(foaie)}</span></li>')

    return f"""<title>Ghid de teren EQUIL</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Public+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>{CSS}</style>

<div class="wrap">

<header class="masthead">
  <span class="eyebrow">EQUIL Growth Intelligence · v0.2</span>
  <h1>Ghid de teren</h1>
  <p class="lede">Cum duci fișierul într-o firmă: ce ceri, de la cine, cât durează —
     și ce înseamnă fiecare termen pe care îl vei rosti în discuție.</p>
  <nav class="jump">
    <a href="#variante">Care variantă</a>
    <a href="#proces">Procesul</a>
    <a href="#fisier">Un fișier per firmă</a>
    <a href="#office">Am nevoie de Office nou?</a>
    <a href="#dictionar">Dicționar</a>
  </nav>
</header>

<section id="variante">
  <h2>Care variantă</h2>
  <p class="intro">Sunt două fișiere, nu unul. Varianta completă e construită pentru o firmă cu
     echipă de vânzări și sisteme; pentru o firmă de câțiva oameni, ea cere mai mult decât dă.</p>
  <table class="compara">
    <tr><th></th><th>Light</th><th>Completă</th></tr>
    <tr><td>Firma</td>
        <td>Sub 10 angajați, până în ~500.000 lei pe an, sub 100 de clienți, fără ERP și fără CRM</td>
        <td>Echipă de vânzări cu ținte, ERP și CRM, peste 100 de clienți</td></tr>
    <tr><td>Foi</td><td>9</td><td>20</td></tr>
    <tr><td>Timpul tău</td><td>~2 ore</td><td>4-6 ore</td></tr>
    <tr><td>Cum se identifică clientul</td>
        <td>După nume, ales dintr-o listă — fără coduri</td>
        <td>Prin cod de client, produs și persoană</td></tr>
    <tr><td>Produse</td><td>Scrise în cuvinte, fără analiză separată</td>
        <td>Nomenclator propriu, cu marjă și penetrare pe produs</td></tr>
    <tr><td>Oameni</td><td>—</td><td>Productivitate și atingere de țintă pe fiecare</td></tr>
    <tr><td>NPS</td><td>O coloană în lista de clienți: o notă și ce a spus</td>
        <td>Foaie separată: valuri, teme, responsabil de follow-up</td></tr>
    <tr><td>Obiectiv</td><td>Un singur număr</td>
        <td>Ținte pe lună, pe om, pe produs, pe client</td></tr>
    <tr><td>Prioritizare</td><td>ACUM / URMEAZĂ / MAI TÂRZIU, calculat din clasament</td>
        <td>Scor = impact × probabilitate × ușurință, cu praguri reglabile</td></tr>
    <tr><td>Grafice</td><td>3</td><td>6</td></tr>
  </table>
  <p class="nota-variante"><strong>Se trece ușor de la una la alta.</strong> Datele din Light sunt un
     subset al celor din varianta completă, așa că mutarea înseamnă copiere de coloane, nu reluare de
     la zero. Semnul că firma a depășit varianta Light: începi să te întrebi <em>care om vinde mai
     bine</em> sau <em>care produs are marjă mai mare</em> — la acele întrebări Light nu răspunde.</p>
</section>

<section id="proces">
  <h2>Procesul, pas cu pas</h2>
  <p class="intro">Pentru varianta completă. Ordinea contează: fiecare pas deblochează pasul
     următor. Timpii sunt pentru prima rulare la o firmă nouă; de la a doua lună încolo, totul se
     scurtează. În Light, aceiași pași există, dar comprimați în opt: profil, listă de clienți,
     vânzări, setări, rezultate, semnale, plan, grafice.</p>
  <ol class="pasi">{''.join(pasi)}</ol>
  <div class="total">
    <strong>Total: aproximativ 4-6 ore de lucru efectiv</strong>
    <span>Întinse pe 1-2 săptămâni calendaristice — așteptarea datelor domină, nu munca.
          Rulările următoare la aceeași firmă: 1-1,5 ore pe lună.</span>
  </div>
</section>

<section id="fisier">
  <h2>Un fișier pentru fiecare firmă</h2>
  <p class="intro">Nu amesteca două firme în același fișier. Calculele presupun o singură bază
     de clienți, un singur set de ținte și o singură perioadă.</p>
  <div class="regula">
    <div>
      <h3>Cod de firmă</h3>
      <p>Fiecare firmă primește un cod în <strong>01_FIRMA</strong>: EQ-0001, EQ-0002 și așa mai departe.
         Codul rămâne același pentru totdeauna, chiar dacă firma își schimbă denumirea.</p>
    </div>
    <div>
      <h3>Nume de fișier</h3>
      <p><code class="fname">EQUIL_EQ-0001_AlfaSRL_2026-06.xlsx</code></p>
      <p>Perioada din nume îți spune din ce rulaj este fișierul, fără să îl deschizi.</p>
    </div>
    <div>
      <h3>Șablonul rămâne curat</h3>
      <p>Ține o copie fără date într-un folder separat. Din ea pleacă fiecare firmă nouă;
         nu lucrezi niciodată direct în șablon.</p>
    </div>
    <div>
      <h3>Luna următoare</h3>
      <p>Copiezi fișierul firmei, adaugi liniile noi de vânzări și muți perioada în
         <strong>09_PARAMETRI</strong>. Istoricul rămâne: de el depinde comparația.</p>
    </div>
  </div>
</section>

<section id="office">
  <h2>Am nevoie de un Office mai nou?</h2>
  <div class="verdict">
    <div class="call">Nu. Nu pentru acest fișier.</div>
    <p>Fișierul este construit intenționat fără funcții moderne: nicio funcție dinamică
       (UNIQUE, FILTER, LET, IFS, XLOOKUP) și niciun cod de format din TEXT(), pentru că acelea
       se comportă diferit într-un Excel cu interfață românească. Tot ce folosește există
       din Excel 2007 încoace.</p>
    <table class="compat">
      <tr><th>Unde</th><th>Funcționează</th></tr>
      <tr><td>Excel 2016 / 2019 / 2021</td><td class="yes">Da, integral — inclusiv graficele</td></tr>
      <tr><td>Microsoft 365</td><td class="yes">Da, integral</td></tr>
      <tr><td>LibreOffice Calc</td><td class="yes">Da — gratuit, dacă nu ai licență</td></tr>
      <tr><td>Google Sheets</td><td class="yes">Da, cu o rezervă: graficele se reconstruiesc la import</td></tr>
      <tr><td>Excel 2010 / 2013</td><td class="yes">Da, formulele merg — doar formatările arată mai sărac</td></tr>
    </table>
    <p><strong>Ce ți-ar aduce totuși Microsoft 365, mai târziu:</strong> Power Query, ca să
       preiei exporturile din ERP automat în loc să le lipești manual — acesta este singurul
       argument serios, și devine relevant abia când ai 5-10 firme și repeți lucrul lunar.
       Plus co-editare în timp real cu clientul și salvare automată în OneDrive.
       Niciunul nu schimbă cu nimic rezultatele analizei.</p>
    <p><strong>Recomandarea:</strong> lucrează cu ce ai acum. Ia decizia despre licență
       după primele 5 firme, când vei ști dacă timpul se duce în import — singura problemă
       pe care o rezolvă un Office mai nou.</p>
  </div>
</section>

<section id="dictionar">
  <h2>Dicționar</h2>
  <p class="intro">Fiecare termen are și formularea cu care îl poți cere direct în discuție.
     Aceleași {len(TERMENI)} definiții sunt și în foaia <strong>04_DICTIONAR</strong> din fișier.</p>
  <div class="filtre">
    <div class="cauta">
      <input id="cauta" type="search" placeholder="Caută un termen — ERP, marjă, NDA, churn…"
             aria-label="Caută în dicționar" autocomplete="off">
      <span class="numar" id="numar">{len(TERMENI)} termeni</span>
    </div>
    <div class="chips" id="chips">{''.join(chips)}</div>
  </div>
  <dl class="termeni" id="lista"></dl>
  <p class="gol" id="gol" hidden>Niciun termen nu se potrivește. Încearcă alt cuvânt.</p>
</section>

<footer>
  <span>EQUIL Growth Intelligence v0.2 — ghid de utilizare.</span>
  <span>Generat din aceleași date ca foaia 04_DICTIONAR, ca să nu existe două variante diferite.</span>
</footer>

</div>

<script>{JS.replace('__DATA__', json.dumps(TERMENI, ensure_ascii=False))}</script>
"""


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                       "dist", "ghid_equil.html")
    with open(out, "w", encoding="utf-8") as f:
        f.write(build())
    print("OK ->", out, os.path.getsize(out) // 1024, "KB")
