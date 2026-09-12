// Curatenia GDPR rulata separat (cron), pentru cine tine robotul oprit.
// Exemplu: 30 3 * * * cd /opt/equil-nps && npm run retentie
import { openDb } from './db.js';
import { runRetention, operatorFromEnv } from './gdpr.js';

const db = openDb();
const { luniRetentie } = operatorFromEnv();
const rezultat = runRetention(db, { months: luniRetentie });

console.log(
  `Păstrare ${luniRetentie} luni — ${rezultat.raspunsuri} răspunsuri anonimizate, ` +
    `${rezultat.invitatii} invitații șterse, ${rezultat.contacte} contacte eliminate.`,
);
