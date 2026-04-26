/**
 * Email transazionali dal sito (conferme contatto / newsletter) via Resend.
 * Se RESEND_API_KEY non è impostata, le funzioni non inviano nulla (solo log lato chiamante).
 */
import { Resend } from 'resend';

function getClient(): Resend | null {
  const key = import.meta.env.RESEND_API_KEY?.toString().trim();
  if (!key) return null;
  return new Resend(key);
}

function defaultFrom(): string {
  const name = import.meta.env.RESEND_FROM_NAME?.toString().trim() || 'Sergio Contegiacomo';
  const email =
    import.meta.env.RESEND_FROM_EMAIL?.toString().trim() || 'onboarding@resend.dev';
  return `${name} <${email}>`;
}

export async function sendSiteEmail(options: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const resend = getClient();
  if (!resend) {
    return { ok: true, skipped: true };
  }

  const toList = Array.isArray(options.to) ? options.to : [options.to];

  const { data, error } = await resend.emails.send({
    from: defaultFrom(),
    to: toList,
    subject: options.subject,
    html: options.html,
    ...(options.text ? { text: options.text } : {}),
    ...(options.replyTo ? { replyTo: options.replyTo } : {}),
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data) {
    return { ok: false, error: 'Nessuna risposta da Resend' };
  }

  return { ok: true };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
