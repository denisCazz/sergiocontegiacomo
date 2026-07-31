import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import {
  getAllEventsAdmin,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../../../lib/cms';

export const prerender = false;

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function guard(request: Request) {
  try {
    requireAdminFromRequest(request);
    return null;
  } catch {
    return unauthorizedResponse();
  }
}

export const GET: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  const id = url.searchParams.get('id');
  if (id) {
    const event = await getEventById(Number(id));
    if (!event) return json({ error: 'Non trovato' }, 404);
    return json({ event });
  }

  const events = await getAllEventsAdmin();
  return json({ events });
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const event = await createEvent(body);
    return json({ event }, 201);
  } catch (err: any) {
    console.error('Create event error:', err);
    return json({ error: err.message || 'Errore creazione' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id richiesto' }, 400);

  try {
    const body = await request.json();
    const event = await updateEvent(id, body);
    return json({ event });
  } catch (err: any) {
    console.error('Update event error:', err);
    return json({ error: err.message || 'Errore aggiornamento' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id richiesto' }, 400);

  const ok = await deleteEvent(id);
  if (!ok) return json({ error: 'Errore eliminazione' }, 500);
  return json({ success: true });
};
