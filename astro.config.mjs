// @ts-check
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import playformCompress from '@playform/compress';
import robotsTxt from 'astro-robots-txt';

// https://astro.build/config
export default defineConfig({
    site: 'https://www.sergiocontegiacomo.it',
    output: 'server',
    adapter: vercel(),
    integrations: [
      tailwind({ configFile: './tailwind.config.cjs' }),
      sitemap(),
      playformCompress(),
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