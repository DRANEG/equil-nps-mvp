// O singura trecere de trimitere, pentru cine prefera cron in locul robotului din server.
// Exemplu de cron (la fiecare ora): 0 * * * * cd /opt/equil-nps && npm run trimite
import { openDb } from './db.js';
import { createMailer } from './mailer.js';
import { runSendPass } from './scheduler.js';

const db = openDb();
const mailer = createMailer();
const publicUrl = process.env.PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 3000}`;

console.log(`Transport: ${mailer.description}`);
const result = await runSendPass(db, { mailer, publicUrl });
console.log(
  `Invitatii trimise: ${result.invitatii}, remindere: ${result.remindere}, erori: ${result.erori}` +
    (result.oprit ? ` (${result.oprit})` : ''),
);
