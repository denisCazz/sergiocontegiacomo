/**
 * Import Sergio podcast MP3s from a local folder to R2 + Postgres.
 *
 * Usage:
 *   node --env-file=.env scripts/import-podcasts.mjs
 */

import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import postgres from 'postgres';
import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const execFileAsync = promisify(execFile);

const SOURCE_DIR = process.env.PODCAST_SOURCE_DIR || '/tmp/podcast_sergio';

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

const sql = postgres(DATABASE_URL, { max: 3, connect_timeout: 20 });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

const EPISODES = [
  {
    file: 'puntata 01.mp3',
    title: "Introduzione all'educazione finanziaria aprile 2026",
    episode_number: 1,
    is_published: true,
    published_at: '2026-04-01',
    key: 'audio/podcast-01-introduzione-educazione-finanziaria.mp3',
    oldKey: 'audio/podcast-01-introduzione-educazione-finanziaria.m4a',
  },
  {
    file: 'puntata 02.mp3',
    title: 'Puntata 2',
    episode_number: 2,
    is_published: false,
    published_at: '2026-05-01',
    key: 'audio/podcast-02-puntata-2.mp3',
    oldKey: 'audio/podcast-02-puntata-2.m4a',
  },
  {
    file: 'puntata 03.mp3',
    title: 'Proteggersi dai rischi della vita',
    episode_number: 3,
    is_published: true,
    published_at: '2026-06-01',
    key: 'audio/podcast-03-proteggersi-dai-rischi-della-vita.mp3',
    oldKey: 'audio/podcast-03-proteggersi-dai-rischi-della-vita.m4a',
  },
  {
    file: 'Puntata 04.mp3',
    title: 'Il rischio secolare: nascere o diventare una persona con disabilità',
    episode_number: 4,
    is_published: true,
    published_at: '2026-07-01',
    key: 'audio/podcast-04-il-rischio-secolare-disabilita.mp3',
    oldKey: 'audio/podcast-04-il-rischio-secolare-disabilita.m4a',
  },
  {
    file: 'puntata 05.mp3',
    title: 'La sindrome di Dunning-Kruger',
    episode_number: 5,
    is_published: true,
    published_at: '2026-08-01',
    key: 'audio/podcast-05-la-sindrome-di-dunning-kruger.mp3',
    oldKey: 'audio/podcast-05-la-sindrome-di-dunning-kruger.m4a',
  },
  {
    file: 'puntata 05 ALICE.mp3',
    title: 'Puntata 5 — Alice',
    episode_number: null,
    is_published: false,
    published_at: '2026-08-01',
    key: 'audio/podcast-05-alice.mp3',
    oldKey: 'audio/podcast-05-alice.m4a',
  },
  {
    file: 'Puntata 05 Renata Morino.mp3',
    title: 'Puntata 5 — Renata Morino',
    episode_number: null,
    is_published: false,
    published_at: '2026-08-01',
    key: 'audio/podcast-05-renata-morino.mp3',
    oldKey: 'audio/podcast-05-renata-morino.m4a',
  },
];

function formatDuration(seconds) {
  const total = Math.round(Number(seconds));
  if (!Number.isFinite(total) || total <= 0) return null;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

async function getDuration(filePath) {
  try {
    const { stdout } = await execFileAsync('afinfo', [filePath]);
    const match = stdout.match(/estimated duration:\s+([0-9.]+)/);
    if (match) return formatDuration(match[1]);
  } catch {
    // ignore
  }
  return null;
}

async function uploadMp3(filePath, key) {
  const size = (await stat(filePath)).size;
  const started = Date.now();
  console.log(`  upload ${key} (${Math.round(size / 1024 / 1024)} MB)`);
  const upload = new Upload({
    client: s3,
    params: {
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: createReadStream(filePath),
      ContentType: 'audio/mpeg',
    },
    partSize: 8 * 1024 * 1024,
    queueSize: 3,
    leavePartsOnError: false,
  });
  upload.on('httpUploadProgress', (progress) => {
    if (!progress.total) return;
    const pct = Math.round((progress.loaded / progress.total) * 100);
    const elapsed = (Date.now() - started) / 1000;
    const mbps = elapsed > 0 ? (progress.loaded * 8) / elapsed / 1_000_000 : 0;
    process.stdout.write(`  ${pct}%  ${mbps.toFixed(1)} Mbps   \r`);
  });
  await upload.done();
  const elapsed = (Date.now() - started) / 1000;
  console.log(`  done in ${Math.round(elapsed)}s`);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function deleteKey(key) {
  if (!key) return;
  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
    console.log(`  deleted ${key}`);
  } catch (err) {
    console.warn(`  could not delete ${key}:`, err.message);
  }
}

async function main() {
  await sql`
    ALTER TABLE public.podcasts
      ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT true
  `;
  await sql`
    ALTER TABLE public.podcasts
      ADD COLUMN IF NOT EXISTS episode_number INTEGER
  `;

  for (const episode of EPISODES) {
    const filePath = path.join(SOURCE_DIR, episode.file);
    const duration = await getDuration(filePath);
    console.log(`\n${episode.title}`);
    console.log(`  file=${episode.file} duration=${duration || '?'} published=${episode.is_published}`);

    const file_url = await uploadMp3(filePath, episode.key);

    const existing = await sql`SELECT id FROM podcasts WHERE title = ${episode.title} LIMIT 1`;
    if (existing.length) {
      await sql`
        UPDATE podcasts
        SET file_url = ${file_url},
            duration = ${duration},
            episode_number = ${episode.episode_number},
            is_published = ${episode.is_published},
            published_at = ${episode.published_at}
        WHERE id = ${existing[0].id}
      `;
    } else {
      await sql`
        INSERT INTO podcasts (title, description, file_url, duration, episode_number, is_published, published_at)
        VALUES (
          ${episode.title},
          ${null},
          ${file_url},
          ${duration},
          ${episode.episode_number},
          ${episode.is_published},
          ${episode.published_at}
        )
      `;
    }

    await deleteKey(episode.oldKey);
    console.log(`  ok ${file_url}`);
  }

  const rows = await sql`
    SELECT id, episode_number, title, is_published, duration, file_url
    FROM podcasts
    ORDER BY episode_number ASC NULLS LAST, id
  `;
  console.log('\nPodcast in database:');
  for (const row of rows) {
    console.log(
      `  #${row.episode_number ?? '-'} ${row.is_published ? 'PUB' : 'DRAFT'}  ${row.duration || '?'}  ${row.title}`
    );
    console.log(`     ${row.file_url}`);
  }

  await sql.end();
}

main().catch(async (err) => {
  console.error(err);
  await sql.end({ timeout: 2 }).catch(() => {});
  process.exit(1);
});
