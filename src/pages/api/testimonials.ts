export const prerender = false;

import { sql } from '../../lib/db';

function getString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST({ request }: { request: Request }) {
  try {
    const payload = await request.json().catch(() => ({}));

    const honey = getString((payload as any)?.website) || getString((payload as any)?.company);
    if (honey) {
      return new Response(JSON.stringify({ success: true, message: 'Testimonianza ricevuta.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authorName = getString((payload as any)?.author_name);
    const authorRole = getString((payload as any)?.author_role);
    const quote = getString((payload as any)?.quote);
    const email = getString((payload as any)?.email);
    const ratingStr = getString((payload as any)?.rating);
    const rating = ratingStr ? parseInt(ratingStr) : null;

    if (!authorName || !quote) {
      return new Response(JSON.stringify({ success: false, message: 'Nome e testimonianza sono obbligatori' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (quote.length < 10) {
      return new Response(JSON.stringify({ success: false, message: 'La testimonianza deve contenere almeno 10 caratteri' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (quote.length > 1000) {
      return new Response(JSON.stringify({ success: false, message: 'La testimonianza non può superare 1000 caratteri' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (email && !isValidEmail(email)) {
      return new Response(JSON.stringify({ success: false, message: 'Email non valida' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (rating && (rating < 1 || rating > 5)) {
      return new Response(JSON.stringify({ success: false, message: 'La valutazione deve essere tra 1 e 5' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await sql`
      INSERT INTO testimonials (author_name, author_role, quote, rating, is_published, featured, display_order)
      VALUES (
        ${authorName},
        ${authorRole || null},
        ${quote.slice(0, 1000)},
        ${rating},
        true,
        false,
        0
      )
    `;

    return new Response(JSON.stringify({
      success: true,
      message: 'Grazie! La tua testimonianza è stata pubblicata.',
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[testimonials] Errore generale:', error);
    return new Response(JSON.stringify({ success: false, message: 'Errore inatteso' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
