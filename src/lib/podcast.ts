import { siteConfig } from './config';
import type { Podcast } from './cms';

export const podcastShow = {
  title: 'Conversazioni su finanza e crescita',
  author: siteConfig.name,
  email: siteConfig.contactEmail,
  description:
    'Episodi su finanza personale, investimenti, protezione del patrimonio e crescita. Conversazioni e approfondimenti a cura di Sergio Contegiacomo, consulente patrimoniale a Bra.',
  language: 'it-it',
  category: 'Business',
  subcategory: 'Investing',
  pagePath: '/blog/podcast',
  feedPath: '/podcast.xml',
  coverPath: '/og.jpg',
  explicit: false,
} as const;

export function podcastPageUrl(episodeId?: number | string): string {
  const base = `${siteConfig.siteUrl}${podcastShow.pagePath}`;
  return episodeId ? `${base}?e=${episodeId}` : base;
}

export function podcastFeedUrl(): string {
  return `${siteConfig.siteUrl}${podcastShow.feedPath}`;
}

export function podcastCoverUrl(): string {
  return `${siteConfig.siteUrl}${podcastShow.coverPath}`;
}

export function audioMimeType(fileUrl: string): string {
  const path = fileUrl.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.m4a') || path.endsWith('.mp4')) return 'audio/x-m4a';
  if (path.endsWith('.wav')) return 'audio/wav';
  if (path.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/mpeg';
}

export function itunesDuration(duration?: string | null): string {
  if (!duration) return '';
  const trimmed = duration.trim();
  if (/^\d+$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(':').map((p) => p.trim());
  if (parts.length === 2 || parts.length === 3) {
    return parts.map((p, i) => (i === 0 ? String(Number(p)) : p.padStart(2, '0'))).join(':');
  }
  return trimmed;
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function rfc2822Date(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toUTCString();
  return date.toUTCString();
}

type SizeCacheEntry = { size: number; expiresAt: number };
const enclosureSizeCache = new Map<string, SizeCacheEntry>();
const SIZE_CACHE_TTL_MS = 60 * 60 * 1000;

async function headContentLength(url: string): Promise<number> {
  const cached = enclosureSizeCache.get(url);
  if (cached && Date.now() < cached.expiresAt) return cached.size;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
    const length = Number(res.headers.get('content-length') || 0);
    const size = Number.isFinite(length) ? length : 0;
    enclosureSizeCache.set(url, { size, expiresAt: Date.now() + SIZE_CACHE_TTL_MS });
    return size;
  } catch {
    enclosureSizeCache.set(url, { size: 0, expiresAt: Date.now() + 5 * 60 * 1000 });
    return 0;
  } finally {
    clearTimeout(timer);
  }
}

export async function buildPodcastRss(episodes: Podcast[]): Promise<string> {
  const feedUrl = podcastFeedUrl();
  const pageUrl = podcastPageUrl();
  const coverUrl = podcastCoverUrl();
  const year = new Date().getFullYear();

  const published = [...episodes]
    .filter((ep) => ep.file_url)
    .sort((a, b) => {
      const da = new Date(b.published_at).getTime() - new Date(a.published_at).getTime();
      if (da !== 0) return da;
      return (b.episode_number ?? 0) - (a.episode_number ?? 0);
    });

  const sizes = await Promise.all(published.map((ep) => headContentLength(ep.file_url)));

  const items = published
    .map((ep, index) => {
      const title = escapeXml(ep.title);
      const description = escapeXml(ep.description || ep.title);
      const guid = `podcast-episode-${ep.id ?? index}`;
      const link = podcastPageUrl(ep.id);
      const duration = itunesDuration(ep.duration);
      const episodeTag =
        typeof ep.episode_number === 'number'
          ? `<itunes:episode>${ep.episode_number}</itunes:episode>`
          : '';

      return `<item>
      <title>${title}</title>
      <description>${description}</description>
      <itunes:summary>${description}</itunes:summary>
      <itunes:title>${title}</itunes:title>
      ${episodeTag}
      <itunes:episodeType>full</itunes:episodeType>
      <itunes:explicit>false</itunes:explicit>
      ${duration ? `<itunes:duration>${escapeXml(duration)}</itunes:duration>` : ''}
      <pubDate>${rfc2822Date(ep.published_at)}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
      <link>${escapeXml(link)}</link>
      <enclosure url="${escapeXml(ep.file_url)}" length="${sizes[index] || 0}" type="${audioMimeType(ep.file_url)}" />
    </item>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(podcastShow.title)}</title>
    <link>${escapeXml(pageUrl)}</link>
    <description>${escapeXml(podcastShow.description)}</description>
    <language>${podcastShow.language}</language>
    <copyright>© ${year} ${escapeXml(podcastShow.author)}</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <itunes:author>${escapeXml(podcastShow.author)}</itunes:author>
    <itunes:summary>${escapeXml(podcastShow.description)}</itunes:summary>
    <itunes:subtitle>${escapeXml(siteConfig.role)}</itunes:subtitle>
    <itunes:owner>
      <itunes:name>${escapeXml(podcastShow.author)}</itunes:name>
      <itunes:email>${escapeXml(podcastShow.email)}</itunes:email>
    </itunes:owner>
    <itunes:explicit>false</itunes:explicit>
    <itunes:type>episodic</itunes:type>
    <itunes:image href="${escapeXml(coverUrl)}"/>
    <itunes:category text="${podcastShow.category}">
      <itunes:category text="${podcastShow.subcategory}"/>
    </itunes:category>
    <itunes:category text="Education"/>
    <image>
      <url>${escapeXml(coverUrl)}</url>
      <title>${escapeXml(podcastShow.title)}</title>
      <link>${escapeXml(pageUrl)}</link>
    </image>
    ${items}
  </channel>
</rss>`;
}

export function subscribeLinks(feedUrl: string) {
  const encoded = encodeURIComponent(feedUrl);
  const hostPath = feedUrl.replace(/^https?:\/\//, '');
  return {
    apple: `podcast://${hostPath}`,
    appleItpc: `itpc://${hostPath}`,
    pocketCasts: `https://pca.st/subscribe?url=${encoded}`,
    overcast: `https://overcast.fm/ping?url=${encoded}`,
    antennaPod: `https://antennapod.org/deeplink/subscribe?url=${encoded}`,
  };
}
