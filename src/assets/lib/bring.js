export function buildBringUrl(ingredients) {
  if (ingredients.length === 0) return 'bring://bring/';
  const items = ingredients
    .map(i => `${encodeURIComponent(i.name)},${encodeURIComponent(`${i.amount} ${i.unit}`.trim())}`)
    .join(';');
  return `bring://bring/?items=${items}`;
}
