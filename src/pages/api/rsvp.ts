import type { APIRoute } from 'astro';
import { getEventRSVPs, addEventRSVP } from '../../lib/cms';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug richiesto' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const rsvps = await getEventRSVPs(slug);
  return new Response(JSON.stringify({ rsvps }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const event_slug = typeof body.event_slug === 'string' ? body.event_slug.trim() : '';
    const user_name = typeof body.user_name === 'string' ? body.user_name.trim() : 'Partecipante';
    const user_email = typeof body.user_email === 'string' ? body.user_email.trim() : '';
    const status = body.status === 'attending' || body.status === 'not_attending' ? body.status : null;

    if (!event_slug || !status || !user_email) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rsvp = await addEventRSVP({
      event_slug,
      user_name,
      status,
      user_email,
    } as any);

    return new Response(JSON.stringify({ rsvp }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('RSVP POST error:', err);
    return new Response(JSON.stringify({ error: 'Errore salvataggio RSVP' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
