export const prerender = false;

import { sendContactLead } from '../../lib/contactLeadsApi';
import { sendBitoraCrmLead } from '../../lib/bitoraCrm';

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json();
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

    // Salva lead su Bitora CRM direttamente (azione principale)
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
      console.error('[contact] errore bitora-crm (lead)', bitoraLead.status, bitoraLead.errorText);
      return new Response(JSON.stringify({ success: false, message: 'Errore durante invio richiesta' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Backup: salva anche su API alternativa se configurata
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

  // Brevo CRM note: 1..3000
  const text = lines.join('\n').trim();
  return text.length > 3000 ? `${text.slice(0, 2997)}...` : text;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

