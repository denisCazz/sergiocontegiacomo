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
    // CSRF origin check (Astro 5) blocks multipart POST if Origin ≠ site; common behind proxy or www/apex.
    security: { checkOrigin: false },
    adapter: node({ mode: 'standalone' }),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
		],
    scopedStyleStrategy: 'where',
});