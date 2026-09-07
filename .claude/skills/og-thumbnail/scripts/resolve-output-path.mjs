import { existsSync } from 'node:fs';
import { resolveOutputPath, slugify } from './lib.mjs';

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 2) {
    args[argv[i].replace(/^--/, '')] = argv[i + 1];
  }
  return args;
}

const { dir, title, ext } = parseArgs(process.argv.slice(2));
if (!dir || !title || !ext) {
  console.error('Usage: resolve-output-path.mjs --dir <dir> --title <title> --ext <ext>');
  process.exit(1);
}

console.log(resolveOutputPath(dir, slugify(title), ext, existsSync));
