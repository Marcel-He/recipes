import { formatQuantity } from './format.js';

// Bring's recipe import reads schema.org Recipe markup from the page it is
// pointed at; recipeYield is what the servings picker in the import scales from.
export function toIngredientLine(ingredient) {
  const qty = formatQuantity(ingredient);
  return qty ? `${qty} ${ingredient.name}` : ingredient.name;
}

export function buildRecipeJsonLd(recipe, { image } = {}) {
  const jsonLd = {
    '@context': 'https://schema.org/',
    '@type': 'Recipe',
    name: recipe.title,
    recipeYield: String(recipe.servings),
    recipeIngredient: (recipe.ingredients || [])
      .filter(i => i && typeof i.name === 'string')
      .map(toIngredientLine)
  };
  if (image) jsonLd.image = image;
  return jsonLd;
}
