// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// Always use production URL for SEO purposes (sitemap, canonical URLs, etc.)
const productionSite = 'https://www.sergiocontegiacomo.it';

// https://astro.build/config
export default defineConfig({
    site: productionSite,
    output: 'server',
    adapter: vercel(),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
		],
    scopedStyleStrategy: 'where',
});