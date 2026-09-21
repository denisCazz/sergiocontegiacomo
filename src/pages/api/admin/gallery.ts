import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import {
  getAllGalleryImages,
  getGalleryImageById,
  createGalleryImage,
  updateGalleryImage,
  deleteGalleryImage,
  reorderGalleryImages,
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
    const item = await getGalleryImageById(Number(id));
    if (!item) return json({ error: 'Non trovato' }, 404);
    return json({ item });
  }

  const items = await getAllGalleryImages();
  return json({ items });
};

export const POST: APIRoute = async ({ request }) => {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body?.image_url || typeof body.image_url !== 'string') {
      return json({ error: 'image_url richiesto' }, 400);
    }
    const item = await createGalleryImage(body);
    return json({ item }, 201);
  } catch (err: any) {
    return json({ error: err.message || 'Errore creazione' }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (Array.isArray(body?.reorder)) {
      const ids = body.reorder
        .map((value: unknown) => Number(value))
        .filter((id: number) => Number.isInteger(id) && id > 0);
      await reorderGalleryImages(ids);
      return json({ success: true });
    }

    const id = Number(url.searchParams.get('id'));
    if (!id) return json({ error: 'id richiesto' }, 400);

    const item = await updateGalleryImage(id, body);
    if (!item) return json({ error: 'Non trovato' }, 404);
    return json({ item });
  } catch (err: any) {
    return json({ error: err.message || 'Errore aggiornamento' }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, url }) => {
  const denied = guard(request);
  if (denied) return denied;

  const id = Number(url.searchParams.get('id'));
  if (!id) return json({ error: 'id richiesto' }, 400);

  const ok = await deleteGalleryImage(id);
  if (!ok) return json({ error: 'Errore eliminazione' }, 500);
  return json({ success: true });
};
