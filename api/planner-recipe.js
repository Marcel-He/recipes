import { inflateRawSync } from 'node:zlib';

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function formatIngredientLine(ingredient) {
  const qty = [ingredient.amount, ingredient.unit].filter(Boolean).join(' ');
  return qty ? `${qty} ${ingredient.name}` : ingredient.name;
}

// `z`: newline-separated ingredient lines, deflate-raw compressed, base64url.
function decodeCompressedLines(z) {
  try {
    const text = inflateRawSync(Buffer.from(z, 'base64url')).toString('utf8');
    return text.split('\n').map(l => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

// `data`: legacy JSON-encoded ingredient array.
function decodeJsonLines(data) {
  let ingredients;
  try {
    ingredients = JSON.parse(data || '[]');
  } catch {
    ingredients = [];
  }
  if (!Array.isArray(ingredients)) ingredients = [];
  return ingredients
    .filter(i => i && typeof i.name === 'string')
    .map(formatIngredientLine);
}

export default function handler(req, res) {
  const lines = typeof req.query.z === 'string'
    ? decodeCompressedLines(req.query.z)
    : decodeJsonLines(req.query.data);

  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: 'Shopping List',
    author: { '@type': 'Organization', name: 'Recipes' },
    recipeIngredient: lines
  };

  const jsonLdScript = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Shopping List</title>
<script type="application/ld+json">${jsonLdScript}</script>
</head>
<body>
<h1>Shopping List</h1>
<ul>
${lines.map(l => `<li>${escapeHtml(l)}</li>`).join('\n')}
</ul>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.status(200).send(html);
}
