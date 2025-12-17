import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();

/**
 * Resize/re-encode a file in-place only if it becomes smaller.
 */
async function optimizeAvifInPlace(relPath, { maxWidth, quality = 45, effort = 5 }) {
  const inputPath = path.join(root, relPath);
  const tmpPath = `${inputPath}.tmp`;

  const inputStat = await fs.stat(inputPath);
  const meta = await sharp(inputPath).metadata();

  const resizeWidth = meta.width && meta.width > maxWidth ? maxWidth : meta.width;

  await sharp(inputPath)
    .rotate()
    .resize(resizeWidth ? { width: resizeWidth, withoutEnlargement: true } : undefined)
    .avif({ quality, effort })
    .toFile(tmpPath);

  const tmpStat = await fs.stat(tmpPath);

  if (tmpStat.size < inputStat.size) {
    await fs.rename(tmpPath, inputPath);
    return {
      relPath,
      changed: true,
      from: inputStat.size,
      to: tmpStat.size,
      dims: `${meta.width}x${meta.height} -> ${resizeWidth ?? meta.width}w`,
    };
  }

  await fs.unlink(tmpPath);
  return {
    relPath,
    changed: false,
    from: inputStat.size,
    to: inputStat.size,
    dims: `${meta.width}x${meta.height} (kept)`,
  };
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

const targets = [
  // Used in Hero + OG image. Current source is ~3112px wide; this is overkill.
  { relPath: 'public/sergio.avif', maxWidth: 1000, quality: 45, effort: 5 },
  // Used in /chi-sono. Current source is ~5257px wide; also overkill.
  { relPath: 'public/sergio_2.avif', maxWidth: 1200, quality: 45, effort: 5 },
];

console.log('\nOptimizing AVIF images (in-place, only if smaller)...');

let saved = 0;
for (const t of targets) {
  const result = await optimizeAvifInPlace(t.relPath, t);
  const delta = result.from - result.to;
  if (delta > 0) saved += delta;
  const status = result.changed ? 'optimized' : 'kept';
  console.log(
    `${status}\t${result.relPath}\t${mb(result.from).toFixed(2)}MB -> ${mb(result.to).toFixed(2)}MB\t(${result.dims})`
  );
}

console.log(`\nTotal saved: ${mb(saved).toFixed(2)} MB\n`);

console.log(
  'PDFs: for real size reduction you typically need Ghostscript/qpdf (not installed here).\n' +
    'If you want, I can add a script that runs Ghostscript when available, but you\'ll need to install it on your machine/CI.'
);
