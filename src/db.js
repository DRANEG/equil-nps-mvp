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

CREATE INDEX IF NOT EXISTS idx_responses_campaign ON responses(campaign_id, created_at);
CREATE INDEX IF NOT EXISTS idx_invites_campaign ON invites(campaign_id);
`;

export function openDb(file = process.env.NPS_DB || './data/nps.db') {
  if (file !== ':memory:') {
    mkdirSync(dirname(resolve(file)), { recursive: true });
  }
  const db = new DatabaseSync(file);
  db.exec(SCHEMA);
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

export function createCampaign(db, { name, question, followup, slug }) {
  let base = slug ? slugify(slug) : slugify(name);
  let candidate = base;
  let i = 2;
  while (getCampaignBySlug(db, candidate)) {
    candidate = `${base}-${i++}`;
  }
  const info = db
    .prepare('INSERT INTO campaigns (slug, name, question, followup) VALUES (?, ?, ?, ?)')
    .run(candidate, name, question || DEFAULT_QUESTION, followup || DEFAULT_FOLLOWUP);
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
       ORDER BY c.active DESC, c.created_at DESC`,
    )
    .all();
}

export function setCampaignActive(db, id, active) {
  db.prepare('UPDATE campaigns SET active = ? WHERE id = ?').run(active ? 1 : 0, id);
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
              r.score, r.comment
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

export function saveResponse(db, { campaignId, inviteId = null, contactId = null, score, category, comment, source = 'link' }) {
  const info = db
    .prepare(
      `INSERT INTO responses (campaign_id, invite_id, contact_id, score, category, comment, source)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(invite_id) DO UPDATE SET
         score = excluded.score, category = excluded.category,
         comment = COALESCE(NULLIF(excluded.comment, ''), responses.comment),
         created_at = datetime('now')`,
    )
    .run(campaignId, inviteId, contactId, score, category, comment || null, source);
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
