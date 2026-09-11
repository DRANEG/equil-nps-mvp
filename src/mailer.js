// Client SMTP minimal, fara dependente: EHLO -> STARTTLS -> AUTH -> MAIL/RCPT/DATA.
// Acopera furnizorii uzuali (Gmail, Microsoft 365, Brevo, Mailgun, SendGrid, Amazon SES).
import net from 'node:net';
import tls from 'node:tls';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const CRLF = '\r\n';

export function mailerConfigFromEnv(env = process.env) {
  return {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT) || 587,
    // 'starttls' (587, implicit), 'tls' (465) sau 'none' (doar pentru teste locale).
    secure: (env.SMTP_SECURE || 'starttls').toLowerCase(),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.MAIL_FROM || 'NPS <nps@localhost>',
    replyTo: env.MAIL_REPLY_TO || '',
    outbox: env.MAIL_OUTBOX || './data/outbox',
    timeoutMs: Number(env.SMTP_TIMEOUT_MS) || 20000,
  };
}

// Fara SMTP_HOST aplicatia nu esueaza: scrie emailurile ca fisiere .eml in data/outbox.
export function createMailer(config = mailerConfigFromEnv()) {
  const mode = config.host ? 'smtp' : 'dry';
  return {
    mode,
    description:
      mode === 'smtp'
        ? `SMTP ${config.host}:${config.port} (${config.secure})`
        : `fara SMTP — emailurile se scriu in ${config.outbox}`,
    async send(message) {
      const payload = buildMessage({ ...message, from: message.from || config.from, replyTo: message.replyTo || config.replyTo });
      if (mode === 'dry') return writeToOutbox(config.outbox, message.to, payload);
      await smtpSend(config, { to: message.to, from: addressOnly(config.from), raw: payload.raw });
      return { id: payload.id, transport: 'smtp' };
    },
  };
}

function writeToOutbox(dir, to, payload) {
  mkdirSync(dir, { recursive: true });
  const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${to.replace(/[^a-z0-9@._-]/gi, '_')}.eml`;
  writeFileSync(join(dir, name), payload.raw);
  return { id: payload.id, transport: 'outbox', file: join(dir, name) };
}

/* -------------------------------- construire MIME ------------------------------- */

export function buildMessage({ to, from, subject, text, html, replyTo, listUnsubscribe, date = new Date() }) {
  const id = `${randomUUID()}@${(addressOnly(from).split('@')[1] || 'localhost')}`;
  const boundary = `equil-${randomUUID()}`;
  const headers = [
    `From: ${encodeAddress(from)}`,
    `To: ${encodeAddress(to)}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${date.toUTCString()}`,
    `Message-ID: <${id}>`,
    'MIME-Version: 1.0',
  ];
  if (replyTo) headers.push(`Reply-To: ${encodeAddress(replyTo)}`);
  if (listUnsubscribe) {
    headers.push(`List-Unsubscribe: <${listUnsubscribe}>`);
    headers.push('List-Unsubscribe-Post: List-Unsubscribe=One-Click');
  }
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

  const part = (type, body) =>
    [
      `--${boundary}`,
      `Content-Type: ${type}; charset=UTF-8`,
      'Content-Transfer-Encoding: base64',
      '',
      base64Lines(body),
    ].join(CRLF);

  const raw = [
    headers.join(CRLF),
    '',
    part('text/plain', text || stripHtml(html || '')),
    part('text/html', html || `<pre>${text || ''}</pre>`),
    `--${boundary}--`,
    '',
  ].join(CRLF);

  return { id, raw };
}

function base64Lines(text) {
  return (Buffer.from(text, 'utf8').toString('base64').match(/.{1,76}/g) || ['']).join(CRLF);
}

// Antetele cu diacritice se codifica RFC 2047, altfel ajung stricate in inbox.
function encodeHeader(value) {
  const text = String(value ?? '');
  if (/^[\x20-\x7e]*$/.test(text)) return text;
  return `=?UTF-8?B?${Buffer.from(text, 'utf8').toString('base64')}?=`;
}

function encodeAddress(value) {
  const match = String(value).match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (!match) return String(value).trim();
  const [, name, address] = match;
  return name ? `${encodeHeader(name)} <${address}>` : address;
}

export function addressOnly(value) {
  const match = String(value).match(/<([^>]+)>/);
  return (match ? match[1] : String(value)).trim();
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* ----------------------------------- protocol ---------------------------------- */

export async function smtpSend(config, { to, from, raw }) {
  const conn = await connect(config);
  try {
    await conn.expect(220);
    let ehlo = await conn.command(`EHLO ${hostname()}`, 250);

    if (config.secure === 'starttls') {
      if (!/STARTTLS/i.test(ehlo.text)) throw new Error('Serverul SMTP nu ofera STARTTLS');
      await conn.command('STARTTLS', 220);
      await conn.upgrade(config);
      ehlo = await conn.command(`EHLO ${hostname()}`, 250);
    }

    if (config.user) {
      if (/AUTH[ =-][^\n]*PLAIN/i.test(ehlo.text)) {
        const token = Buffer.from(`\0${config.user}\0${config.pass}`, 'utf8').toString('base64');
        await conn.command(`AUTH PLAIN ${token}`, 235);
      } else {
        await conn.command('AUTH LOGIN', 334);
        await conn.command(Buffer.from(config.user, 'utf8').toString('base64'), 334);
        await conn.command(Buffer.from(config.pass, 'utf8').toString('base64'), 235);
      }
    }

    await conn.command(`MAIL FROM:<${from}>`, 250);
    await conn.command(`RCPT TO:<${to}>`, 250);
    await conn.command('DATA', 354);
    // Punctul de la inceput de linie inchide mesajul, deci se dubleaza (dot-stuffing).
    await conn.command(`${raw.replace(/\r\n\./g, '\r\n..')}${CRLF}.`, 250);
    await conn.command('QUIT', 221).catch(() => {});
    return true;
  } finally {
    conn.close();
  }
}

function connect(config) {
  return new Promise((resolve, reject) => {
    const options = { host: config.host, port: config.port };
    const socket =
      config.secure === 'tls'
        ? tls.connect({ ...options, servername: config.host })
        : net.connect(options);
    const onError = (err) => reject(new Error(`Conectare SMTP esuata: ${err.message}`));
    socket.once('error', onError);
    socket.once(config.secure === 'tls' ? 'secureConnect' : 'connect', () => {
      socket.off('error', onError);
      resolve(new SmtpConn(socket, config.timeoutMs));
    });
  });
}

class SmtpConn {
  constructor(socket, timeoutMs) {
    this.timeoutMs = timeoutMs;
    this.buffer = '';
    this.pending = null;
    this.attach(socket);
  }

  attach(socket) {
    this.socket = socket;
    socket.setEncoding('utf8');
    socket.setTimeout(this.timeoutMs, () => this.fail(new Error('Timeout SMTP')));
    socket.on('data', (chunk) => {
      this.buffer += chunk;
      this.flush();
    });
    socket.on('error', (err) => this.fail(err));
    socket.on('close', () => this.fail(new Error('Conexiunea SMTP s-a inchis')));
  }

  // Un raspuns SMTP se termina la prima linie in care dupa cod urmeaza spatiu.
  flush() {
    if (!this.pending) return;
    const lines = this.buffer.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (/^\d{3} /.test(lines[i])) {
        const text = lines.slice(0, i + 1).join('\n');
        this.buffer = lines.slice(i + 1).join('\r\n');
        const { resolve } = this.pending;
        this.pending = null;
        resolve({ code: Number(text.match(/(\d{3}) [^\n]*$/)[1]), text });
        return;
      }
    }
  }

  fail(err) {
    if (!this.pending) return;
    const { reject } = this.pending;
    this.pending = null;
    reject(err);
  }

  read() {
    if (this.pending) return Promise.reject(new Error('Citire SMTP concurenta'));
    return new Promise((resolve, reject) => {
      this.pending = { resolve, reject };
      this.flush();
    });
  }

  async expect(code) {
    const reply = await this.read();
    if (reply.code !== code) {
      throw new Error(`Raspuns SMTP neasteptat (astept ${code}): ${reply.text.trim()}`);
    }
    return reply;
  }

  async command(line, expected) {
    this.socket.write(line + CRLF);
    return this.expect(expected);
  }

  upgrade(config) {
    return new Promise((resolve, reject) => {
      const plain = this.socket;
      plain.removeAllListeners('data');
      plain.removeAllListeners('error');
      plain.removeAllListeners('close');
      const secure = tls.connect({ socket: plain, servername: config.host }, () => {
        this.buffer = '';
        this.attach(secure);
        resolve();
      });
      secure.once('error', reject);
    });
  }

  close() {
    this.pending = null;
    this.socket.removeAllListeners('close');
    this.socket.end();
    this.socket.destroy();
  }
}

function hostname() {
  return process.env.MAIL_HELO || 'equil-nps.local';
}
