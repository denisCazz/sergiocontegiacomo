import type { APIRoute } from 'astro';
import { getPublishedPodcasts } from '../lib/cms';
import { buildPodcastRss } from '../lib/podcast';

export const prerender = false;

export const GET: APIRoute = async () => {
  const episodes = await getPublishedPodcasts();
  const xml = await buildPodcastRss(episodes);

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=600',
    },
  });
};
