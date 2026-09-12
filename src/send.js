// O singura trecere de trimitere, pentru cine prefera cron in locul robotului din server.
// Exemplu de cron (la fiecare ora): 0 * * * * cd /opt/equil-nps && npm run trimite
import { openDb } from './db.js';
import { createMailer } from './mailer.js';
import { runSendPass } from './scheduler.js';
import { sendWindowFromEnv, describeWindow } from './calendar.js';

const db = openDb();
const mailer = createMailer();
const publicUrl = process.env.PUBLIC_URL || `http://localhost:${Number(process.env.PORT) || 3000}`;

// Rulat din cron, respecta programul; cu "--acum" trimite oricum.
const acum = process.argv.includes('--acum');
const sendWindow = acum ? null : sendWindowFromEnv();

console.log(`Transport: ${mailer.description}`);
if (sendWindow) console.log(`Program: ${describeWindow(sendWindow)} (ora României)`);
const result = await runSendPass(db, { mailer, publicUrl, sendWindow });
console.log(
  `Invitatii trimise: ${result.invitatii}, remindere: ${result.remindere}, erori: ${result.erori}` +
    (result.oprit ? ` (${result.oprit})` : ''),
);
