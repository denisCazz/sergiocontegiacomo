import { execFile } from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const root = process.cwd();

const INPUTS = [
  'public/brochure.pdf',
  'public/capitolo_omaggio_sergio.pdf',
];

const PRESET = process.argv.includes('--screen') ? 'screen' : 'ebook';

function mb(bytes) {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

async function findGhostscript() {
  const candidates = process.platform === 'win32' ? ['gswin64c', 'gswin32c', 'gs'] : ['gs', 'gswin64c'];
  for (const cmd of candidates) {
    try {
      const { stdout } = await execFileAsync(cmd, ['--version']);
      return { cmd, version: stdout.trim() };
    } catch {
      /* try next */
    }
  }
  return null;
}

async function optimizePdf(relPath, gsCmd) {
  const inputPath = path.join(root, relPath);
  const tmpPath = `${inputPath}.tmp.pdf`;

  try {
    await fs.access(inputPath);
  } catch {
    console.warn(`skip: missing ${relPath}`);
    return;
  }

  const before = (await fs.stat(inputPath)).size;

  await execFileAsync(gsCmd, [
    '-sDEVICE=pdfwrite',
    '-dCompatibilityLevel=1.4',
    `-dPDFSETTINGS=/${PRESET}`,
    '-dNOPAUSE',
    '-dQUIET',
    '-dBATCH',
    `-sOutputFile=${tmpPath}`,
    inputPath,
  ]);

  const after = (await fs.stat(tmpPath)).size;

  if (after < before) {
    await fs.rename(tmpPath, inputPath);
    console.log(`optimized\t${relPath}\t${mb(before)}MB -> ${mb(after)}MB`);
  } else {
    await fs.unlink(tmpPath);
    console.log(`kept\t${relPath}\t${mb(before)}MB (tmp not smaller)`);
  }
}

const gs = await findGhostscript();
if (!gs) {
  console.error(
    'Ghostscript not found. Install: macOS `brew install ghostscript`, Debian `apt install ghostscript`'
  );
  process.exit(1);
}

console.log(`Using ${gs.cmd} ${gs.version} (preset: /${PRESET})\n`);

for (const rel of INPUTS) {
  await optimizePdf(rel, gs.cmd);
}

console.log('\nDone.');
