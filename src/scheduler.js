// Robotul de trimitere: o "trecere" (pass) expediaza invitatiile netrimise si
// remindere pentru cei care n-au raspuns in N zile. Ruleaza periodic in server
// sau o data, din cron, prin `npm run trimite`.
import {
  pendingInvitations, pendingReminders, claimInviteForSend, releaseInviteSend,
  claimReminder, releaseReminder, markSendError, logEmail,
} from './db.js';
import { invitationEmail, reminderEmail } from './emails.js';

export const DEFAULTS = {
  reminderDays: Number(process.env.REMINDER_DAYS) || 5,
  batchSize: Number(process.env.SEND_BATCH_SIZE) || 50,
  // Rastimp intre import si prima trimitere, ca sa poti corecta lista.
  delayMinutes: process.env.SEND_DELAY_MINUTES === undefined ? 10 : Number(process.env.SEND_DELAY_MINUTES),
  intervalMinutes: Number(process.env.SEND_INTERVAL_MINUTES) || 15,
  throttleMs: Number(process.env.SEND_THROTTLE_MS) || 250,
  maxConsecutiveErrors: 5,
};

export async function runSendPass(db, options = {}) {
  const {
    mailer, publicUrl, campaignId = null, onlyAutoSend = true,
    reminderDays = DEFAULTS.reminderDays, batchSize = DEFAULTS.batchSize,
    delayMinutes = DEFAULTS.delayMinutes, throttleMs = DEFAULTS.throttleMs,
    maxConsecutiveErrors = DEFAULTS.maxConsecutiveErrors,
  } = options;

  const result = { invitatii: 0, remindere: 0, erori: 0, oprit: null };
  let consecutiveErrors = 0;

  const batches = [
    {
      kind: 'invitatie',
      rows: pendingInvitations(db, { campaignId, limit: batchSize, delayMinutes, onlyAutoSend }),
      build: invitationEmail,
      claim: claimInviteForSend,
      release: releaseInviteSend,
      counter: 'invitatii',
    },
    {
      kind: 'reminder',
      rows: pendingReminders(db, { campaignId, limit: batchSize, days: reminderDays, onlyAutoSend }),
      build: reminderEmail,
      claim: claimReminder,
      release: releaseReminder,
      counter: 'remindere',
    },
  ];

  for (const batch of batches) {
    for (const invite of batch.rows) {
      if (consecutiveErrors >= maxConsecutiveErrors) {
        result.oprit = `oprit dupa ${consecutiveErrors} erori consecutive`;
        return result;
      }
      // Rezervam randul inainte de trimitere; daca altcineva l-a luat deja, il sarim.
      if (!batch.claim(db, invite.id)) continue;
      const message = batch.build({ invite, publicUrl });
      try {
        const sent = await mailer.send({
          to: invite.email,
          subject: message.subject,
          html: message.html,
          text: message.text,
          listUnsubscribe: message.unsubscribe,
        });
        logEmail(db, {
          inviteId: invite.id, kind: batch.kind, recipient: invite.email,
          status: 'trimis', detail: sent.transport === 'outbox' ? `fisier: ${sent.file}` : null,
        });
        result[batch.counter] += 1;
        consecutiveErrors = 0;
      } catch (err) {
        batch.release(db, invite.id);
        markSendError(db, invite.id, err.message);
        logEmail(db, {
          inviteId: invite.id, kind: batch.kind, recipient: invite.email,
          status: 'eroare', detail: err.message,
        });
        result.erori += 1;
        consecutiveErrors += 1;
      }
      if (throttleMs > 0) await sleep(throttleMs);
    }
  }

  return result;
}

export function startScheduler(db, options = {}) {
  const intervalMinutes = options.intervalMinutes ?? DEFAULTS.intervalMinutes;
  let running = false;

  const tick = async () => {
    if (running) return;
    running = true;
    try {
      const result = await runSendPass(db, options);
      if (result.invitatii || result.remindere || result.erori) {
        console.log(
          `[email] invitatii: ${result.invitatii}, remindere: ${result.remindere}, erori: ${result.erori}` +
            (result.oprit ? ` (${result.oprit})` : ''),
        );
      }
    } catch (err) {
      console.error('[email] trecerea de trimitere a esuat:', err.message);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, Math.max(1, intervalMinutes) * 60_000);
  timer.unref?.();
  setTimeout(tick, 5_000).unref?.(); // o prima trecere la scurt timp dupa pornire
  return () => clearInterval(timer);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
