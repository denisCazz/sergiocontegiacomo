import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import {
  getAllArticlesAdmin,
  getArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
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
    const article = await getArticleById(Number(id));
    if (!article) return json({ error: 'Non trovato' }, 404);
    return json({ article });
  }

  const articles = await getAllArticlesAdmin();
  return json({ articles });
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const article = await createArticle(body);
    return json({ article }, 201);
  } catch (err: any) {
    console.error('Create article error:', err);
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
    const article = await updateArticle(id, body);
    return json({ article });
  } catch (err: any) {
    console.error('Update article error:', err);
    return json({ error: err.message || 'Errore aggiornamento' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id richiesto' }, 400);

  const ok = await deleteArticle(id);
  if (!ok) return json({ error: 'Errore eliminazione' }, 500);
  return json({ success: true });
};
