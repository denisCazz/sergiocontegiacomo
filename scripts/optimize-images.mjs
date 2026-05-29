import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);

const root = process.cwd();

const GALLERY_DIR = path.join(root, 'src/assets/gallery');
const HEIF_TO_JPEG_SWIFT = path.join(root, 'scripts/heif-to-jpeg.swift');
const GALLERY_MAX_WIDTH = 1600;
const GALLERY_LARGE_BYTES = 250 * 1024;
const GALLERY_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.heic']);

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

function kb(bytes) {
  return Math.round(bytes / 1024);
}

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

async function encodeGalleryToTmp(inputPath, tmpPath, ext, meta, maxWidth) {
  const resizeWidth =
    meta.width && meta.width > maxWidth ? maxWidth : undefined;

  let pipeline = sharp(inputPath).rotate();
  if (resizeWidth) {
    pipeline = pipeline.resize({ width: resizeWidth, withoutEnlargement: true });
  }

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      await pipeline.jpeg({ quality: 82, mozjpeg: true }).toFile(tmpPath);
      break;
    case '.png':
      await pipeline
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
        .toFile(tmpPath);
      break;
    case '.webp':
      await pipeline.webp({ quality: 82, effort: 4 }).toFile(tmpPath);
      break;
    case '.avif':
      await pipeline.avif({ quality: 50, effort: 5 }).toFile(tmpPath);
      break;
    default:
      throw new Error(`Unsupported extension: ${ext}`);
  }

  return resizeWidth ?? meta.width;
}

async function unlinkQuiet(filePath) {
  try {
    await fs.unlink(filePath);
  } catch {
    /* ignore */
  }
}

/** iPhone HEIF/AVIF 2.0: Sharp reads metadata but often cannot decode pixels. */
async function sharpCanDecode(filePath) {
  try {
    await sharp(filePath).rotate().resize({ width: 64, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
    return true;
  } catch {
    return false;
  }
}

async function isImageMostlyBlack(filePath) {
  try {
    const stats = await sharp(filePath).stats();
    return stats.channels.slice(0, 3).every((c) => c.mean < 4);
  } catch {
    return true;
  }
}

async function findSiblingDng(heifPath) {
  const base = heifPath.slice(0, -path.extname(heifPath).length);
  for (const ext of ['.DNG', '.dng']) {
    try {
      await fs.access(`${base}${ext}`);
      return `${base}${ext}`;
    } catch {
      /* try next */
    }
  }
  return null;
}

async function convertDngViaSips(dngPath, tmpPath, maxWidth) {
  await execFileAsync('sips', ['-s', 'format', 'jpeg', '-Z', String(maxWidth), dngPath, '--out', tmpPath]);
}

/** macOS ImageIO (Swift): HDR HEIF/AVIF — sips often outputs black JPEGs. */
async function convertGalleryHeifViaMacOS(filePath, { maxWidth }) {
  const relPath = path.relative(root, filePath).replaceAll('\\', '/');
  const inputStat = await fs.stat(filePath);
  const jpgPath = `${filePath.slice(0, -path.extname(filePath).length)}.jpg`;
  const tmpPath = `${jpgPath}.tmp`;
  const meta = await sharp(filePath).metadata().catch(() => null);

  const dngPath = await findSiblingDng(filePath);

  if (dngPath) {
    await convertDngViaSips(dngPath, tmpPath, maxWidth);
  } else {
    await execFileAsync('swift', [HEIF_TO_JPEG_SWIFT, filePath, tmpPath, String(maxWidth)]);
    if (await isImageMostlyBlack(tmpPath)) {
      await unlinkQuiet(tmpPath);
      return {
        relPath,
        changed: false,
        from: inputStat.size,
        to: inputStat.size,
        dims: 'skip: AVIF iPhone illeggibile — esporta JPG/HEIC o aggiungi il DNG nella stessa cartella',
        skipped: true,
      };
    }
  }

  if (await isImageMostlyBlack(tmpPath)) {
    await unlinkQuiet(tmpPath);
    return {
      relPath,
      changed: false,
      from: inputStat.size,
      to: inputStat.size,
      dims: 'skip: conversione HEIF fallita (file nero) — usa JPG o DNG',
      skipped: true,
    };
  }

  let finalPath = tmpPath;
  let finalStat = await fs.stat(tmpPath);
  let outWidth = maxWidth;
  let via = 'ImageIO';

  if (finalStat.size > GALLERY_LARGE_BYTES) {
    const recompressed = `${tmpPath}.sharp.jpg`;
    outWidth = await encodeGalleryToTmp(tmpPath, recompressed, '.jpg', meta ?? {}, maxWidth);
    await unlinkQuiet(tmpPath);
    finalPath = recompressed;
    finalStat = await fs.stat(recompressed);
    via = 'ImageIO+sharp';
  }

  await unlinkQuiet(jpgPath);
  await fs.rename(finalPath, jpgPath);
  if (filePath !== jpgPath) await unlinkQuiet(filePath);

  const dims = meta?.width
    ? `${meta.width}x${meta.height} -> ${outWidth}w JPEG (${via})`
    : `HEIF -> JPEG (${via})`;

  return {
    relPath,
    changed: true,
    from: inputStat.size,
    to: finalStat.size,
    dims,
    replacedWith: path.basename(jpgPath),
  };
}

/**
 * Gallery sources: resize wide images and recompress large files in-place.
 * Replaces the file when smaller, or when the original exceeded max width.
 */
async function optimizeGalleryFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const relPath = path.relative(root, filePath).replaceAll('\\', '/');
  const inputStat = await fs.stat(filePath);

  let meta;
  try {
    meta = await sharp(filePath).metadata();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if ((ext === '.avif' || ext === '.heic') && process.platform === 'darwin') {
      return convertGalleryHeifViaMacOS(filePath, { maxWidth: GALLERY_MAX_WIDTH });
    }
    return {
      relPath,
      changed: false,
      from: inputStat.size,
      to: inputStat.size,
      dims: `skip: ${message.split('\n')[0]}`,
      skipped: true,
    };
  }

  const tooWide = Boolean(meta.width && meta.width > GALLERY_MAX_WIDTH);
  const tooHeavy = inputStat.size > GALLERY_LARGE_BYTES;

  if (ext === '.jpg' || ext === '.jpeg') {
    if (await isImageMostlyBlack(filePath)) {
      return {
        relPath,
        changed: false,
        from: inputStat.size,
        to: inputStat.size,
        dims: 'skip: JPG nero — rimetti l’HEIF/AVIF originale e rilancia assets:optimize',
        skipped: true,
      };
    }
  }

  if (ext === '.avif' || ext === '.heic') {
    const decodable = await sharpCanDecode(filePath);
    if (!decodable) {
      if (process.platform === 'darwin') {
        return convertGalleryHeifViaMacOS(filePath, { maxWidth: GALLERY_MAX_WIDTH });
      }
      return {
        relPath,
        changed: false,
        from: inputStat.size,
        to: inputStat.size,
        dims: 'skip: HEIF/AVIF iPhone non supportato qui — esporta come JPG',
        skipped: true,
      };
    }
  }

  if (!tooWide && !tooHeavy) {
    return {
      relPath,
      changed: false,
      from: inputStat.size,
      to: inputStat.size,
      dims: `${meta.width}x${meta.height} (ok)`,
    };
  }

  const tmpPath = `${filePath}.tmp`;
  try {
    const outWidth = await encodeGalleryToTmp(filePath, tmpPath, ext, meta, GALLERY_MAX_WIDTH);
    const tmpStat = await fs.stat(tmpPath);
    const shouldReplace = tmpStat.size < inputStat.size || tooWide;

    if (shouldReplace) {
      await fs.rename(tmpPath, filePath);
      return {
        relPath,
        changed: true,
        from: inputStat.size,
        to: tmpStat.size,
        dims: `${meta.width}x${meta.height} -> ${outWidth}w`,
      };
    }

    await unlinkQuiet(tmpPath);
    return {
      relPath,
      changed: false,
      from: inputStat.size,
      to: inputStat.size,
      dims: `${meta.width}x${meta.height} (kept)`,
    };
  } catch (err) {
    await unlinkQuiet(tmpPath);
    if ((ext === '.avif' || ext === '.heic') && process.platform === 'darwin') {
      return convertGalleryHeifViaMacOS(filePath, { maxWidth: GALLERY_MAX_WIDTH });
    }
    const message = err instanceof Error ? err.message : String(err);
    return {
      relPath,
      changed: false,
      from: inputStat.size,
      to: inputStat.size,
      dims: `skip: ${message.split('\n')[0]}`,
      skipped: true,
    };
  }
}

async function optimizeGalleryDir() {
  let entries;
  try {
    entries = await fs.readdir(GALLERY_DIR, { withFileTypes: true });
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT') {
      console.log('\nGallery: cartella src/assets/gallery non trovata, skip.\n');
      return 0;
    }
    throw err;
  }

  const files = entries
    .filter((e) => e.isFile() && GALLERY_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
    .map((e) => path.join(GALLERY_DIR, e.name))
    .sort();

  if (!files.length) {
    console.log('\nGallery: nessun file da ottimizzare.\n');
    return 0;
  }

  console.log(`\nOptimizing gallery (${files.length} files, max ${GALLERY_MAX_WIDTH}px)...`);

  let saved = 0;
  for (const filePath of files) {
    const result = await optimizeGalleryFile(filePath);
    const delta = result.from - result.to;
    if (delta > 0) saved += delta;
    const status = result.skipped ? 'skipped' : result.changed ? 'optimized' : 'kept';
    const outName = result.replacedWith ? ` -> ${result.replacedWith}` : '';
    console.log(
      `${status}\t${result.relPath}${outName}\t${kb(result.from)}KB -> ${kb(result.to)}KB\t(${result.dims})`
    );
  }

  console.log(`\nGallery total saved: ${mb(saved).toFixed(2)} MB\n`);
  return saved;
}

const heroTargets = [
  { relPath: 'public/sergio.avif', maxWidth: 1000, quality: 45, effort: 5 },
  { relPath: 'public/sergio_2.avif', maxWidth: 1200, quality: 45, effort: 5 },
];

console.log('\nOptimizing AVIF images (in-place, only if smaller)...');

let heroSaved = 0;
for (const t of heroTargets) {
  const result = await optimizeAvifInPlace(t.relPath, t);
  const delta = result.from - result.to;
  if (delta > 0) heroSaved += delta;
  const status = result.changed ? 'optimized' : 'kept';
  console.log(
    `${status}\t${result.relPath}\t${mb(result.from).toFixed(2)}MB -> ${mb(result.to).toFixed(2)}MB\t(${result.dims})`
  );
}

console.log(`\nHero/OG total saved: ${mb(heroSaved).toFixed(2)} MB`);

const gallerySaved = await optimizeGalleryDir();

console.log(
  `Overall saved: ${mb(heroSaved + gallerySaved).toFixed(2)} MB\n` +
    'Tip: dopo nuove foto in src/assets/gallery, esegui npm run assets:optimize\n'
);
