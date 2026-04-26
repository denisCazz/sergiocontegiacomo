export const prerender = false;

import { sendContactLead } from '../../lib/contactLeadsApi';
import { sendBitoraCrmLead } from '../../lib/bitoraCrm';
import { sendSiteEmail, isValidEmail } from '../../lib/resendSite';
import { siteConfig } from '../../lib/config';
import { wrapSiteTransactionalEmail } from '../../lib/emailLayout';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json();

    if (payload?.website) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nome = payload?.nome?.toString().trim();
    const cognome = payload?.cognome?.toString().trim();
    const email = payload?.email?.toString().trim();
    const telefono = payload?.telefono?.toString().trim();
    const messaggio = payload?.messaggio?.toString().trim();
    const privacy = payload?.privacy;

    if (!nome || !cognome || !email) {
      return new Response(JSON.stringify({ success: false, message: 'Compila nome, cognome ed email' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!privacy) {
      return new Response(JSON.stringify({ success: false, message: 'Devi accettare la privacy' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!isValidEmail(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Email non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const safeMessage = messaggio?.slice(0, 5000) || '';

    const bitoraMessage = buildNoteText({ nome, cognome, email, telefono, messaggio: safeMessage });
    const bitoraLead = await sendBitoraCrmLead(
      {
        first_name: nome,
        last_name: cognome,
        email,
        phone: telefono || undefined,
        message: bitoraMessage,
        source: 'website-contact',
      },
      { request },
    );

    if (!bitoraLead.ok && !bitoraLead.skipped) {
      console.error('[contact] errore CRM (lead)', bitoraLead.status, bitoraLead.errorText);
      return new Response(JSON.stringify({ success: false, message: 'Errore durante invio richiesta' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const crmMessage = buildNoteText({ nome, cognome, email, telefono, messaggio: safeMessage });
    const crmLead = await sendContactLead({
      first_name: nome,
      last_name: cognome,
      email,
      phone: telefono || undefined,
      message: crmMessage,
      tags: ['contact', 'website'],
    });

    if (!crmLead.ok && !crmLead.skipped) {
      console.error('[contact] errore contact lead api (backup)', crmLead.status, crmLead.errorText);
    }

    const staffEmail =
      import.meta.env.PUBLIC_EVENT_EMAIL?.toString().trim() || siteConfig.contactEmail;

    const userAckInner = `
      <p style="margin:0 0 18px;">Ciao <strong>${escapeHtml(nome)}</strong>,</p>
      <p style="margin:0 0 18px;">Abbiamo ricevuto la tua richiesta dal sito e ti risponderemo al <strong>più presto</strong>.</p>
      <p style="margin:0;font-size:15px;color:#475569;">Grazie per averci contattato.</p>
    `;

    const userAckHtml = wrapSiteTransactionalEmail({
      preheader: `${siteConfig.name} ha ricevuto la tua richiesta`,
      innerHtml: userAckInner,
      footerLine: `— ${siteConfig.name}`,
    });

    const staffInner = `
      <p style="margin:0 0 18px;font-size:17px;font-weight:600;color:#0f172a;">Nuovo messaggio dal modulo contatti</p>
      <ul style="margin:0 0 20px;padding:0 0 0 20px;color:#334155;">
        <li style="margin:0 0 10px;"><strong>Nome:</strong> ${escapeHtml(nome)} ${escapeHtml(cognome)}</li>
        <li style="margin:0 0 10px;"><strong>Email:</strong> ${escapeHtml(email)}</li>
        ${telefono ? `<li style="margin:0 0 10px;"><strong>Telefono:</strong> ${escapeHtml(telefono)}</li>` : ''}
      </ul>
      <p style="margin:0 0 10px;font-weight:600;color:#0f172a;">Messaggio</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 18px;font-size:15px;line-height:1.55;color:#1e293b;white-space:pre-wrap;">${escapeHtml(safeMessage) || '(vuoto)'}</div>
      <p style="margin:20px 0 0;font-size:13px;color:#64748b;line-height:1.5;">Privacy accettata · Lead inviato al CRM se configurato.</p>
    `;

    const staffHtml = wrapSiteTransactionalEmail({
      preheader: `Contatto: ${nome} ${cognome}`,
      innerHtml: staffInner,
      footerLine: `Notifica modulo contatti · ${siteConfig.name}`,
    });

    const [userMail, staffMail] = await Promise.all([
      sendSiteEmail({
        to: email,
        subject: `Abbiamo ricevuto la tua richiesta — ${siteConfig.name}`,
        html: userAckHtml,
        text: `Ciao ${nome},\n\nAbbiamo ricevuto la tua richiesta dal sito e ti risponderemo al più presto.\n\n— ${siteConfig.name}`,
      }),
      sendSiteEmail({
        to: staffEmail,
        subject: `[Sito] Contatto: ${nome} ${cognome}`,
        html: staffHtml,
        replyTo: email,
      }),
    ]);

    if (!userMail.ok && !userMail.skipped) {
      console.warn('[contact] Resend (ack utente):', userMail.error);
    }
    if (!staffMail.ok && !staffMail.skipped) {
      console.warn('[contact] Resend (notifica staff):', staffMail.error);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[contact] errore generale', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function buildNoteText(input: {
  nome: string;
  cognome: string;
  email: string;
  telefono?: string;
  messaggio?: string;
}): string {
  const lines = [
    'Contatti — nuovo messaggio',
    '',
    `Nome: ${input.nome} ${input.cognome}`.trim(),
    `Email: ${input.email}`,
    input.telefono ? `Telefono: ${input.telefono}` : undefined,
    'Privacy: accettata',
    '',
    'Messaggio:',
    (input.messaggio || '').trim() || '(vuoto)',
  ].filter(Boolean) as string[];

  const text = lines.join('\n').trim();
  return text.length > 3000 ? `${text.slice(0, 2997)}...` : text;
}
