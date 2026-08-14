import { getArticles, getEvents } from './cms';
import { siteConfig } from './config';

const STATIC_PATHS = [
  '/',
  '/chi-sono',
  '/cosa-faccio',
  '/consulente-finanziario-bra',
  '/blog',
  '/blog/audiopillole',
  '/blog/podcast',
  '/blog/rassegna-stampa',
  '/eventi',
  '/gallery',
  '/recensioni',
  '/lascia-una-recensione',
  '/contatti',
  '/privacy',
  '/cookie',
];

export type SitemapUrl = {
  loc: string;
  lastmod?: string;
};

function toIsoDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function getSitemapUrls(): Promise<SitemapUrl[]> {
  const urls: SitemapUrl[] = STATIC_PATHS.map((path) => ({
    loc: path === '/' ? `${siteConfig.siteUrl}/` : `${siteConfig.siteUrl}${path}`,
  }));

  const [{ data: articles }, { data: events }] = await Promise.all([
    getArticles({ pagination: { page: 1, pageSize: 1000 } }),
    getEvents({ pagination: { page: 1, pageSize: 1000 } }),
  ]);

  for (const entry of articles ?? []) {
    const article = entry.attributes;
    if (!article?.slug) continue;
    urls.push({
      loc: `${siteConfig.siteUrl}/blog/${article.slug}`,
      lastmod: toIsoDate(article.publishedAt),
    });
  }

  for (const entry of events ?? []) {
    const event = entry.attributes;
    if (!event?.slug) continue;
    urls.push({
      loc: `${siteConfig.siteUrl}/eventi/${event.slug}`,
      lastmod: toIsoDate(event.date),
    });
  }

  return urls;
}

export function urlsToUrlsetXml(urls: SitemapUrl[]): string {
  const body = urls
    .map((url) => {
      const lastmod = url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : '';
      return `<url><loc>${escapeXml(url.loc)}</loc>${lastmod}</url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(sitemapLoc: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>${escapeXml(sitemapLoc)}</loc></sitemap></sitemapindex>`;
}

export const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600',
};
