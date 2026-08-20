import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../lib/auth';
import { uploadToR2, deleteFromR2, type FileCategory, isR2Configured } from '../../lib/r2';

export const prerender = false;

const VALID_CATEGORIES: FileCategory[] = ['images', 'audio', 'press'];

export const POST: APIRoute = async ({ request }) => {
  try {
    try {
      requireAdminFromRequest(request);
    } catch {
      return unauthorizedResponse();
    }

    if (!isR2Configured()) {
      return new Response(JSON.stringify({ error: 'R2 non configurato' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const categoryRaw = (formData.get('category') || formData.get('bucket') || 'images') as string;
    const category = categoryRaw as FileCategory;

    if (!file) {
      return new Response(JSON.stringify({ error: 'Nessun file fornito' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return new Response(JSON.stringify({ error: 'Categoria non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: 'File troppo grande. Massimo 50MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await uploadToR2(file, category);
    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error || 'Upload fallito' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url: result.url, key: result.key }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Upload API error:', err);
    return new Response(JSON.stringify({ error: 'Errore upload' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    try {
      requireAdminFromRequest(request);
    } catch {
      return unauthorizedResponse();
    }

    const body = await request.json().catch(() => ({}));
    const url = typeof body.url === 'string' ? body.url : '';
    if (!url) {
      return new Response(JSON.stringify({ error: 'URL mancante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const ok = await deleteFromR2(url);
    if (!ok) {
      return new Response(JSON.stringify({ error: 'Eliminazione fallita' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Delete upload API error:', err);
    return new Response(JSON.stringify({ error: 'Errore eliminazione' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
