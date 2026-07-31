/**
 * Export Supabase tables → local SQL dump (data-only inserts).
 *
 * Usage:
 *   node --env-file=.env scripts/export-supabase-to-sql.mjs
 *
 * Then on the VPS (or any host that can reach DATABASE_URL):
 *   psql "$DATABASE_URL" -f sql/schema.sql
 *   psql "$DATABASE_URL" -f data/supabase-export.sql
 *   npm run migrate:media
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SUPABASE_URL = (process.env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const TABLES = [
  'articles',
  'events',
  'audio_pillole',
  'press',
  'podcasts',
  'testimonials',
  'comments',
  'event_rsvps',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '..', 'data');
const outFile = path.join(outDir, 'supabase-export.sql');

async function fetchAll(table) {
  const pageSize = 1000;
  let from = 0;
  const rows = [];

  while (true) {
    const to = from + pageSize - 1;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*`, {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        Range: `${from}-${to}`,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`${table}: ${res.status} ${body}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < pageSize) break;
    from += pageSize;
  }

  return rows;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (Array.isArray(value)) {
    if (value.length === 0) return `'{}'::text[]`;
    const parts = value.map((v) => {
      if (v === null || v === undefined) return 'NULL';
      return `'${String(v).replace(/'/g, "''")}'`;
    });
    return `ARRAY[${parts.join(', ')}]::text[]`;
  }
  if (typeof value === 'object') {
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertStatement(table, row) {
  const columns = Object.keys(row);
  const cols = columns.map((c) => `"${c}"`).join(', ');
  const vals = columns.map((c) => sqlLiteral(row[c])).join(', ');
  return `INSERT INTO public.${table} (${cols}) VALUES (${vals});`;
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });

  const lines = [
    '-- Auto-generated from Supabase REST export',
    `-- Source: ${SUPABASE_URL}`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
    'BEGIN;',
    '',
  ];

  // Parent tables first, then FK children. Truncate children first via CASCADE from parents.
  lines.push('TRUNCATE TABLE public.comments, public.event_rsvps, public.articles, public.events, public.audio_pillole, public.press, public.podcasts, public.testimonials RESTART IDENTITY CASCADE;');
  lines.push('');

  const summary = [];

  for (const table of TABLES) {
    console.log(`Fetching ${table}…`);
    const rows = await fetchAll(table);
    summary.push(`${table}=${rows.length}`);
    lines.push(`-- ${table}: ${rows.length} rows`);
    for (const row of rows) {
      lines.push(insertStatement(table, row));
    }
    lines.push('');
    if (rows.length) {
      lines.push(`SELECT setval(pg_get_serial_sequence('public.${table}', 'id'), COALESCE((SELECT MAX(id) FROM public.${table}), 1), true);`);
      lines.push('');
    }
  }

  lines.push('COMMIT;');
  lines.push('');

  fs.writeFileSync(outFile, lines.join('\n'), 'utf8');
  console.log(`\nWrote ${outFile}`);
  console.log('Counts:', summary.join(', '));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
