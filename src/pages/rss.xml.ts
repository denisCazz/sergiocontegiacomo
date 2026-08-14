import rss from '@astrojs/rss';
import { getArticles } from '../lib/cms';
import { siteConfig } from '../lib/config';

export const prerender = false;

export async function GET() {
  const { data } = await getArticles({ pagination: { page: 1, pageSize: 1000 } });
  const articles = data ?? [];

  return rss({
    title: `${siteConfig.name} | Blog`,
    description: 'Aggiornamenti su finanza, wealth management e coaching patrimoniale.',
    site: siteConfig.siteUrl,
    items: articles.map((entry) => {
      const article = entry.attributes;
      return {
        title: article.title,
        pubDate: article.publishedAt ? new Date(article.publishedAt) : new Date(),
        description: article.excerpt,
        link: `${siteConfig.siteUrl}/blog/${article.slug}`,
      };
    }),
  });
}
