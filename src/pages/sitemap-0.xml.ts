import type { APIRoute } from 'astro';
import { getSitemapUrls, urlsToUrlsetXml, SITEMAP_HEADERS } from '../lib/sitemap';

export const prerender = false;

export const GET: APIRoute = async () => {
  const urls = await getSitemapUrls();
  return new Response(urlsToUrlsetXml(urls), { headers: SITEMAP_HEADERS });
};
