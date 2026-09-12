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

export default function handler(req, res) {
  let ingredients;
  try {
    ingredients = JSON.parse(req.query.data || '[]');
  } catch {
    ingredients = [];
  }
  if (!Array.isArray(ingredients)) ingredients = [];

  const lines = ingredients
    .filter(i => i && typeof i.name === 'string')
    .map(formatIngredientLine);

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
