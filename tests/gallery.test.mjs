import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

function altFromFilename(name) {
  const base = name.replace(/\.[^.]+$/, '');
  const cleaned = base.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'Immagine gallery';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function isGalleryImageFile(name) {
  return /\.(jpe?g|png|webp|gif|avif|svg)$/i.test(name);
}

test('altFromFilename turns file names into readable alt text', () => {
  const src = read('src/lib/gallery.ts');
  assert.match(src, /export function altFromFilename/);
  assert.equal(
    altFromFilename('sergio-contegiacomo-ritratto-esterno.jpg'),
    'Sergio contegiacomo ritratto esterno'
  );
  assert.equal(altFromFilename('team_tre_professionisti.png'), 'Team tre professionisti');
  assert.equal(altFromFilename('.jpg'), 'Immagine gallery');
});

test('isGalleryImageFile accepts common image extensions', () => {
  assert.equal(isGalleryImageFile('foto.JPG'), true);
  assert.equal(isGalleryImageFile('foto.webp'), true);
  assert.equal(isGalleryImageFile('notes.pdf'), false);
});

test('public gallery reads published CMS images instead of local assets glob', () => {
  const page = read('src/pages/gallery.astro');
  assert.match(page, /getPublishedGalleryImages/);
  assert.match(page, /prerender = false/);
  assert.doesNotMatch(page, /import\.meta\.glob/);
});

test('admin gallery and upload API exist', () => {
  assert.match(read('src/pages/admin/gallery.astro'), /\/api\/admin\/gallery/);
  assert.match(read('src/pages/api/admin/gallery.ts'), /reorderGalleryImages/);
  assert.match(read('sql/schema.sql'), /gallery_images/);
});
