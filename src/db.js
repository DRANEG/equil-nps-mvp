import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS campaigns (
  id          INTEGER PRIMARY KEY,
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  question    TEXT NOT NULL,
  followup    TEXT NOT NULL,
  active      INTEGER NOT NULL DEFAULT 1,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contacts (
  id          INTEGER PRIMARY KEY,
  email       TEXT NOT NULL UNIQUE,
  name        TEXT,
  company     TEXT,
  segment     TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Un rand per (campanie, contact): tokenul din link identifica respondentul.
CREATE TABLE IF NOT EXISTS invites (
  id           INTEGER PRIMARY KEY,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  contact_id   INTEGER NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  token        TEXT NOT NULL UNIQUE,
  sent_at      TEXT,
  responded_at TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (campaign_id, contact_id)
);

CREATE TABLE IF NOT EXISTS responses (
  id           INTEGER PRIMARY KEY,
  campaign_id  INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  invite_id    INTEGER UNIQUE REFERENCES invites(id) ON DELETE SET NULL,
  contact_id   INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  score        INTEGER NOT NULL CHECK (score BETWEEN 0 AND 10),
  category     TEXT NOT NULL,
  comment      TEXT,
  source       TEXT NOT NULL DEFAULT 'link',
  closed_at    TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Locatiile fizice (magazin, cabinet, punct de lucru). Fiecare are codul ei QR,
-- ca sa stii din ce loc vine feedbackul.
CREATE TABLE IF NOT EXISTS locations (
  id         INTEGER PRIMARY KEY,
  slug       TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL,
  address    TEXT,
  active     INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Intrebari suplimentare, in afara de scorul NPS: rating 1-5, alegere sau text liber.
CREATE TABLE IF NOT EXISTS questions (
  id          INTEGER PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL DEFAULT 0,
  kind        TEXT NOT NULL,
  text        TEXT NOT NULL,
  options     TEXT,
  topic       TEXT,
  required    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS answers (
  id          INTEGER PRIMARY KEY,
  response_id INTEGER NOT NULL REFERENCES responses(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  value       TEXT NOT NULL,
  UNIQUE (response_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_questions_campaign ON questions(campaign_id, position);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- Alertele trimise la aparitia unui detractor (email, webhook).
CREATE TABLE IF NOT EXISTS alert_log (
  id          INTEGER PRIMARY KEY,
  response_id INTEGER REFERENCES responses(id) ON DELETE CASCADE,
  channel     TEXT NOT NULL,
  target      TEXT,
  status      TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_alert_log_created ON alert_log(created_at);

-- Istoricul trimiterilor: fiecare incercare, reusita sau nu.
CREATE TABLE IF NOT EXISTS email_log (
  id          INTEGER PRIMARY KEY,
  invite_id   INTEGER REFERENCES invites(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  recipient   TEXT NOT NULL,
  status      TEXT NOT NULL,
  detail      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_email_log_invite ON email_log(invite_id, created_at);
CREATE INDEX IF NOT EXISTS idx_responses_campaign ON responses(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invites_campaign ON invites(campaign_id);
`;

// Coloane adaugate dupa prima versiune; se aplica si peste o baza existenta.
const MIGRATIONS = [
  ['campaigns', 'auto_send', 'INTEGER NOT NULL DEFAULT 1'],
  ['campaigns', 'intro', 'TEXT'],
  ['contacts', 'unsubscribed_at', 'TEXT'],
  ['invites', 'reminder_sent_at', 'TEXT'],
  ['invites', 'send_error', 'TEXT'],
  ['responses', 'location_id', 'INTEGER REFERENCES locations(id) ON DELETE SET NULL'],
  ['responses', 'alerted_at', 'TEXT'],
  ['campaigns', 'alert_detractors', 'INTEGER NOT NULL DEFAULT 1'],
];

export function openDb(file = process.env.NPS_DB || './data/nps.db') {
  if (file !== ':memory:') {
    mkdirSync(dirname(resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
  for (const [table, column, definition] of MIGRATIONS) {
    const columns = db.prepare(`PRAGMA table_info(${table})`).all();
    if (!columns.some((c) => c.name === column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  return db;
}

export function newToken() {
  return randomBytes(16).toString('base64url');
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'campanie';
}

/* ---------------------------------- campanii --------------------------------- */

export const DEFAULT_QUESTION =
  'Cât de probabil este să ne recomanzi unui prieten sau coleg?';
export const DEFAULT_FOLLOWUP = 'Care este principalul motiv pentru scorul acordat?';

export function createCampaign(db, { name, question, followup, slug, intro = null }) {
  let base = slug ? slugify(slug) : slugify(name);
  let candidate = base;
  let i = 2;
  while (getCampaignBySlug(db, candidate)) {
    candidate = `${base}-${i++}`;
  }
  const info = db
    .prepare('INSERT INTO campaigns (slug, name, question, followup, intro) VALUES (?, ?, ?, ?, ?)')
    .run(candidate, name, question || DEFAULT_QUESTION, followup || DEFAULT_FOLLOWUP, intro);
  return getCampaign(db, Number(info.lastInsertRowid));
}

export function getCampaign(db, id) {
  return db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id);
}

export function getCampaignBySlug(db, slug) {
  return db.prepare('SELECT * FROM campaigns WHERE slug = ?').get(slug);
}

export function listCampaigns(db) {
  return db
    .prepare(
      `SELECT c.*,
              (SELECT COUNT(*) FROM invites i WHERE i.campaign_id = c.id)   AS invites,
              (SELECT COUNT(*) FROM responses r WHERE r.campaign_id = c.id) AS responses
       FROM campaigns c
       ORDER BY c.active DESC, c.created_at DESC, c.id DESC`,
    )
    .all();
}

export function setCampaignActive(db, id, active) {
  db.prepare('UPDATE campaigns SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

export function setCampaignAutoSend(db, id, autoSend) {
  db.prepare('UPDATE campaigns SET auto_send = ? WHERE id = ?').run(autoSend ? 1 : 0, id);
}

export function setCampaignAlerts(db, id, alerts) {
  db.prepare('UPDATE campaigns SET alert_detractors = ? WHERE id = ?').run(alerts ? 1 : 0, id);
}

/* ---------------------------------- contacte --------------------------------- */

export function upsertContact(db, { email, name, company, segment }) {
  const clean = String(email).trim().toLowerCase();
  db.prepare(
    `INSERT INTO contacts (email, name, company, segment) VALUES (?, ?, ?, ?)
     ON CONFLICT(email) DO UPDATE SET
       name    = COALESCE(NULLIF(excluded.name, ''), contacts.name),
       company = COALESCE(NULLIF(excluded.company, ''), contacts.company),
       segment = COALESCE(NULLIF(excluded.segment, ''), contacts.segment)`,
  ).run(clean, name || null, company || null, segment || null);
  return db.prepare('SELECT * FROM contacts WHERE email = ?').get(clean);
}

/* --------------------------------- invitatii --------------------------------- */

// Creeaza (sau refoloseste) invitatia unui contact intr-o campanie.
export function createInvite(db, campaignId, contactId) {
  const existing = db
    .prepare('SELECT * FROM invites WHERE campaign_id = ? AND contact_id = ?')
    .get(campaignId, contactId);
  if (existing) return existing;
  const info = db
    .prepare('INSERT INTO invites (campaign_id, contact_id, token) VALUES (?, ?, ?)')
    .run(campaignId, contactId, newToken());
  return db.prepare('SELECT * FROM invites WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function getInviteByToken(db, token) {
  return db
    .prepare(
      `SELECT i.*, c.email, c.name AS contact_name, c.company, c.segment,
              ca.slug, ca.name AS campaign_name, ca.question, ca.followup, ca.active
       FROM invites i
       JOIN contacts c  ON c.id  = i.contact_id
       JOIN campaigns ca ON ca.id = i.campaign_id
       WHERE i.token = ?`,
    )
    .get(token);
}

export function listInvites(db, campaignId) {
  return db
    .prepare(
      `SELECT i.*, c.email, c.name AS contact_name, c.company, c.segment,
              c.unsubscribed_at, r.score, r.comment
       FROM invites i
       JOIN contacts c ON c.id = i.contact_id
       LEFT JOIN responses r ON r.invite_id = i.id
       WHERE i.campaign_id = ?
       ORDER BY i.created_at DESC`,
    )
    .all(campaignId);
}

export function markInvitesSent(db, campaignId) {
  db.prepare(
    "UPDATE invites SET sent_at = datetime('now') WHERE campaign_id = ? AND sent_at IS NULL",
  ).run(campaignId);
}

/* --------------------------------- raspunsuri -------------------------------- */

export function saveResponse(db, {
  campaignId, inviteId = null, contactId = null, score, category, comment,
  source = 'link', locationId = null,
}) {
  const info = db
    .prepare(
      `INSERT INTO responses (campaign_id, invite_id, contact_id, score, category, comment, source, location_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(invite_id) DO UPDATE SET
         score = excluded.score, category = excluded.category,
         comment = COALESCE(NULLIF(excluded.comment, ''), responses.comment),
         location_id = COALESCE(excluded.location_id, responses.location_id),
         created_at = datetime('now')`,
    )
    .run(campaignId, inviteId, contactId, score, category, comment || null, source, locationId);
  if (inviteId) {
    db.prepare("UPDATE invites SET responded_at = datetime('now') WHERE id = ?").run(inviteId);
    return db.prepare('SELECT * FROM responses WHERE invite_id = ?').get(inviteId);
  }
  return db.prepare('SELECT * FROM responses WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function listResponses(db, { campaignId = null, limit = null, category = null } = {}) {
  const where = [];
  const params = [];
  if (campaignId) {
    where.push('r.campaign_id = ?');
    params.push(campaignId);
  }
  if (category) {
    where.push('r.category = ?');
    params.push(category);
  }
  let sql = `SELECT r.*, c.email, c.name AS contact_name, c.company, c.segment,
                    ca.name AS campaign_name, ca.slug
             FROM responses r
             LEFT JOIN contacts c ON c.id = r.contact_id
             JOIN campaigns ca ON ca.id = r.campaign_id`;
  if (where.length) sql += ` WHERE ${where.join(' AND ')}`;
  sql += ' ORDER BY r.created_at DESC, r.id DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(limit);
  }
  return db.prepare(sql).all(...params);
}

export function markResponseClosed(db, id, closed) {
  db.prepare('UPDATE responses SET closed_at = ? WHERE id = ?').run(
    closed ? new Date().toISOString().slice(0, 19).replace('T', ' ') : null,
    id,
  );
}

// Evolutia lunara a NPS-ului, pentru graficul din dashboard.
export function monthlyTrend(db, campaignId = null, months = 12) {
  const params = [];
  let sql = `SELECT strftime('%Y-%m', created_at) AS month,
                    COUNT(*) AS total,
                    SUM(CASE WHEN category = 'promoter'  THEN 1 ELSE 0 END) AS promoters,
                    SUM(CASE WHEN category = 'detractor' THEN 1 ELSE 0 END) AS detractors
             FROM responses`;
  if (campaignId) {
    sql += ' WHERE campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' GROUP BY month ORDER BY month DESC LIMIT ?';
  params.push(months);
  return db
    .prepare(sql)
    .all(...params)
    .map((row) => ({
      month: row.month,
      total: row.total,
      nps: row.total ? Math.round(((row.promoters - row.detractors) / row.total) * 100) : null,
    }))
    .reverse();
}

// Defalcare pe un camp din contacte (segment / companie), pentru tabelul de breakdown.
export function breakdownBy(db, field, campaignId = null) {
  if (!['segment', 'company'].includes(field)) throw new Error(`Camp nepermis: ${field}`);
  const params = [];
  let sql = `SELECT COALESCE(NULLIF(c.${field}, ''), '(nespecificat)') AS bucket,
                    COUNT(*) AS total,
                    SUM(CASE WHEN r.category = 'promoter'  THEN 1 ELSE 0 END) AS promoters,
                    SUM(CASE WHEN r.category = 'passive'   THEN 1 ELSE 0 END) AS passives,
                    SUM(CASE WHEN r.category = 'detractor' THEN 1 ELSE 0 END) AS detractors
             FROM responses r
             LEFT JOIN contacts c ON c.id = r.contact_id`;
  if (campaignId) {
    sql += ' WHERE r.campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' GROUP BY bucket ORDER BY total DESC';
  return db
    .prepare(sql)
    .all(...params)
    .map((row) => ({
      ...row,
      nps: row.total ? Math.round(((row.promoters - row.detractors) / row.total) * 100) : null,
    }));
}

/* ----------------------------------- email ----------------------------------- */

// Invitatii care asteapta sa fie trimise. `delayMinutes` lasa timp de corectat
// lista dupa import, inainte ca robotul sa trimita ceva.
export function pendingInvitations(db, { campaignId = null, limit = 50, delayMinutes = 0, onlyAutoSend = true } = {}) {
  const params = [];
  let sql = `SELECT i.id, i.token, i.campaign_id, c.email, c.name AS contact_name, c.company,
                    ca.name AS campaign_name, ca.question, ca.intro, ca.slug
             FROM invites i
             JOIN contacts c   ON c.id  = i.contact_id
             JOIN campaigns ca ON ca.id = i.campaign_id
             WHERE i.sent_at IS NULL
               AND ca.active = 1
               AND c.unsubscribed_at IS NULL`;
  if (onlyAutoSend) sql += ' AND ca.auto_send = 1';
  if (campaignId) {
    sql += ' AND i.campaign_id = ?';
    params.push(campaignId);
  }
  if (delayMinutes > 0) {
    sql += " AND i.created_at <= datetime('now', ?)";
    params.push(`-${Math.round(delayMinutes)} minutes`);
  }
  sql += ' ORDER BY i.created_at LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

// Invitatii trimise, fara raspuns, mai vechi de `days` zile si fara reminder.
export function pendingReminders(db, { campaignId = null, limit = 50, days = 5, onlyAutoSend = true } = {}) {
  const params = [`-${Number(days)} days`];
  let sql = `SELECT i.id, i.token, i.campaign_id, i.sent_at, c.email, c.name AS contact_name, c.company,
                    ca.name AS campaign_name, ca.question, ca.intro, ca.slug
             FROM invites i
             JOIN contacts c   ON c.id  = i.contact_id
             JOIN campaigns ca ON ca.id = i.campaign_id
             WHERE i.sent_at IS NOT NULL
               AND i.responded_at IS NULL
               AND i.reminder_sent_at IS NULL
               AND i.sent_at <= datetime('now', ?)
               AND ca.active = 1
               AND c.unsubscribed_at IS NULL`;
  if (onlyAutoSend) sql += ' AND ca.auto_send = 1';
  if (campaignId) {
    sql += ' AND i.campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' ORDER BY i.sent_at LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

// Rezervarea unei invitatii inainte de trimitere. Marcajul se pune INAINTE de
// email, cu conditia ca nimeni sa nu-l fi pus deja: asa, daca robotul din server
// si butonul manual (sau un cron) ruleaza in acelasi timp, doar unul trimite.
export function claimInviteForSend(db, inviteId) {
  const info = db
    .prepare("UPDATE invites SET sent_at = datetime('now'), send_error = NULL WHERE id = ? AND sent_at IS NULL")
    .run(inviteId);
  return info.changes === 1;
}

// Daca trimiterea esueaza, punem la loc marcajul ca sa poata fi reincercata.
export function releaseInviteSend(db, inviteId) {
  db.prepare('UPDATE invites SET sent_at = NULL WHERE id = ?').run(inviteId);
}

export function claimReminder(db, inviteId) {
  const info = db
    .prepare("UPDATE invites SET reminder_sent_at = datetime('now'), send_error = NULL WHERE id = ? AND reminder_sent_at IS NULL")
    .run(inviteId);
  return info.changes === 1;
}

export function releaseReminder(db, inviteId) {
  db.prepare('UPDATE invites SET reminder_sent_at = NULL WHERE id = ?').run(inviteId);
}

export function markInviteSent(db, inviteId) {
  db.prepare("UPDATE invites SET sent_at = datetime('now'), send_error = NULL WHERE id = ?").run(inviteId);
}

export function markReminderSent(db, inviteId) {
  db.prepare("UPDATE invites SET reminder_sent_at = datetime('now'), send_error = NULL WHERE id = ?").run(inviteId);
}

export function markSendError(db, inviteId, message) {
  db.prepare('UPDATE invites SET send_error = ? WHERE id = ?').run(String(message).slice(0, 500), inviteId);
}

export function logEmail(db, { inviteId = null, kind, recipient, status, detail = null }) {
  db.prepare(
    'INSERT INTO email_log (invite_id, kind, recipient, status, detail) VALUES (?, ?, ?, ?, ?)',
  ).run(inviteId, kind, recipient, status, detail ? String(detail).slice(0, 500) : null);
}

export function listEmailLog(db, { campaignId = null, limit = 20 } = {}) {
  const params = [];
  let sql = `SELECT e.* FROM email_log e`;
  if (campaignId) {
    sql += ' JOIN invites i ON i.id = e.invite_id WHERE i.campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' ORDER BY e.created_at DESC, e.id DESC LIMIT ?';
  params.push(limit);
  return db.prepare(sql).all(...params);
}

export function emailStats(db, campaignId) {
  return db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN i.sent_at IS NULL THEN 1 ELSE 0 END)          AS de_trimis,
         SUM(CASE WHEN i.sent_at IS NOT NULL THEN 1 ELSE 0 END)      AS trimise,
         SUM(CASE WHEN i.reminder_sent_at IS NOT NULL THEN 1 ELSE 0 END) AS remindere,
         SUM(CASE WHEN i.send_error IS NOT NULL THEN 1 ELSE 0 END)   AS erori,
         SUM(CASE WHEN c.unsubscribed_at IS NOT NULL THEN 1 ELSE 0 END) AS dezabonati
       FROM invites i
       JOIN contacts c ON c.id = i.contact_id
       WHERE i.campaign_id = ?`,
    )
    .get(campaignId);
}

export function unsubscribeByToken(db, token) {
  const invite = getInviteByToken(db, token);
  if (!invite) return null;
  db.prepare("UPDATE contacts SET unsubscribed_at = datetime('now') WHERE id = ?").run(invite.contact_id);
  return invite;
}

/* ---------------------------------- locatii ---------------------------------- */

export function createLocation(db, { name, address = null, slug = null }) {
  let base = slugify(slug || name);
  let candidate = base;
  let i = 2;
  while (getLocationBySlug(db, candidate)) candidate = `${base}-${i++}`;
  const info = db
    .prepare('INSERT INTO locations (slug, name, address) VALUES (?, ?, ?)')
    .run(candidate, name, address);
  return db.prepare('SELECT * FROM locations WHERE id = ?').get(Number(info.lastInsertRowid));
}

export function getLocationBySlug(db, slug) {
  return db.prepare('SELECT * FROM locations WHERE slug = ?').get(slug);
}

export function listLocations(db, { onlyActive = false } = {}) {
  const where = onlyActive ? 'WHERE l.active = 1' : '';
  return db
    .prepare(
      `SELECT l.*, (SELECT COUNT(*) FROM responses r WHERE r.location_id = l.id) AS responses
       FROM locations l ${where} ORDER BY l.active DESC, l.name`,
    )
    .all();
}

export function setLocationActive(db, id, active) {
  db.prepare('UPDATE locations SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
}

// NPS pe locatie, pentru dashboard: unde anume e problema.
export function breakdownByLocation(db, campaignId = null) {
  const params = [];
  let sql = `SELECT COALESCE(l.name, '(fără locație)') AS bucket,
                    COUNT(*) AS total,
                    SUM(CASE WHEN r.category = 'promoter'  THEN 1 ELSE 0 END) AS promoters,
                    SUM(CASE WHEN r.category = 'passive'   THEN 1 ELSE 0 END) AS passives,
                    SUM(CASE WHEN r.category = 'detractor' THEN 1 ELSE 0 END) AS detractors
             FROM responses r
             LEFT JOIN locations l ON l.id = r.location_id`;
  if (campaignId) {
    sql += ' WHERE r.campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' GROUP BY bucket ORDER BY total DESC';
  return db
    .prepare(sql)
    .all(...params)
    .map((row) => ({
      ...row,
      nps: row.total ? Math.round(((row.promoters - row.detractors) / row.total) * 100) : null,
    }));
}

/* --------------------------------- intrebari --------------------------------- */

export const QUESTION_KINDS = ['rating', 'choice', 'text'];

// Setul propus la un click: cate o intrebare despre produs, experienta si locatie.
export const STANDARD_QUESTIONS = [
  { kind: 'rating', topic: 'produs', text: 'Cât de mulțumit ești de produsul în sine?', required: 1 },
  { kind: 'rating', topic: 'experienta', text: 'Cum a fost experiența cu echipa noastră?', required: 1 },
  { kind: 'rating', topic: 'locatie', text: 'Cât de ușor a fost să ajungi la noi (acces, parcare, program)?', required: 0 },
  {
    kind: 'choice', topic: 'experienta', text: 'Ce ți-a plăcut cel mai mult?',
    options: ['Produsul', 'Oamenii', 'Rapiditatea', 'Prețul', 'Altceva'], required: 0,
  },
  { kind: 'text', topic: 'produs', text: 'Ce ar trebui să îmbunătățim primul?', required: 0 },
];

export function addQuestion(db, campaignId, { kind, text, options = null, topic = null, required = false }) {
  if (!QUESTION_KINDS.includes(kind)) throw new Error(`Tip de întrebare necunoscut: ${kind}`);
  const next = db
    .prepare('SELECT COALESCE(MAX(position), 0) + 1 AS p FROM questions WHERE campaign_id = ?')
    .get(campaignId).p;
  const info = db
    .prepare(
      'INSERT INTO questions (campaign_id, position, kind, text, options, topic, required) VALUES (?, ?, ?, ?, ?, ?, ?)',
    )
    .run(campaignId, next, kind, text, options ? JSON.stringify(options) : null, topic, required ? 1 : 0);
  return getQuestion(db, Number(info.lastInsertRowid));
}

export function addStandardQuestions(db, campaignId) {
  for (const q of STANDARD_QUESTIONS) addQuestion(db, campaignId, q);
  return listQuestions(db, campaignId);
}

function hydrate(row) {
  if (!row) return row;
  return { ...row, options: row.options ? JSON.parse(row.options) : null };
}

export function getQuestion(db, id) {
  return hydrate(db.prepare('SELECT * FROM questions WHERE id = ?').get(id));
}

export function listQuestions(db, campaignId) {
  return db
    .prepare('SELECT * FROM questions WHERE campaign_id = ? ORDER BY position, id')
    .all(campaignId)
    .map(hydrate);
}

export function deleteQuestion(db, id) {
  db.prepare('DELETE FROM questions WHERE id = ?').run(id);
}

// Mutarea in sus/jos: schimbam pozitia cu vecinul imediat.
export function moveQuestion(db, id, direction) {
  const q = getQuestion(db, id);
  if (!q) return;
  const neighbour = db
    .prepare(
      `SELECT * FROM questions
       WHERE campaign_id = ? AND position ${direction === 'sus' ? '<' : '>'} ?
       ORDER BY position ${direction === 'sus' ? 'DESC' : 'ASC'} LIMIT 1`,
    )
    .get(q.campaign_id, q.position);
  if (!neighbour) return;
  db.prepare('UPDATE questions SET position = ? WHERE id = ?').run(neighbour.position, q.id);
  db.prepare('UPDATE questions SET position = ? WHERE id = ?').run(q.position, neighbour.id);
}

export function saveAnswers(db, responseId, answers) {
  const stmt = db.prepare(
    `INSERT INTO answers (response_id, question_id, value) VALUES (?, ?, ?)
     ON CONFLICT(response_id, question_id) DO UPDATE SET value = excluded.value`,
  );
  for (const { questionId, value } of answers) {
    if (value === null || value === undefined || String(value).trim() === '') continue;
    stmt.run(responseId, questionId, String(value).slice(0, 2000));
  }
}

export function listAnswers(db, responseId) {
  return db
    .prepare(
      `SELECT a.*, q.text, q.kind, q.topic FROM answers a
       JOIN questions q ON q.id = a.question_id
       WHERE a.response_id = ? ORDER BY q.position, q.id`,
    )
    .all(responseId);
}

// Rezultatele agregate: distributie pentru rating/alegere, ultimele texte pentru text liber.
export function questionResults(db, campaignId) {
  return listQuestions(db, campaignId).map((q) => {
    if (q.kind === 'text') {
      const texts = db
        .prepare(
          `SELECT a.value, r.created_at FROM answers a
           JOIN responses r ON r.id = a.response_id
           WHERE a.question_id = ? ORDER BY r.created_at DESC LIMIT 10`,
        )
        .all(q.id);
      return { ...q, total: texts.length, texts };
    }
    const counts = db
      .prepare(
        `SELECT a.value, COUNT(*) AS n FROM answers a
         WHERE a.question_id = ? GROUP BY a.value ORDER BY a.value`,
      )
      .all(q.id);
    const total = counts.reduce((sum, row) => sum + row.n, 0);
    const average =
      q.kind === 'rating' && total
        ? Math.round((counts.reduce((sum, row) => sum + Number(row.value) * row.n, 0) / total) * 10) / 10
        : null;
    return { ...q, total, counts, average };
  });
}

/* ----------------------------------- alerte ---------------------------------- */

// Un raspuns cu tot contextul necesar unei alerte: cine, de unde, ce a scris.
export function getResponseWithContext(db, id) {
  const response = db
    .prepare(
      `SELECT r.*, c.email, c.name AS contact_name, c.company, c.segment,
              ca.name AS campaign_name, ca.slug AS campaign_slug, ca.alert_detractors,
              l.name AS location_name
       FROM responses r
       LEFT JOIN contacts c  ON c.id = r.contact_id
       JOIN campaigns ca     ON ca.id = r.campaign_id
       LEFT JOIN locations l ON l.id = r.location_id
       WHERE r.id = ?`,
    )
    .get(id);
  if (!response) return null;
  return { ...response, answers: listAnswers(db, id) };
}

// Rezervam alerta inainte de trimitere, ca doua procese sa nu alerteze de doua ori.
export function claimAlert(db, responseId) {
  const info = db
    .prepare("UPDATE responses SET alerted_at = datetime('now') WHERE id = ? AND alerted_at IS NULL")
    .run(responseId);
  return info.changes === 1;
}

export function releaseAlert(db, responseId) {
  db.prepare('UPDATE responses SET alerted_at = NULL WHERE id = ?').run(responseId);
}

export function logAlert(db, { responseId, channel, target = null, status, detail = null }) {
  db.prepare(
    'INSERT INTO alert_log (response_id, channel, target, status, detail) VALUES (?, ?, ?, ?, ?)',
  ).run(responseId, channel, target, status, detail ? String(detail).slice(0, 500) : null);
}

export function countAlertsSince(db, minutes) {
  return db
    .prepare(
      `SELECT COUNT(DISTINCT response_id) AS n FROM alert_log
       WHERE status = 'trimis' AND created_at >= datetime('now', ?)`,
    )
    .get(`-${Math.round(minutes)} minutes`).n;
}

export function listAlertLog(db, limit = 20) {
  return db
    .prepare(
      `SELECT a.*, r.score, c.email AS contact_email
       FROM alert_log a
       LEFT JOIN responses r ON r.id = a.response_id
       LEFT JOIN contacts c  ON c.id = r.contact_id
       ORDER BY a.created_at DESC, a.id DESC LIMIT ?`,
    )
    .all(limit);
}

// Detractorii la care nu s-a revenit inca: lista de lucru a echipei.
export function openDetractors(db, { campaignId = null, limit = 50 } = {}) {
  const params = [];
  let sql = `SELECT r.*, c.email, c.name AS contact_name, c.company, c.segment,
                    ca.name AS campaign_name, l.name AS location_name
             FROM responses r
             LEFT JOIN contacts c  ON c.id = r.contact_id
             JOIN campaigns ca     ON ca.id = r.campaign_id
             LEFT JOIN locations l ON l.id = r.location_id
             WHERE r.category = 'detractor' AND r.closed_at IS NULL`;
  if (campaignId) {
    sql += ' AND r.campaign_id = ?';
    params.push(campaignId);
  }
  sql += ' ORDER BY r.created_at DESC, r.id DESC LIMIT ?';
  params.push(limit);
  return db
    .prepare(sql)
    .all(...params)
    .map((row) => ({ ...row, answers: listAnswers(db, row.id) }));
}

export function countOpenDetractors(db) {
  return db
    .prepare("SELECT COUNT(*) AS n FROM responses WHERE category = 'detractor' AND closed_at IS NULL")
    .get().n;
}
