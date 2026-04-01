// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// Always use production URL for SEO purposes (sitemap, canonical URLs, etc.)
const productionSite = 'https://www.sergiocontegiacomo.it';

// https://astro.build/config
export default defineConfig({
    site: productionSite,
    output: 'server',
    adapter: node({ mode: 'standalone' }),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
		],
    scopedStyleStrategy: 'where',
});