import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const publicDir = path.join(root, 'public');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

const allFiles = await walk(publicDir);
const stats = await Promise.all(
  allFiles.map(async (file) => {
    const st = await fs.stat(file);
    const rel = path.relative(root, file).replaceAll('\\', '/');
    const ext = path.extname(file).toLowerCase() || '(none)';
    return { rel, ext, bytes: st.size };
  })
);

stats.sort((a, b) => b.bytes - a.bytes);

console.log('\nLargest files in public/:');
stats.slice(0, 20).forEach((f) => {
  console.log(`${mb(f.bytes).toFixed(2)} MB\t${f.rel}`);
});

const totals = new Map();
for (const f of stats) {
  totals.set(f.ext, (totals.get(f.ext) ?? 0) + f.bytes);
}

console.log('\nTotal size by extension (public/):');
[...totals.entries()]
  .sort((a, b) => b[1] - a[1])
  .forEach(([ext, bytes]) => {
    console.log(`${mb(bytes).toFixed(2)} MB\t${ext}`);
  });

const totalBytes = stats.reduce((sum, f) => sum + f.bytes, 0);
console.log(`\nTotal public/ size: ${mb(totalBytes).toFixed(2)} MB\n`);
