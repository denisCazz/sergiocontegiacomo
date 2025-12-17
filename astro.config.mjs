// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

const resolvedSite =
  process.env.PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://www.sergiocontegiacomo.it');

// https://astro.build/config
export default defineConfig({
    site: resolvedSite,
    output: 'server',
    adapter: vercel(),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
		],
    scopedStyleStrategy: 'where',
});