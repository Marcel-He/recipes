import { readdir, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function() {
  const dir = join(__dirname, '../recipes');
  let files;
  try {
    files = (await readdir(dir, { recursive: true, withFileTypes: true }))
      .filter(f => f.isFile() && f.name.endsWith('.json') && !f.name.match(/\.11tydata\.json$/));
  } catch {
    return [];
  }
  return Promise.all(
    files.map(async f => {
      const content = await readFile(join(f.parentPath ?? f.path, f.name), 'utf-8');
      return JSON.parse(content);
    })
  );
}
