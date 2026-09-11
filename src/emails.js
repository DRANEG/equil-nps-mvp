// Sabloanele de email. HTML-ul e pe tabele, cu stiluri inline: asa arata corect
// si in Outlook, si in Gmail. Butoanele 0-10 duc direct in sondaj cu scorul bifat.
import { escapeHtml } from './http.js';

export function brandName(env = process.env) {
  return env.MAIL_BRAND || 'Equil';
}

export function invitationEmail({ invite, publicUrl, brand = brandName() }) {
  const link = `${publicUrl}/r/${invite.token}`;
  const unsubscribe = `${publicUrl}/dezabonare/${invite.token}`;
  const salut = invite.contact_name ? `Salut, ${invite.contact_name}!` : 'Salut!';
  const intro =
    invite.intro ||
    `Vrem să ne facem treaba mai bine și avem nevoie de un minut din timpul tău. O singură întrebare:`;

  return {
    subject: `${invite.question} (30 de secunde)`,
    html: shell({
      brand,
      salut,
      intro,
      question: invite.question,
      link,
      unsubscribe,
      cta: 'Alege o notă de la 0 la 10',
    }),
    text: [
      salut,
      '',
      intro,
      '',
      invite.question,
      '',
      `Răspunde aici: ${link}`,
      '',
      `Mulțumim,`,
      `Echipa ${brand}`,
      '',
      `Dacă nu vrei să mai primești astfel de mesaje: ${unsubscribe}`,
    ].join('\n'),
    unsubscribe,
  };
}

export function reminderEmail({ invite, publicUrl, brand = brandName() }) {
  const link = `${publicUrl}/r/${invite.token}`;
  const unsubscribe = `${publicUrl}/dezabonare/${invite.token}`;
  const salut = invite.contact_name ? `Salut, ${invite.contact_name}!` : 'Salut!';
  const intro =
    'Ți-am scris acum câteva zile și știm că ai avut treabă. Dacă mai ai 30 de secunde, ' +
    'părerea ta chiar schimbă lucruri la noi.';

  return {
    subject: `Reamintire: ${invite.question}`,
    html: shell({
      brand,
      salut,
      intro,
      question: invite.question,
      link,
      unsubscribe,
      cta: 'Alege o notă de la 0 la 10',
      footerNote: 'Este ultimul mesaj pe care ți-l trimitem despre acest sondaj.',
    }),
    text: [
      salut,
      '',
      intro,
      '',
      invite.question,
      '',
      `Răspunde aici: ${link}`,
      '',
      'Este ultimul mesaj pe care ți-l trimitem despre acest sondaj.',
      '',
      `Mulțumim,`,
      `Echipa ${brand}`,
      '',
      `Dezabonare: ${unsubscribe}`,
    ].join('\n'),
    unsubscribe,
  };
}

function scaleTable(link) {
  const cell = (n) => {
    const color = n <= 6 ? '#c0392b' : n <= 8 ? '#b7791f' : '#17864d';
    return `<td style="padding:2px">
      <a href="${escapeHtml(link)}?scor=${n}"
         style="display:block;width:34px;line-height:34px;text-align:center;border:1px solid ${color};
                border-radius:6px;color:${color};text-decoration:none;font-weight:700;font-size:14px">${n}</a>
    </td>`;
  };
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:14px 0">
    <tr>${Array.from({ length: 11 }, (_, i) => cell(i)).join('')}</tr>
    <tr>
      <td colspan="4" style="font-size:11px;color:#6b7280;padding-top:4px">deloc probabil</td>
      <td colspan="3"></td>
      <td colspan="4" style="font-size:11px;color:#6b7280;padding-top:4px;text-align:right">foarte probabil</td>
    </tr>
  </table>`;
}

function shell({ brand, salut, intro, question, link, unsubscribe, cta, footerNote = '' }) {
  return `<!doctype html>
<html lang="ro"><body style="margin:0;background:#f6f7f9;padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td align="center">
  <table role="presentation" cellpadding="0" cellspacing="0" width="560"
         style="max-width:560px;background:#ffffff;border:1px solid #e4e7ec;border-radius:12px;
                font-family:-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#16191d">
    <tr><td style="padding:24px 24px 8px">
      <div style="font-weight:700;font-size:15px;letter-spacing:-0.2px">${escapeHtml(brand)}</div>
    </td></tr>
    <tr><td style="padding:0 24px 8px;font-size:15px;line-height:1.55">
      <p style="margin:12px 0 8px">${escapeHtml(salut)}</p>
      <p style="margin:0 0 12px">${escapeHtml(intro)}</p>
      <p style="margin:0;font-weight:600">${escapeHtml(question)}</p>
      ${scaleTable(link)}
      <p style="margin:0 0 16px">
        <a href="${escapeHtml(link)}"
           style="display:inline-block;background:#2f5bea;color:#ffffff;text-decoration:none;
                  padding:11px 18px;border-radius:8px;font-weight:600;font-size:15px">${escapeHtml(cta)}</a>
      </p>
      <p style="margin:0 0 4px">Mulțumim,</p>
      <p style="margin:0 0 18px">Echipa ${escapeHtml(brand)}</p>
    </td></tr>
    <tr><td style="padding:12px 24px 20px;border-top:1px solid #e4e7ec;font-size:12px;color:#6b7280;line-height:1.5">
      ${footerNote ? `<p style="margin:0 0 6px">${escapeHtml(footerNote)}</p>` : ''}
      <p style="margin:0">Primești acest mesaj pentru că ești clientul nostru. Răspunsul este folosit
      doar pentru îmbunătățirea serviciului.
      <a href="${escapeHtml(unsubscribe)}" style="color:#6b7280">Nu mai vreau astfel de mesaje</a>.</p>
    </td></tr>
  </table>
</td></tr>
</table>
</body></html>`;
}
