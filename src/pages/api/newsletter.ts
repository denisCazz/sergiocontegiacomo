export const prerender = false;

import { brevoRequest, isValidEmail } from '../../lib/brevo';

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json().catch(() => ({}));

    // Honeypot anti-bot: se compilato, rispondiamo OK senza fare nulla.
    // Non deve essere usato dagli utenti reali.
    const honey = getString((payload as any)?.company) || getString((payload as any)?.website);
    if (honey) {
      return new Response(JSON.stringify({ success: true, message: 'Iscrizione completata.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const email = getString((payload as any)?.email);
    const nome =
      getString((payload as any)?.nome) ||
      getString((payload as any)?.firstName) ||
      getString((payload as any)?.firstname) ||
      getString((payload as any)?.first_name);
    const cognome =
      getString((payload as any)?.cognome) ||
      getString((payload as any)?.lastName) ||
      getString((payload as any)?.lastname) ||
      getString((payload as any)?.last_name);

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

    const listIdRaw = import.meta.env.BREVO_NEWSLETTER_LIST_ID?.toString().trim();
    const listId = listIdRaw ? Number(listIdRaw) : undefined;

    const doiTemplateRaw = import.meta.env.BREVO_NEWSLETTER_DOI_TEMPLATE_ID?.toString().trim();
    const doiTemplateId = doiTemplateRaw ? Number(doiTemplateRaw) : undefined;
    const doiRedirectUrl =
      import.meta.env.BREVO_NEWSLETTER_DOI_REDIRECT_URL?.toString().trim() ||
      import.meta.env.PUBLIC_SITE_URL?.toString().trim() ||
      (import.meta.env.VERCEL_URL ? `https://${import.meta.env.VERCEL_URL}` : '');

    const attributes: Record<string, unknown> = {};
    if (nome) attributes.FIRSTNAME = nome;
    if (cognome) attributes.LASTNAME = cognome;

    // Se configuri un template DOI su Brevo, inviamo sempre la conferma.
    if (doiTemplateId) {
      const result = await brevoRequest('/contacts/doubleOptinConfirmation', {
        method: 'POST',
        body: {
          email,
          attributes: Object.keys(attributes).length ? attributes : undefined,
          includeListIds: listId ? [listId] : undefined,
          templateId: doiTemplateId,
          redirectionUrl: doiRedirectUrl,
        },
      });

      if (result.status >= 200 && result.status < 300) {
        return new Response(
          JSON.stringify({ success: true, message: "Grazie! Controlla l'email per confermare l'iscrizione." }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }

      console.error('[newsletter] errore brevo (doi)', result.status, result.errorText);
      return new Response(JSON.stringify({ success: false, message: 'Errore durante iscrizione' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Fallback single opt-in (se non hai ancora configurato DOI).
    const createResult = await brevoRequest('/contacts', {
      method: 'POST',
      body: {
        email,
        listIds: listId ? [listId] : undefined,
        attributes: Object.keys(attributes).length ? attributes : undefined,
        updateEnabled: true,
      },
    });

    if (createResult.status >= 200 && createResult.status < 300) {
      return new Response(JSON.stringify({ success: true, message: 'Iscrizione completata.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.error('[newsletter] errore brevo', createResult.status, createResult.errorText);
    return new Response(JSON.stringify({ success: false, message: 'Errore durante iscrizione' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[newsletter] errore generale', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

