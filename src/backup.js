// Copie de siguranță a bazei de date, fără să oprești serverul.
// SQLite scrie o copie coerentă cu VACUUM INTO, chiar în timp ce aplicația merge.
// Rulare: npm run backup   (din cron: 0 3 * * * cd /opt/equil-nps && npm run backup)
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';

const bazaDate = resolve(process.env.NPS_DB || './data/nps.db');
const folder = resolve(process.env.BACKUP_DIR || './data/backup');
const zilePastrate = Number(process.env.BACKUP_KEEP_DAYS) || 30;

mkdirSync(folder, { recursive: true });

const acum = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const fisier = join(folder, `nps-${acum}.db`);

const db = new DatabaseSync(bazaDate, { readOnly: true });
db.exec(`VACUUM INTO '${fisier.replace(/'/g, "''")}'`);
db.close();

const marime = Math.round(statSync(fisier).size / 1024);
console.log(`Copie făcută: ${fisier} (${marime} KB)`);

// Ștergem copiile mai vechi decât termenul stabilit.
const limita = Date.now() - zilePastrate * 24 * 3600 * 1000;
let sterse = 0;
for (const nume of readdirSync(folder)) {
  if (!/^nps-.*\.db$/.test(nume)) continue;
  const cale = join(folder, nume);
  if (statSync(cale).mtimeMs < limita) {
    unlinkSync(cale);
    sterse += 1;
  }
}
if (sterse) console.log(`Am șters ${sterse} copii mai vechi de ${zilePastrate} de zile.`);
