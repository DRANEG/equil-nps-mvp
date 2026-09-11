import { escapeHtml } from '../http.js';

export const CSS = `
:root {
  --bg: #f6f7f9; --card: #ffffff; --ink: #16191d; --muted: #6b7280;
  --line: #e4e7ec; --accent: #2f5bea; --ok: #17864d; --warn: #b7791f; --bad: #c0392b;
  --radius: 12px;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink);
  font: 15px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
a { color: var(--accent); }
.wrap { max-width: 980px; margin: 0 auto; padding: 24px 16px 64px; }
.wrap--narrow { max-width: 620px; }
header.top { background: var(--card); border-bottom: 1px solid var(--line); }
header.top .inner { max-width: 980px; margin: 0 auto; padding: 14px 16px;
  display: flex; gap: 18px; align-items: center; flex-wrap: wrap; }
header.top .brand { font-weight: 700; letter-spacing: -0.2px; margin-right: auto; }
header.top nav a { color: var(--muted); text-decoration: none; font-weight: 500; }
header.top nav a:hover, header.top nav a.on { color: var(--ink); }
header.top nav { display: flex; gap: 14px; flex-wrap: wrap; }
h1 { font-size: 22px; margin: 0 0 4px; letter-spacing: -0.3px; }
h2 { font-size: 16px; margin: 28px 0 10px; }
p.sub { color: var(--muted); margin: 0 0 20px; }
.card { background: var(--card); border: 1px solid var(--line); border-radius: var(--radius);
  padding: 18px; margin-bottom: 16px; }
.grid { display: grid; gap: 16px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); }
.kpi .value { font-size: 32px; font-weight: 700; letter-spacing: -1px; }
.kpi .name { color: var(--muted); font-size: 13px; text-transform: uppercase; letter-spacing: .4px; }
.kpi .note { color: var(--muted); font-size: 13px; }
table { width: 100%; border-collapse: collapse; font-size: 14px; }
th, td { text-align: left; padding: 9px 10px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { color: var(--muted); font-weight: 600; font-size: 12px; text-transform: uppercase; letter-spacing: .4px; }
td.num, th.num { text-align: right; font-variant-numeric: tabular-nums; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.tag.promoter { background: #e4f5ec; color: var(--ok); }
.tag.passive { background: #fdf3e0; color: var(--warn); }
.tag.detractor { background: #fdeae7; color: var(--bad); }
.bar { display: flex; height: 10px; border-radius: 999px; overflow: hidden; background: var(--line); }
.bar span { display: block; }
.bar .p { background: var(--ok); } .bar .n { background: #f0b429; } .bar .d { background: var(--bad); }
.btn { display: inline-block; background: var(--accent); color: #fff; border: 0; border-radius: 8px;
  padding: 10px 16px; font-size: 15px; font-weight: 600; cursor: pointer; text-decoration: none; }
.btn:hover { filter: brightness(1.06); }
.btn.ghost { background: transparent; color: var(--accent); border: 1px solid var(--line); }
input[type=text], input[type=password], input[type=email], textarea, select {
  width: 100%; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px;
  font: inherit; background: #fff; color: inherit; }
label { display: block; font-weight: 600; font-size: 13px; margin: 12px 0 4px; }
label .hint { font-weight: 400; color: var(--muted); }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.muted { color: var(--muted); }
.small { font-size: 13px; }
.flash { background: #e8effd; border: 1px solid #c7d7fb; color: #1c3f9e;
  padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
pre { background: #0f1115; color: #e6e9ef; padding: 12px; border-radius: 8px; overflow-x: auto; }
.scale { display: grid; grid-template-columns: repeat(11, 1fr); gap: 6px; margin: 10px 0 6px; }
.scale label { margin: 0; }
.scale input { position: absolute; opacity: 0; pointer-events: none; }
.scale span { display: block; text-align: center; padding: 14px 0; border: 1px solid var(--line);
  border-radius: 8px; background: #fff; cursor: pointer; font-weight: 600; font-size: 16px; }
.scale input:checked + span { background: var(--accent); border-color: var(--accent); color: #fff; }
.scale input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
.scale-ends { display: flex; justify-content: space-between; color: var(--muted); font-size: 13px; }
.spark { display: flex; gap: 4px; align-items: flex-end; height: 70px; }
.spark div { flex: 1; max-width: 72px; background: var(--accent); border-radius: 3px 3px 0 0; min-height: 2px; opacity: .85; }
.spark-labels div { max-width: 72px; }
.spark-labels { display: flex; gap: 4px; color: var(--muted); font-size: 11px; }
.spark-labels div { flex: 1; text-align: center; }
@media (max-width: 620px) {
  .scale { grid-template-columns: repeat(6, 1fr); }
  .scale span { padding: 10px 0; font-size: 14px; }
}
`;

export function page({ title, body, nav = '', narrow = false }) {
  return `<!doctype html>
<html lang="ro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>${CSS}</style>
</head>
<body>
${nav}
<main class="wrap${narrow ? ' wrap--narrow' : ''}">
${body}
</main>
</body>
</html>`;
}

export function adminNav(active = '') {
  const link = (href, key, text) =>
    `<a href="${href}"${active === key ? ' class="on"' : ''}>${text}</a>`;
  return `<header class="top"><div class="inner">
    <span class="brand">Equil NPS</span>
    <nav>
      ${link('/admin', 'home', 'Dashboard')}
      ${link('/admin/campanii', 'campaigns', 'Campanii')}
      ${link('/admin/raspunsuri', 'responses', 'Răspunsuri')}
      <a href="/admin/logout">Ieșire</a>
    </nav>
  </div></header>`;
}
