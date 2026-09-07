const UMLAUTS = { ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' };

export function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[äöüß]/g, ch => UMLAUTS[ch])
    .replace(/['’]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function matchMetaContent(html, attrPattern) {
  const forward = new RegExp(`<meta[^>]*${attrPattern}[^>]*content=["']([^"']*)["'][^>]*>`, 'i');
  const backward = new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*${attrPattern}[^>]*>`, 'i');
  return html.match(forward)?.[1] ?? html.match(backward)?.[1] ?? null;
}

export function extractTitle(html) {
  const ogTitle = matchMetaContent(html, 'property=["\']og:title["\']');
  if (ogTitle) return ogTitle;
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  return titleTag ? titleTag[1] : null;
}

export function extractOgImageUrl(html, baseUrl) {
  const raw =
    matchMetaContent(html, 'property=["\']og:image["\']') ??
    matchMetaContent(html, 'property=["\']og:image:secure_url["\']') ??
    matchMetaContent(html, 'name=["\']twitter:image["\']');
  if (!raw) return null;
  return new URL(raw, baseUrl).toString();
}

export function computeSquareCrop({ width, height, cx, cy }) {
  const size = Math.min(width, height);
  const left = Math.min(Math.max(Math.round(cx * width - size / 2), 0), width - size);
  const top = Math.min(Math.max(Math.round(cy * height - size / 2), 0), height - size);
  return { left, top, size };
}

export function resolveOutputPath(dir, slug, ext, exists) {
  let candidate = `${dir}/${slug}.${ext}`;
  let n = 2;
  while (exists(candidate)) {
    candidate = `${dir}/${slug}-${n}.${ext}`;
    n++;
  }
  return candidate;
}
