import type { APIRoute } from 'astro';
import { siteConfig } from '../lib/config';
import { sitemapIndexXml, SITEMAP_HEADERS } from '../lib/sitemap';

export const prerender = false;

export const GET: APIRoute = async () => {
  return new Response(sitemapIndexXml(`${siteConfig.siteUrl}/sitemap.xml`), {
    headers: SITEMAP_HEADERS,
  });
};
