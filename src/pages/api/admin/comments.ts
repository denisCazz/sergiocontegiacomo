import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import { getAllComments, deleteComment } from '../../../lib/cms';

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

  const comments = await getAllComments();
  return json({ comments });
};

export const DELETE: APIRoute = async ({ request, url }) => {
  try {
    requireAdminFromRequest(request);
  } catch {
    return unauthorizedResponse();
  }

  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id richiesto' }, 400);

  const ok = await deleteComment(id);
  if (!ok) return json({ error: 'Errore eliminazione' }, 500);
  return json({ success: true });
};
