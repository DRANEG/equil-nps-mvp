// Obligatiile GDPR pe care le poate acoperi programul: nota de informare,
// pastrarea datelor doar cat e nevoie, dreptul la stergere si la acces.
import { listAnswers } from './db.js';

export function operatorFromEnv(env = process.env) {
  return {
    nume: env.OPERATOR_NAME || '',
    cui: env.OPERATOR_CUI || '',
    adresa: env.OPERATOR_ADDRESS || '',
    email: env.OPERATOR_EMAIL || env.MAIL_REPLY_TO || '',
    telefon: env.OPERATOR_PHONE || '',
    dpo: env.DPO_EMAIL || '',
    // Cat timp pastram datele cu nume si email (statisticile raman, anonimizate).
    luniRetentie: Number(env.DATA_RETENTION_MONTHS) || 24,
  };
}

export function operatorConfigurat(operator) {
  return Boolean(operator.nume && operator.email);
}

/* ------------------------------ dreptul de acces ------------------------------ */

export function findContactByEmail(db, email) {
  return db.prepare('SELECT * FROM contacts WHERE email = ?').get(String(email).trim().toLowerCase());
}

// Tot ce stim despre o persoana, intr-un singur obiect (art. 15 GDPR).
export function exportContactData(db, contactId) {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
  if (!contact) return null;

  const invites = db
    .prepare(
      `SELECT i.token, i.sent_at, i.reminder_sent_at, i.responded_at, c.name AS campanie
       FROM invites i JOIN campaigns c ON c.id = i.campaign_id
       WHERE i.contact_id = ? ORDER BY i.created_at`,
    )
    .all(contactId);

  const responses = db
    .prepare(
      `SELECT r.id, r.score, r.category, r.comment, r.source, r.created_at, r.closed_at,
              c.name AS campanie, l.name AS locatie
       FROM responses r
       JOIN campaigns c ON c.id = r.campaign_id
       LEFT JOIN locations l ON l.id = r.location_id
       WHERE r.contact_id = ? ORDER BY r.created_at`,
    )
    .all(contactId)
    .map((r) => ({ ...r, raspunsuri: listAnswers(db, r.id).map((a) => ({ intrebare: a.text, raspuns: a.value })) }));

  const emails = db
    .prepare(
      `SELECT e.kind, e.recipient, e.status, e.created_at FROM email_log e
       JOIN invites i ON i.id = e.invite_id WHERE i.contact_id = ? ORDER BY e.created_at`,
    )
    .all(contactId);

  return {
    exportat_la: new Date().toISOString(),
    contact: {
      email: contact.email,
      nume: contact.name,
      telefon: contact.phone,
      companie: contact.company,
      segment: contact.segment,
      adaugat_la: contact.created_at,
      dezabonat_la: contact.unsubscribed_at,
    },
    invitatii: invites,
    raspunsuri: responses,
    emailuri_trimise: emails,
  };
}

/* ----------------------------- dreptul la stergere ---------------------------- */

// Stergem datele personale, dar pastram scorul si comentariul, fara legatura cu
// persoana: statistica ramane corecta, iar datele nu mai identifica pe nimeni.
export function anonymizeContact(db, contactId) {
  const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(contactId);
  if (!contact) return null;

  const raspunsuri = db
    .prepare("UPDATE responses SET contact_id = NULL, source = 'anonimizat' WHERE contact_id = ?")
    .run(contactId).changes;
  const invitatii = db.prepare('DELETE FROM invites WHERE contact_id = ?').run(contactId).changes;
  db.prepare('DELETE FROM contacts WHERE id = ?').run(contactId);

  return { email: contact.email, raspunsuri, invitatii };
}

// Comentariile pot contine date personale scrise de om ("sunt Ion de la X").
// La cerere expresa, se pot sterge si ele.
export function eraseComments(db, contactId) {
  return db.prepare('UPDATE responses SET comment = NULL WHERE contact_id = ?').run(contactId).changes;
}

/* -------------------------- pastrarea datelor (retentie) ---------------------- */

// Dupa perioada de retentie, raspunsurile raman pentru statistica, dar fara
// legatura cu persoana; contactele ramase fara nicio urma se sterg.
export function runRetention(db, { months = 24, now = null } = {}) {
  const limita = `-${Math.max(1, Math.round(months))} months`;

  const raspunsuri = db
    .prepare(
      `UPDATE responses SET contact_id = NULL, source = 'anonimizat'
       WHERE contact_id IS NOT NULL AND created_at < datetime(${now ? '?' : "'now'"}, ?)`,
    )
    .run(...(now ? [now, limita] : [limita])).changes;

  const invitatii = db
    .prepare(`DELETE FROM invites WHERE created_at < datetime(${now ? '?' : "'now'"}, ?)`)
    .run(...(now ? [now, limita] : [limita])).changes;

  const contacte = db
    .prepare(
      `DELETE FROM contacts WHERE id NOT IN (SELECT contact_id FROM invites WHERE contact_id IS NOT NULL)
         AND id NOT IN (SELECT contact_id FROM responses WHERE contact_id IS NOT NULL)`,
    )
    .run().changes;

  return { raspunsuri, invitatii, contacte };
}
