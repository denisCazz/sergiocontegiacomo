// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.sergiocontegiacomo.it',
    output: 'server',
    adapter: vercel(),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
      robotsTxt({
        policy: [
          { 
						userAgent: 'Googlebot',
						allow: '/',
						disallow: ['/admin', '/admin/*'],
						crawlDelay: 2,
					 },
        ],
      }),
		],
    scopedStyleStrategy: 'where',
});