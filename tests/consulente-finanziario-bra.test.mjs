import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pagePath = join(root, 'src', 'pages', 'consulente-finanziario-bra.astro');
const serviziPath = join(root, 'src', 'pages', 'cosa-faccio.astro');
const layoutPath = join(root, 'src', 'layouts', 'BaseLayout.astro');
const configPath = join(root, 'src', 'lib', 'config.ts');
const ogPath = join(root, 'public', 'consulente-finanziario-bra-og.jpg');
const homepagePath = join(root, 'src', 'pages', 'index.astro');

const requiredH2 = [
  'Una consulenza costruita intorno alla persona',
  'Consulenza finanziaria e patrimoniale per famiglie e imprenditori',
  'Un metodo basato su ascolto, analisi e continuità',
  'Oltre 35 anni di esperienza nella consulenza',
  'Consulente finanziario a Bra',
  'Domande frequenti',
  'Costruiamo un percorso per il tuo patrimonio',
];

const requiredFaqs = [
  'Di cosa si occupa un consulente finanziario?',
  'A chi è rivolta la consulenza di Sergio Contegiacomo?',
  'Dove si trova lo studio?',
  'Come si svolge il primo incontro?',
  'È possibile prenotare una call?',
  'La consulenza riguarda soltanto gli investimenti?',
];

test('landing page file exists', () => {
  assert.equal(existsSync(pagePath), true, 'missing src/pages/consulente-finanziario-bra.astro');
});

test('landing page has required SEO and content contracts', () => {
  const source = readFileSync(pagePath, 'utf8');

  assert.match(source, /export const prerender = true/);
  assert.match(source, /Consulente finanziario a Bra/);
  assert.match(
    source,
    /Sergio Contegiacomo, consulente finanziario e patrimoniale a Bra con oltre 35 anni di esperienza\. Consulenza per famiglie e imprenditori\./,
  );
  assert.match(source, /consulente-finanziario-bra-og\.jpg/);
  assert.match(source, /Consulente finanziario e patrimoniale a Bra/);
  assert.match(source, /Prenota una call/);
  assert.match(source, /Contattami/);
  assert.match(source, /href="\/contatti"/);
  assert.match(source, /href="\/chi-sono"/);
  assert.match(source, /href="\/cosa-faccio"/);
  assert.match(source, /href="\/"/);
  assert.match(source, /Scopri il percorso professionale di Sergio Contegiacomo/);
  assert.match(source, /Ottieni indicazioni/);
  assert.match(source, /'@type': 'WebPage'/);
  assert.match(source, /'@type': 'Person'/);
  assert.match(source, /'@type': 'FinancialService'/);
  assert.match(source, /'@type': 'BreadcrumbList'/);
  assert.match(source, /'@type': 'FAQPage'/);
  assert.match(source, /'@graph'/);

  for (const h2 of requiredH2) {
    assert.match(source, new RegExp(h2.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  for (const faq of requiredFaqs) {
    assert.match(source, new RegExp(faq.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }

  assert.doesNotMatch(source, /miglior consulente finanziario a Bra/i);
  assert.doesNotMatch(source, /rendimenti garantiti/i);
  assert.doesNotMatch(source, /consulente indipendente/i);
  assert.doesNotMatch(source, /AggregateRating/);
  assert.doesNotMatch(source, /"@type": "Review"/);
});

test('OG image exists', () => {
  assert.equal(existsSync(ogPath), true, 'missing public/consulente-finanziario-bra-og.jpg');
});

test('BaseLayout supports structured data opt-out', () => {
  const layout = readFileSync(layoutPath, 'utf8');
  assert.match(layout, /disableDefaultStructuredData/);
});

test('BaseLayout breadcrumb JSON-LD uses set:html so Astro evaluates it', () => {
  const layout = readFileSync(layoutPath, 'utf8');
  // Without set:html, Astro emits literal "{JSON.stringify(...)}" and Google reports
  // "Parsing error: Missing '}' or object member name".
  const breadcrumbSection = layout.slice(layout.indexOf('<!-- Breadcrumb Schema'));
  assert.match(breadcrumbSection, /"@type":\s*"BreadcrumbList"/);
  assert.match(
    breadcrumbSection,
    /<script\s+type="application\/ld\+json"\s+set:html=\{JSON\.stringify/,
  );
  assert.doesNotMatch(
    breadcrumbSection,
    /<script type="application\/ld\+json">\s*\{JSON\.stringify/,
  );
});

test('siteConfig exposes verified Allianz and Maps URLs', () => {
  const config = readFileSync(configPath, 'utf8');
  assert.match(config, /allianzbankfa\.it\/sergiocontegiacomo/);
  assert.match(config, /google\.com\/maps\/dir/);
});

test('servizi page links to the local landing', () => {
  const servizi = readFileSync(serviziPath, 'utf8');
  assert.match(servizi, /href="\/consulente-finanziario-bra"/);
  assert.match(servizi, /consulenza finanziaria e patrimoniale a Bra/);
});

test('homepage source remains unchanged from baseline', async () => {
  const expected = 'A4DCE819475B6382DCEA4A008F5427F9A6A27D2A2E40538D41EF058D0611A53D';
  const { createHash } = await import('node:crypto');
  const actual = createHash('sha256').update(readFileSync(homepagePath)).digest('hex').toUpperCase();
  assert.equal(actual, expected);
});
