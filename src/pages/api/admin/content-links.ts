import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const GET: APIRoute = async () => {
  try {
    // Fetch articles, events, and press items in parallel
    const [articlesRes, eventsRes, pressRes] = await Promise.all([
      supabase
        .from('articles')
        .select('id, title, slug, published_at')
        .not('published_at', 'is', null)
        .order('published_at', { ascending: false }),
      supabase
        .from('events')
        .select('id, title, slug, date')
        .order('date', { ascending: false }),
      supabase
        .from('press')
        .select('id, title, testata, file_url, published_at')
        .order('published_at', { ascending: false }),
    ]);

    const articles = (articlesRes.data ?? []).map((a) => ({
      type: 'article' as const,
      id: a.id,
      title: a.title,
      url: `/blog/${a.slug}`,
      date: a.published_at,
    }));

    const events = (eventsRes.data ?? []).map((e) => ({
      type: 'event' as const,
      id: e.id,
      title: e.title,
      url: `/eventi/${e.slug}`,
      date: e.date,
    }));

    const press = (pressRes.data ?? []).map((p) => ({
      type: 'press' as const,
      id: p.id,
      title: p.title,
      url: p.file_url,
      date: p.published_at,
      testata: p.testata,
    }));

    return new Response(JSON.stringify({ articles, events, press }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
