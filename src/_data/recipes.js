import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function() {
  const dir = join(__dirname, '../recipes');
  let files;
  try {
    files = (await readdir(dir)).filter(f => f.endsWith('.json') && !f.match(/\.11tydata\.json$/));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async file => {
      const content = await readFile(join(dir, file), 'utf-8');
      return JSON.parse(content);
    })
  );
}
