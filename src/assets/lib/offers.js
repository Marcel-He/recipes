import Fuse from 'fuse.js';

// Base-ingredient names shorter than this fuzzy-match too broadly against
// unrelated offer names (e.g. "Ei" would match half the catalogue).
const MIN_INGREDIENT_LENGTH = 3;

// Stricter than the 0.4 used for recipe-title search in plan.js: offer names
// are short marketing strings, so looser fuzziness produces false positives
// ("Reis" ~ "Eis"). 0.3 still tolerates plural/inflection noise.
const MATCH_THRESHOLD = 0.3;

// ingredients: string[] of base ingredient names (see baseIngredients() in suggestions.js).
// offers: { name, retailer, price, validUntil }[].
// One entry per matched ingredient (best offer hit) — never duplicates an ingredient.
export function matchOffers(ingredients, offers) {
  if (!Array.isArray(offers) || offers.length === 0) return [];
  const fuse = new Fuse(offers, { keys: ['name'], threshold: MATCH_THRESHOLD, ignoreLocation: true });
  return (ingredients || [])
    .filter(i => i && i.length >= MIN_INGREDIENT_LENGTH)
    .map(ingredient => ({ ingredient, hit: fuse.search(ingredient)[0] }))
    .filter(m => m.hit)
    .map(m => ({ ingredient: m.ingredient, offer: m.hit.item }));
}

export function countOfferMatches(ingredients, offers) {
  return matchOffers(ingredients, offers).length;
}
