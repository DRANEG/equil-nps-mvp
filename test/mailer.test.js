import { test } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buildMessage, smtpSend, createMailer, addressOnly } from '../src/mailer.js';

// Server SMTP fals: vorbeste protocolul si retine ce a primit.
function fakeSmtp({ advertise = 'AUTH LOGIN', rejectRecipient = false } = {}) {
  const sessions = [];
  const server = net.createServer((socket) => {
    const session = { commands: [], data: '', auth: [] };
    sessions.push(session);
    let inData = false;
    let buffer = '';
    socket.setEncoding('utf8');
    socket.write('220 fake ESMTP\r\n');
    socket.on('data', (chunk) => {
      buffer += chunk;
      let index;
      while ((index = buffer.indexOf('\r\n')) !== -1) {
        const line = buffer.slice(0, index);
        buffer = buffer.slice(index + 2);
        if (inData) {
          if (line === '.') {
            inData = false;
            socket.write('250 OK mesaj acceptat\r\n');
          } else {
            session.data += `${line}\n`;
          }
          continue;
        }
        session.commands.push(line);
        if (/^EHLO/i.test(line)) socket.write(`250-fake\r\n250-${advertise}\r\n250 OK\r\n`);
        else if (/^AUTH LOGIN/i.test(line)) socket.write('334 VXNlcm5hbWU6\r\n');
        else if (/^AUTH PLAIN/i.test(line)) { session.auth.push(line.slice(11)); socket.write('235 autentificat\r\n'); }
        else if (/^MAIL FROM/i.test(line)) socket.write('250 OK\r\n');
        else if (/^RCPT TO/i.test(line)) socket.write(rejectRecipient ? '550 destinatar respins\r\n' : '250 OK\r\n');
        else if (/^DATA/i.test(line)) { inData = true; socket.write('354 trimite mesajul\r\n'); }
        else if (/^QUIT/i.test(line)) { socket.write('221 la revedere\r\n'); socket.end(); }
        else if (session.commands.filter((c) => /^[A-Za-z0-9+/=]+$/.test(c)).length === 1) {
          session.auth.push(line);
          socket.write('334 UGFzc3dvcmQ6\r\n');
        } else {
          session.auth.push(line);
          socket.write('235 autentificat\r\n');
        }
      }
    });
    socket.on('error', () => {});
  });
  return { server, sessions, listen: () => new Promise((r) => server.listen(0, () => r(server.address().port))) };
}

test('mesajul MIME are anteturile si partile corecte', () => {
  const { raw } = buildMessage({
    to: 'ana@client.ro',
    from: 'Echipa Equil <nps@equil.ro>',
    subject: 'Cât de probabil ne recomanzi?',
    text: 'Salut',
    html: '<p>Salut</p>',
    listUnsubscribe: 'https://nps.equil.ro/dezabonare/abc',
  });
  assert.match(raw, /^From: Echipa Equil <nps@equil\.ro>/m);
  assert.match(raw, /^To: ana@client\.ro/m);
  // Subiectul cu diacritice trebuie codificat RFC 2047, altfel ajunge stricat.
  assert.match(raw, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=/m);
  assert.match(raw, /^List-Unsubscribe: <https:\/\/nps\.equil\.ro\/dezabonare\/abc>/m);
  assert.match(raw, /^List-Unsubscribe-Post: List-Unsubscribe=One-Click/m);
  assert.match(raw, /Content-Type: multipart\/alternative; boundary="equil-/);
  assert.match(raw, /Content-Type: text\/plain; charset=UTF-8/);
  assert.match(raw, /Content-Type: text\/html; charset=UTF-8/);

  const parts = raw.split(/--equil-[^\r\n]+/).filter((p) => p.includes('base64'));
  const decoded = parts.map((p) => Buffer.from(p.split('\r\n\r\n')[1].trim(), 'base64').toString('utf8'));
  assert.deepEqual(decoded, ['Salut', '<p>Salut</p>']);
});

test('addressOnly extrage adresa din "Nume <adresa>"', () => {
  assert.equal(addressOnly('Echipa Equil <nps@equil.ro>'), 'nps@equil.ro');
  assert.equal(addressOnly('nps@equil.ro'), 'nps@equil.ro');
});

test('clientul SMTP parcurge EHLO, AUTH LOGIN, MAIL, RCPT si DATA', async () => {
  const fake = fakeSmtp();
  const port = await fake.listen();
  const { raw } = buildMessage({ to: 'ana@client.ro', from: 'nps@equil.ro', subject: 'Test', text: 'Salut' });

  await smtpSend(
    { host: '127.0.0.1', port, secure: 'none', user: 'utilizator', pass: 'secret', timeoutMs: 5000 },
    { to: 'ana@client.ro', from: 'nps@equil.ro', raw },
  );

  const session = fake.sessions[0];
  assert.match(session.commands[0], /^EHLO /);
  assert.ok(session.commands.includes('AUTH LOGIN'));
  assert.ok(session.commands.includes('MAIL FROM:<nps@equil.ro>'));
  assert.ok(session.commands.includes('RCPT TO:<ana@client.ro>'));
  assert.ok(session.commands.includes('DATA'));
  assert.ok(session.commands.includes('QUIT'));
  assert.deepEqual(
    session.auth.slice(0, 2).map((v) => Buffer.from(v, 'base64').toString('utf8')),
    ['utilizator', 'secret'],
  );
  assert.match(session.data, /Subject: Test/);
  fake.server.close();
});

test('clientul SMTP foloseste AUTH PLAIN cand serverul il anunta', async () => {
  const fake = fakeSmtp({ advertise: 'AUTH PLAIN LOGIN' });
  const port = await fake.listen();
  const { raw } = buildMessage({ to: 'a@b.ro', from: 'n@e.ro', subject: 'T', text: 'x' });
  await smtpSend(
    { host: '127.0.0.1', port, secure: 'none', user: 'u', pass: 'p', timeoutMs: 5000 },
    { to: 'a@b.ro', from: 'n@e.ro', raw },
  );
  const plain = fake.sessions[0].commands.find((c) => c.startsWith('AUTH PLAIN'));
  assert.ok(plain);
  assert.equal(Buffer.from(plain.slice(11), 'base64').toString('utf8'), '\0u\0p');
  fake.server.close();
});

test('un destinatar respins produce eroare explicita', async () => {
  const fake = fakeSmtp({ rejectRecipient: true });
  const port = await fake.listen();
  const { raw } = buildMessage({ to: 'gresit@client.ro', from: 'n@e.ro', subject: 'T', text: 'x' });
  await assert.rejects(
    () => smtpSend({ host: '127.0.0.1', port, secure: 'none', timeoutMs: 5000 }, { to: 'gresit@client.ro', from: 'n@e.ro', raw }),
    /550 destinatar respins/,
  );
  fake.server.close();
});

test('fara SMTP_HOST emailurile se scriu ca fisiere .eml', async () => {
  const outbox = mkdtempSync(join(tmpdir(), 'nps-outbox-'));
  const mailer = createMailer({ host: '', outbox, from: 'NPS <nps@equil.ro>' });
  assert.equal(mailer.mode, 'dry');

  const result = await mailer.send({ to: 'ana@client.ro', subject: 'Salut', html: '<p>Bună</p>' });
  assert.equal(result.transport, 'outbox');
  const files = readdirSync(outbox);
  assert.equal(files.length, 1);
  assert.match(readFileSync(join(outbox, files[0]), 'utf8'), /To: ana@client\.ro/);
});
