// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
	site: 'https://www.sergiocontegiacomo.it',
	output: 'server',
	adapter: vercel(),
	integrations: [tailwind({ configFile: './tailwind.config.cjs' }), sitemap()],
	scopedStyleStrategy: 'where',
});
