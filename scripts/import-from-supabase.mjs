/**
 * Import rows from Supabase REST → VPS Postgres (DATABASE_URL).
 *
 * Usage:
 *   node --env-file=.env scripts/import-from-supabase.mjs
 *
 * Requires: PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import postgres from 'postgres';

const SUPABASE_URL = (process.env.PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const DATABASE_URL = process.env.DATABASE_URL || '';

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const TABLES = [
  'articles',
  'events',
  'comments',
  'event_rsvps',
  'audio_pillole',
  'press',
  'podcasts',
  'testimonials',
];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');

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

async function main() {
  const sql = postgres(DATABASE_URL, { max: 3, connect_timeout: 30 });

  try {
    console.log('Applying schema…');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8').replace(/^\uFEFF/, '');
    await sql.unsafe(schemaSql);

    const probe = await sql`select current_database() as db`;
    console.log('Connected to', probe[0].db);

    for (const table of TABLES) {
      console.log(`\n=== ${table} ===`);
      const rows = await fetchAll(table);
      console.log(`Fetched ${rows.length} from Supabase`);
      if (!rows.length) continue;

      // Wipe destination so re-runs are idempotent for these tables
      await sql.unsafe(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);

      const columns = Object.keys(rows[0]);
      for (const row of rows) {
        const payload = Object.fromEntries(columns.map((c) => [c, row[c]]));
        await sql`insert into ${sql(table)} ${sql(payload)}`;
      }

      // Keep identity sequences in sync with imported ids
      await sql.unsafe(`
        SELECT setval(
          pg_get_serial_sequence('${table}', 'id'),
          COALESCE((SELECT MAX(id) FROM ${table}), 1),
          true
        )
      `);

      const count = await sql.unsafe(`SELECT count(*)::int AS n FROM ${table}`);
      console.log(`Inserted ${count[0].n} into VPS`);
    }

    console.log('\nImport complete.');
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
