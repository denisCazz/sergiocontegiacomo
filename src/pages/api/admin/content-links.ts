import type { APIRoute } from 'astro';
import { sql } from '../../../lib/db';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    try {
      requireAdminFromRequest(request);
    } catch {
      return unauthorizedResponse();
    }

    const [articles, events, press] = await Promise.all([
      sql`
        SELECT id, title, slug, published_at
        FROM articles
        WHERE published_at IS NOT NULL
        ORDER BY published_at DESC
      `,
      sql`
        SELECT id, title, slug, date
        FROM events
        ORDER BY date DESC NULLS LAST
      `,
      sql`
        SELECT id, title, testata, file_url, published_at
        FROM press
        ORDER BY published_at DESC
      `,
    ]);

    return new Response(
      JSON.stringify({
        articles: articles.map((a: any) => ({
          type: 'article' as const,
          id: a.id,
          title: a.title,
          url: `/blog/${a.slug}`,
          date: a.published_at,
        })),
        events: events.map((e: any) => ({
          type: 'event' as const,
          id: e.id,
          title: e.title,
          url: `/eventi/${e.slug}`,
          date: e.date,
        })),
        press: press.map((p: any) => ({
          type: 'press' as const,
          id: p.id,
          title: p.title,
          url: p.file_url,
          date: p.published_at,
          testata: p.testata,
        })),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
