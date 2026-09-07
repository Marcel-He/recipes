import { writeFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { extractOgImageUrl, extractTitle } from './lib.mjs';

const pageUrl = process.argv[2];
if (!pageUrl) {
  console.error('Usage: fetch-og-image.mjs <page-url>');
  process.exit(1);
}

const headers = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
};

const pageResponse = await fetch(pageUrl, { headers });
if (!pageResponse.ok) {
  throw new Error(`Failed to fetch ${pageUrl}: ${pageResponse.status} ${pageResponse.statusText}`);
}
const html = await pageResponse.text();

const ogImageUrl = extractOgImageUrl(html, pageUrl);
const title = extractTitle(html);

if (!ogImageUrl) {
  console.log(JSON.stringify({ tempImagePath: null, title, ogImageUrl: null }));
  process.exit(0);
}

const imageResponse = await fetch(ogImageUrl, { headers });
if (!imageResponse.ok) {
  throw new Error(`Failed to download ${ogImageUrl}: ${imageResponse.status} ${imageResponse.statusText}`);
}
const buffer = Buffer.from(await imageResponse.arrayBuffer());

const contentType = imageResponse.headers.get('content-type') ?? '';
const ext = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';

const dir = await mkdtemp(join(tmpdir(), 'og-thumbnail-'));
const tempImagePath = join(dir, `source.${ext}`);
await writeFile(tempImagePath, buffer);

console.log(JSON.stringify({
  tempImagePath,
  title,
  ogImageUrl
}));
