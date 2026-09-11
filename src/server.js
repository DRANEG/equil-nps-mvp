import { createServer } from 'node:http';
import { openDb } from './db.js';
import { html, send, redirect, json } from './http.js';
import { noticePage } from './views/survey.js';
import * as pub from './routes/public.js';
import * as admin from './routes/admin.js';

// Tabela de rutare: metoda + sablon de cale (":x" devine parametru).
const ROUTES = [
  ['GET', '/', pub.home],
  ['GET', '/healthz', (req, res) => json(res, 200, { ok: true })],
  ['GET', '/s/:slug', pub.surveyBySlug],
  ['GET', '/r/:token', pub.surveyByToken],
  ['POST', '/raspunde', pub.submitResponse],
  ['POST', '/api/raspunsuri', pub.submitResponseApi],
  ['GET', '/multumim', pub.thanks],

  ['GET', '/admin/login', admin.loginForm],
  ['POST', '/admin/login', admin.login],
  ['GET', '/admin/logout', admin.logout],

  ['GET', '/admin', admin.dashboard, true],
  ['GET', '/admin/campanii', admin.campaignsList, true],
  ['POST', '/admin/campanii', admin.campaignCreate, true],
  ['GET', '/admin/campanii/:id', admin.campaignDetail, true],
  ['POST', '/admin/campanii/:id/status', admin.campaignStatus, true],
  ['POST', '/admin/campanii/:id/invitatii', admin.invitesCreate, true],
  ['GET', '/admin/campanii/:id/invitatii.csv', admin.invitesCsv, true],
  ['GET', '/admin/raspunsuri', admin.responsesList, true],
  ['GET', '/admin/raspunsuri.csv', admin.responsesCsv, true],
  ['POST', '/admin/raspunsuri/:id/inchide', admin.responseClose, true],
];

function match(pattern, pathname) {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    if (p.startsWith(':')) {
      if (!pathParts[i]) return null;
      params[p.slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (p !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

export function createApp({ db, adminToken, publicUrl }) {
  return async function handler(req, res) {
    const url = new URL(req.url, publicUrl);
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

    for (const [method, pattern, handlerFn, needsAuth] of ROUTES) {
      if (method !== req.method) continue;
      const params = match(pattern, pathname);
      if (!params) continue;
      if (needsAuth && !admin.isAuthenticated(req, adminToken)) {
        return redirect(res, '/admin/login');
      }
      try {
        return await handlerFn(req, res, { db, params, url, adminToken, publicUrl });
      } catch (err) {
        console.error(`[eroare] ${req.method} ${pathname}`, err);
        if (!res.headersSent) {
          return html(res, 500, noticePage('Eroare internă', 'Ceva nu a mers bine. Încearcă din nou.'));
        }
        return res.end();
      }
    }
    return send(res, 404, 'Pagina nu a fost găsită');
  };
}

export function startServer({
  port = Number(process.env.PORT) || 3000,
  dbFile = process.env.NPS_DB || './data/nps.db',
  adminToken = process.env.ADMIN_TOKEN || 'admin',
  publicUrl = process.env.PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 3000}`,
} = {}) {
  const db = openDb(dbFile);
  const server = createServer(createApp({ db, adminToken, publicUrl }));
  server.listen(port, () => {
    console.log(`Equil NPS porneste pe ${publicUrl} (port ${port})`);
    console.log(`Administrare: ${publicUrl}/admin`);
    if (adminToken === 'admin' || adminToken === 'schimba-ma') {
      console.warn('ATENȚIE: ADMIN_TOKEN are valoarea implicită. Schimb-o înainte de producție.');
    }
  });
  return { server, db };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
