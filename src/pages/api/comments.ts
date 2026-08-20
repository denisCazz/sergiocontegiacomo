import type { APIRoute } from 'astro';
import { getComments, addComment } from '../../lib/cms';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const slug = url.searchParams.get('slug');
  if (!slug) {
    return new Response(JSON.stringify({ error: 'slug richiesto' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const comments = await getComments(slug);
  return new Response(JSON.stringify({ comments }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const article_slug = typeof body.article_slug === 'string' ? body.article_slug.trim() : '';
    const user_name = typeof body.user_name === 'string' ? body.user_name.trim() : '';
    const content = typeof body.content === 'string' ? body.content.trim() : '';
    const rating = Number(body.rating);

    if (!article_slug || !user_name || !content || !rating) {
      return new Response(JSON.stringify({ error: 'Campi obbligatori mancanti' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (rating < 1 || rating > 5) {
      return new Response(JSON.stringify({ error: 'Rating non valido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const comment = await addComment({ article_slug, user_name, rating, content });
    return new Response(JSON.stringify({ comment }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Comment POST error:', err);
    return new Response(JSON.stringify({ error: 'Errore salvataggio commento' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
