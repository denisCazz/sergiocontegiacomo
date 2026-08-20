/**
 * One-shot: migrate media URLs from Supabase Storage → Cloudflare R2
 * and update Postgres columns.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-media-to-r2.mjs
 */

import { execFile } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { mkdtemp, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { Upload } from '@aws-sdk/lib-storage';
import { S3Client } from '@aws-sdk/client-s3';
import postgres from 'postgres';

const execFileAsync = promisify(execFile);

const DATABASE_URL = process.env.DATABASE_URL;
const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'sergio-media';
const R2_PUBLIC_URL = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

if (!DATABASE_URL) {
  console.error('DATABASE_URL missing');
  process.exit(1);
}
if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
  console.error('R2 credentials missing');
  process.exit(1);
}

const sql = postgres(DATABASE_URL, { max: 5, connect_timeout: 20 });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
  responseChecksumValidation: 'WHEN_REQUIRED',
});

function isSupabaseStorageUrl(url) {
  return typeof url === 'string' && url.includes('supabase.co/storage/');
}

function isAlreadyR2(url) {
  if (typeof url !== 'string') return false;
  return (
    url.includes('r2.dev') ||
    url.includes('r2.cloudflarestorage.com') ||
    (R2_PUBLIC_URL && url.startsWith(R2_PUBLIC_URL))
  );
}

function guessCategory(url, fallback) {
  if (url.includes('/images/')) return 'images';
  if (url.includes('/audio/')) return 'audio';
  if (url.includes('/press/')) return 'press';
  return fallback;
}

function filenameFromUrl(url) {
  try {
    const pathname = new URL(url).pathname;
    const parts = pathname.split('/');
    return parts[parts.length - 1] || `file-${Date.now()}`;
  } catch {
    return `file-${Date.now()}`;
  }
}

function guessContentType(filename) {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp3')) return 'audio/mpeg';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
}

async function downloadToFile(url) {
  const dir = await mkdtemp(join(tmpdir(), 'r2-mig-'));
  const file = join(dir, 'blob');
  await execFileAsync(
    'curl',
    ['-fsSL', '--max-time', '180', '--retry', '3', '--retry-delay', '2', '-o', file, url],
    { timeout: 200_000, maxBuffer: 1024 }
  );
  const info = await stat(file);
  console.log(`    size=${Math.round(info.size / 1024)}KB`);
  return { dir, file, contentType: guessContentType(filenameFromUrl(url)) };
}

async function uploadFile(file, contentType, category, filename) {
  const sanitized = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '_').replace(/_+/g, '_');
  const key = `${category}/${Date.now()}_${sanitized}`;
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: createReadStream(file),
      ContentType: contentType || 'application/octet-stream',
    },
    partSize: 5 * 1024 * 1024,
    queueSize: 1,
  });
  await upload.done();
  return R2_PUBLIC_URL
    ? `${R2_PUBLIC_URL}/${key}`
    : `https://pub-${R2_ACCOUNT_ID}.r2.dev/${key}`;
}

async function migrateUrl(url, fallbackCategory) {
  if (!url || isAlreadyR2(url) || !isSupabaseStorageUrl(url)) {
    return null;
  }

  console.log(`  Downloading: ${url}`);
  const { dir, file, contentType } = await downloadToFile(url);
  try {
    const category = guessCategory(url, fallbackCategory);
    const newUrl = await uploadFile(file, contentType, category, filenameFromUrl(url));
    console.log(`  Uploaded → ${newUrl}`);
    return newUrl;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

const targets = [
  { table: 'articles', column: 'cover_image', category: 'images', idCol: 'id' },
  { table: 'events', column: 'cover_image', category: 'images', idCol: 'id' },
  { table: 'events', column: 'pdf_url', category: 'press', idCol: 'id' },
  { table: 'audio_pillole', column: 'file_url', category: 'audio', idCol: 'id' },
  { table: 'podcasts', column: 'file_url', category: 'audio', idCol: 'id' },
  { table: 'press', column: 'file_url', category: 'press', idCol: 'id' },
];

async function main() {
  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const t of targets) {
    console.log(`\n=== ${t.table}.${t.column} ===`);
    const rows = await sql.unsafe(
      `SELECT ${t.idCol} AS id, ${t.column} AS url FROM ${t.table} WHERE ${t.column} IS NOT NULL`
    );

    for (const row of rows) {
      try {
        const newUrl = await migrateUrl(row.url, t.category);
        if (!newUrl) {
          skipped++;
          continue;
        }
        await sql.unsafe(`UPDATE ${t.table} SET ${t.column} = $1 WHERE ${t.idCol} = $2`, [
          newUrl,
          row.id,
        ]);
        migrated++;
      } catch (err) {
        failed++;
        console.error(`  FAIL id=${row.id}:`, err.message || err);
      }
    }
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} failed=${failed}`);
  await sql.end({ timeout: 5 });
  if (failed) process.exit(1);
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 5 });
  process.exit(1);
});
