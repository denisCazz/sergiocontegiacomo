import type { APIRoute } from 'astro';

/**
 * DEPRECATO: i PDF di rassegna stampa vanno caricati su Supabase Storage.
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
