import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const read = (rel) => readFileSync(join(root, rel), 'utf8');

test('robots.txt allows CSS/JS and blocks only admin/api', () => {
  const robots = read('public/robots.txt');
  assert.doesNotMatch(robots, /Disallow:\s*\/_astro/);
  assert.match(robots, /Disallow:\s*\/admin/);
  assert.match(robots, /Disallow:\s*\/api/);
  assert.match(robots, /Sitemap:\s*https:\/\/www\.sergiocontegiacomo\.it\/sitemap-index\.xml/);
  assert.match(robots, /Sitemap:\s*https:\/\/www\.sergiocontegiacomo\.it\/sitemap\.xml/);
});

test('dynamic sitemap lists public pages and excludes admin', () => {
  const sitemap = read('src/lib/sitemap.ts');
  assert.match(sitemap, /\/consulente-finanziario-bra/);
  assert.match(sitemap, /\/chi-sono/);
  assert.match(sitemap, /getArticles/);
  assert.match(sitemap, /getEvents/);
  assert.doesNotMatch(sitemap, /\/admin/);
  assert.doesNotMatch(sitemap, /\/api/);
});

test('astro config does not emit admin URLs via sitemap plugin', () => {
  const config = read('astro.config.mjs');
  assert.doesNotMatch(config, /sitemap\(/);
  assert.match(config, /trailingSlash:\s*'never'/);
});

test('privacy and cookie pages are indexable', () => {
  assert.doesNotMatch(read('src/pages/privacy.astro'), /noindex=\{true\}/);
  assert.doesNotMatch(read('src/pages/cookie.astro'), /noindex=\{true\}/);
});

test('canonical URLs strip trailing slashes', () => {
  const layout = read('src/layouts/BaseLayout.astro');
  assert.match(layout, /stripTrailingSlash/);
  assert.match(layout, /href="\/favicon\.ico"/);
  assert.match(layout, /apple-touch-icon\.png/);
});

test('crawler 404 assets exist', () => {
  assert.equal(existsSync(join(root, 'public', 'favicon.ico')), true);
  assert.equal(existsSync(join(root, 'public', 'apple-touch-icon.png')), true);
});

test('SEO redirects cover apex aliases and old paths', () => {
  const seo = read('src/lib/seo.ts');
  assert.match(seo, /APEX_HOST/);
  assert.match(seo, /PRODUCTION_HOST/);
  assert.match(seo, /'\/servizi':\s*'\/cosa-faccio'/);
  assert.match(seo, /'\/about':\s*'\/chi-sono'/);
  assert.match(seo, /'\/contact':\s*'\/contatti'/);
  assert.match(seo, /'\/index\.html':\s*'\//);
});
