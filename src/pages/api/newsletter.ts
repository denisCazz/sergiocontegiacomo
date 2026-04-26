export const prerender = false;

import { sendBitoraCrmLead } from '../../lib/bitoraCrm';
import { sendSiteEmail, isValidEmail } from '../../lib/resendSite';
import { siteConfig } from '../../lib/config';
import { wrapSiteTransactionalEmail } from '../../lib/emailLayout';

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json().catch(() => ({}));

    const honey = getString((payload as Record<string, unknown>)?.company) ||
      getString((payload as Record<string, unknown>)?.website);
    if (honey) {
      return new Response(JSON.stringify({ success: true, message: 'Iscrizione completata.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = getString((payload as Record<string, unknown>)?.email);
    const nome =
      getString((payload as Record<string, unknown>)?.nome) ||
      getString((payload as Record<string, unknown>)?.firstName) ||
      getString((payload as Record<string, unknown>)?.firstname) ||
      getString((payload as Record<string, unknown>)?.first_name);
    const cognome =
      getString((payload as Record<string, unknown>)?.cognome) ||
      getString((payload as Record<string, unknown>)?.lastName) ||
      getString((payload as Record<string, unknown>)?.lastname) ||
      getString((payload as Record<string, unknown>)?.last_name);

    if (!email) {
      return new Response(JSON.stringify({ success: false, message: 'Email mancante' }), {
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

    const bitoraLead = await sendBitoraCrmLead(
      {
        first_name: nome,
        last_name: cognome,
        email,
        message: 'Iscrizione newsletter dal sito sergiocontegiacomo.it',
        source: 'website-newsletter',
      },
      { request },
    );

    const crmSaved = bitoraLead.ok && !bitoraLead.skipped;
    if (!bitoraLead.ok && !bitoraLead.skipped) {
      console.error(
        '[newsletter] CRM non raggiungibile o rifiutato — proseguo con email (best-effort).',
        bitoraLead.status,
        bitoraLead.errorText,
      );
    }

    const staffEmail =
      import.meta.env.PUBLIC_EVENT_EMAIL?.toString().trim() || siteConfig.contactEmail;

    const subscriberInner = `
      <p style="margin:0 0 18px;">Ciao${nome ? ` <strong>${escapeHtml(nome)}</strong>` : ''},</p>
      <p style="margin:0 0 18px;">Grazie per esserti iscritto alla newsletter di <strong>${escapeHtml(siteConfig.name)}</strong>.</p>
      <p style="margin:0;">Riceverai aggiornamenti su contenuti e iniziative utili alla tua <strong>educazione finanziaria</strong>.</p>
    `;

    const subscriberHtml = wrapSiteTransactionalEmail({
      preheader: `Conferma iscrizione alla newsletter di ${siteConfig.name}`,
      innerHtml: subscriberInner,
      footerLine: `— Il team di ${siteConfig.name}`,
    });

    const staffInner = `
      <p style="margin:0 0 18px;font-size:17px;font-weight:600;color:#0f172a;">Nuova iscrizione newsletter</p>
      <ul style="margin:0;padding:0 0 0 20px;color:#334155;">
        <li style="margin:0 0 10px;"><strong>Email:</strong> ${escapeHtml(email)}</li>
        ${nome ? `<li style="margin:0 0 10px;"><strong>Nome:</strong> ${escapeHtml(nome)}</li>` : ''}
        ${cognome ? `<li style="margin:0 0 10px;"><strong>Cognome:</strong> ${escapeHtml(cognome)}</li>` : ''}
      </ul>
      <p style="margin:22px 0 0;font-size:14px;color:#64748b;line-height:1.55;">${
        crmSaved
          ? 'Contatto registrato nel CRM.'
          : 'Verifica il CRM: salvataggio non confermato (controlla API key e URL).'
      }</p>
    `;

    const staffHtml = wrapSiteTransactionalEmail({
      preheader: `Newsletter: ${email}`,
      innerHtml: staffInner,
      footerLine: `Notifica automatica · ${siteConfig.name}`,
    });

    const [ackRes, staffRes] = await Promise.all([
      sendSiteEmail({
        to: email,
        subject: `Iscrizione newsletter — ${siteConfig.name}`,
        html: subscriberHtml,
        text: `Ciao${nome ? ` ${nome}` : ''},\n\nGrazie per l'iscrizione alla newsletter di ${siteConfig.name}.\n`,
      }),
      sendSiteEmail({
        to: staffEmail,
        subject: `[Sito] Newsletter: ${email}`,
        html: staffHtml,
        replyTo: email,
      }),
    ]);

    if (!ackRes.ok && !ackRes.skipped) {
      console.error('[newsletter] Resend (ack utente):', ackRes.error);
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Non siamo riusciti a inviare l’email di conferma. Controlla l’indirizzo o riprova tra poco.',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json' } },
      );
    }

    if (!staffRes.ok && !staffRes.skipped) {
      console.warn('[newsletter] Resend (notifica staff):', staffRes.error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Grazie! Controlla la posta per la conferma di iscrizione.',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('[newsletter] errore generale', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
