import type { APIRoute } from 'astro';
import { requireAdminFromRequest, unauthorizedResponse } from '../../../lib/auth';
import { sql } from '../../../lib/db';
import { ensureGallerySchema } from '../../../lib/cms';
import { ensureLeadsSchema } from '../../../lib/leads';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    requireAdminFromRequest(request);
  } catch {
    return unauthorizedResponse();
  }

  try {
    await ensureGallerySchema();
    await ensureLeadsSchema();
    const [counts, recentArticles, recentAudio, recentEvents, recentPress, recentPodcasts] = await Promise.all([
      sql`
        SELECT
          (SELECT COUNT(*)::int FROM articles) AS articles,
          (SELECT COUNT(*)::int FROM audio_pillole) AS audio,
          (SELECT COUNT(*)::int FROM events) AS events,
          (SELECT COUNT(*)::int FROM press) AS press,
          (SELECT COUNT(*)::int FROM podcasts) AS podcasts,
          (SELECT COUNT(*)::int FROM testimonials) AS testimonials,
          (SELECT COUNT(*)::int FROM gallery_images) AS gallery,
          (SELECT COUNT(*)::int FROM contact_requests) AS contacts,
          (SELECT COUNT(*)::int FROM contact_requests WHERE status = 'new') AS contacts_new,
          (SELECT COUNT(*)::int FROM newsletter_subscribers WHERE status = 'active') AS newsletter
      `,
      sql`SELECT id, title, created_at FROM articles ORDER BY created_at DESC LIMIT 3`,
      sql`SELECT id, title, created_at FROM audio_pillole ORDER BY created_at DESC LIMIT 3`,
      sql`SELECT id, title, created_at FROM events ORDER BY created_at DESC LIMIT 3`,
      sql`SELECT id, title, created_at FROM press ORDER BY created_at DESC LIMIT 3`,
      sql`SELECT id, title, created_at FROM podcasts ORDER BY created_at DESC LIMIT 3`,
    ]);

    return new Response(
      JSON.stringify({
        counts: counts[0],
        recent: {
          articles: recentArticles,
          audio: recentAudio,
          events: recentEvents,
          press: recentPress,
          podcasts: recentPodcasts,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
