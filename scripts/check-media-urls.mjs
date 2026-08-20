import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL, { max: 1, connect_timeout: 20 });

const targets = [
  { table: 'articles', column: 'cover_image' },
  { table: 'events', column: 'cover_image' },
  { table: 'events', column: 'pdf_url' },
  { table: 'audio_pillole', column: 'file_url' },
  { table: 'podcasts', column: 'file_url' },
  { table: 'press', column: 'file_url' },
];

function kind(url) {
  if (!url) return 'empty';
  if (url.includes('supabase.co/storage/')) return 'supabase';
  if (url.includes('r2.dev') || url.includes('r2.cloudflarestorage.com')) return 'r2';
  return 'other';
}

try {
  for (const t of targets) {
    const rows = await sql.unsafe(
      `SELECT ${t.column} AS url FROM ${t.table} WHERE ${t.column} IS NOT NULL`
    );
    const counts = { supabase: 0, r2: 0, other: 0, empty: 0 };
    for (const row of rows) counts[kind(row.url)]++;
    console.log(`${t.table}.${t.column}: total=${rows.length}`, counts);
  }
} finally {
  await sql.end({ timeout: 2 });
}
