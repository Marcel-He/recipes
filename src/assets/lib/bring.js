import { formatQuantity } from './format.js';

// Bring's API gateway rejects any request URL longer than ~2048 characters
// with a bare 403, so the shopping list is sent as compact "qty name" lines,
// deflate-compressed and base64url-encoded (no further escaping needed).
export const BRING_MAX_URL_LENGTH = 2000;

export function toBringLines(ingredients) {
  return ingredients
    .filter(i => i && typeof i.name === 'string')
    .map(i => {
      const qty = formatQuantity(i);
      return qty ? `${qty} ${i.name}` : i.name;
    });
}

async function deflateBase64Url(text) {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer());
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function buildBringImportUrl(origin, ingredients) {
  const z = await deflateBase64Url(toBringLines(ingredients).join('\n'));
  const recipeUrl = `${origin}/api/planner-recipe?z=${z}`;
  return `https://api.getbring.com/rest/bringrecipes/deeplink?url=${encodeURIComponent(recipeUrl)}&source=web`;
}
