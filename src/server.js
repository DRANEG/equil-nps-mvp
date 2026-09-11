import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { openDb } from './db.js';
import { createMailer } from './mailer.js';
import { startScheduler } from './scheduler.js';
import { html, send, redirect, json } from './http.js';
import { noticePage } from './views/survey.js';
import * as pub from './routes/public.js';
import * as admin from './routes/admin.js';

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

// Fisierele statice ale aplicatiei instalabile (PWA). Se citesc o data si raman
// in memorie: sunt mici si nu se schimba in timpul rularii.
const STATIC_FILES = {
  '/manifest.webmanifest': ['manifest.webmanifest', 'application/manifest+json; charset=utf-8', 'public, max-age=3600'],
  '/sw.js': ['sw.js', 'text/javascript; charset=utf-8', 'no-cache'],
  '/sondaj.js': ['sondaj.js', 'text/javascript; charset=utf-8', 'public, max-age=3600'],
  '/icons/icon-192.png': ['icons/icon-192.png', 'image/png', 'public, max-age=604800'],
  '/icons/icon-512.png': ['icons/icon-512.png', 'image/png', 'public, max-age=604800'],
  '/icons/icon-maskable-512.png': ['icons/icon-maskable-512.png', 'image/png', 'public, max-age=604800'],
};

const staticCache = new Map();

function serveStatic(res, pathname) {
  const entry = STATIC_FILES[pathname];
  if (!entry) return false;
  const [file, type, cacheControl] = entry;
  if (!staticCache.has(pathname)) {
    staticCache.set(pathname, readFileSync(join(PUBLIC_DIR, file)));
  }
  const body = staticCache.get(pathname);
  send(res, 200, body, {
    'Content-Type': type,
    'Cache-Control': cacheControl,
    'Content-Length': body.length,
  });
  return true;
}

// Tabela de rutare: metoda + sablon de cale (":x" devine parametru).
const ROUTES = [
  ['GET', '/', pub.home],
  ['GET', '/healthz', (req, res) => json(res, 200, { ok: true })],
  ['GET', '/s/:slug', pub.surveyBySlug],
  ['GET', '/r/:token', pub.surveyByToken],
  ['POST', '/raspunde', pub.submitResponse],
  ['POST', '/api/raspunsuri', pub.submitResponseApi],
  ['GET', '/multumim', pub.thanks],
  ['GET', '/offline', pub.offline],
  ['GET', '/dezabonare/:token', pub.unsubscribeForm],
  ['POST', '/dezabonare/:token', pub.unsubscribe],

  ['GET', '/admin/login', admin.loginForm],
  ['POST', '/admin/login', admin.login],
  ['GET', '/admin/logout', admin.logout],

  ['GET', '/admin', admin.dashboard, true],
  ['GET', '/admin/campanii', admin.campaignsList, true],
  ['POST', '/admin/campanii', admin.campaignCreate, true],
  ['GET', '/admin/campanii/:id', admin.campaignDetail, true],
  ['POST', '/admin/campanii/:id/status', admin.campaignStatus, true],
  ['POST', '/admin/campanii/:id/invitatii', admin.invitesCreate, true],
  ['POST', '/admin/campanii/:id/trimite', admin.campaignSendNow, true],
  ['POST', '/admin/campanii/:id/auto', admin.campaignAutoSend, true],
  ['POST', '/admin/campanii/:id/intrebari', admin.questionCreate, true],
  ['POST', '/admin/campanii/:id/intrebari-standard', admin.questionsStandard, true],
  ['POST', '/admin/intrebari/:id/sterge', admin.questionDelete, true],
  ['POST', '/admin/intrebari/:id/muta', admin.questionMove, true],
  ['GET', '/admin/locatii', admin.locationsList, true],
  ['POST', '/admin/locatii', admin.locationCreate, true],
  ['POST', '/admin/locatii/:id/status', admin.locationStatus, true],
  ['GET', '/admin/afise', admin.posters, true],
  ['GET', '/admin/qr.svg', admin.qrImage, true],
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

export function createApp({ db, adminToken, publicUrl, mailer = null }) {
  return async function handler(req, res) {
    const url = new URL(req.url, publicUrl);
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, '') : url.pathname;

    if (req.method === 'GET' && serveStatic(res, pathname)) return;

    for (const [method, pattern, handlerFn, needsAuth] of ROUTES) {
      if (method !== req.method) continue;
      const params = match(pattern, pathname);
      if (!params) continue;
      if (needsAuth && !admin.isAuthenticated(req, adminToken)) {
        return redirect(res, '/admin/login');
      }
      try {
        return await handlerFn(req, res, { db, params, url, adminToken, publicUrl, mailer });
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
  const mailer = createMailer();
  const server = createServer(createApp({ db, adminToken, publicUrl, mailer }));
  let stopScheduler = () => {};
  server.listen(port, () => {
    console.log(`Equil NPS porneste pe ${publicUrl} (port ${port})`);
    console.log(`Administrare: ${publicUrl}/admin`);
    console.log(`Email: ${mailer.description}`);
    if (adminToken === 'admin' || adminToken === 'schimba-ma') {
      console.warn('ATENȚIE: ADMIN_TOKEN are valoarea implicită. Schimb-o înainte de producție.');
    }
    if (process.env.SEND_ENABLED === '0') {
      console.log('Robotul de trimitere este oprit (SEND_ENABLED=0).');
    } else {
      stopScheduler = startScheduler(db, { mailer, publicUrl });
    }
  });
  return { server, db, mailer, stopScheduler };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
