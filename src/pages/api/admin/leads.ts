import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import {
  deleteContactRequest,
  deleteNewsletterSubscriber,
  listContactRequests,
  listNewsletterSubscribers,
  setContactStatus,
  setNewsletterStatus,
  type ContactStatus,
  type NewsletterStatus,
} from '../../../lib/leads';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const GET: APIRoute = async ({ request }) => {
  try {
    requireAdminFromRequest(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    const [contacts, subscribers] = await Promise.all([
      listContactRequests(),
      listNewsletterSubscribers(),
    ]);
    return json({ contacts, subscribers });
  } catch (err) {
    console.error('Admin leads GET error:', err);
    return json({ error: 'Errore caricamento richieste' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request }) => {
  try {
    requireAdminFromRequest(request);
  } catch {
    return unauthorizedResponse();
  }

  const body = await request.json().catch(() => ({}));
  const kind = body?.kind === 'contact' || body?.kind === 'newsletter' ? body.kind : null;
  const id = Number(body?.id);
  const status = typeof body?.status === 'string' ? body.status : '';

  if (!kind || !id) return json({ error: 'Dati non validi' }, 400);

  try {
    if (kind === 'contact') {
      if (status !== 'new' && status !== 'handled') return json({ error: 'Stato non valido' }, 400);
      const ok = await setContactStatus(id, status as ContactStatus);
      if (!ok) return json({ error: 'Richiesta non trovata' }, 404);
      return json({ success: true });
    }

    if (status !== 'active' && status !== 'unsubscribed') return json({ error: 'Stato non valido' }, 400);
    const ok = await setNewsletterStatus(id, status as NewsletterStatus);
    if (!ok) return json({ error: 'Iscritto non trovato' }, 404);
    return json({ success: true });
  } catch (err) {
    console.error('Admin leads PATCH error:', err);
    return json({ error: 'Errore aggiornamento' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    requireAdminFromRequest(request);
  } catch {
    return unauthorizedResponse();
  }

  const kind = url.searchParams.get('kind');
  const id = Number(url.searchParams.get('id'));
  if ((kind !== 'contact' && kind !== 'newsletter') || !id) {
    return json({ error: 'Dati non validi' }, 400);
  }

  try {
    const ok = kind === 'contact'
      ? await deleteContactRequest(id)
      : await deleteNewsletterSubscriber(id);
    if (!ok) return json({ error: 'Elemento non trovato' }, 404);
    return json({ success: true });
  } catch (err) {
    console.error('Admin leads DELETE error:', err);
    return json({ error: 'Errore eliminazione' }, 500);
  }
};
