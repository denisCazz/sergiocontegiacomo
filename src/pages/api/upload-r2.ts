import type { APIRoute } from 'astro';

/**
 * DEPRECATO: il progetto usa Supabase Storage per tutti i caricamenti.
 * Tieni questa route solo per evitare crash se qualche client vecchio la chiama.
 */
export const POST: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'Endpoint deprecato. Usa /api/upload-supabase',
      deprecated: true,
      use: '/api/upload-supabase',
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};

export const DELETE: APIRoute = async () => {
  return new Response(
    JSON.stringify({
      error: 'Endpoint deprecato. Usa /api/upload-supabase',
      deprecated: true,
      use: '/api/upload-supabase',
    }),
    {
      status: 410,
      headers: { 'Content-Type': 'application/json' },
    }
  );
};
