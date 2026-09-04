import { formatQuantity } from './format.js';

export function buildBringUrl(ingredients) {
  if (ingredients.length === 0) return 'bring://bring/';
  const items = ingredients
    .map(i => `${encodeURIComponent(i.name)},${encodeURIComponent(formatQuantity(i) || '')}`)
    .join(';');
  return `bring://bring/?items=${items}`;
}
