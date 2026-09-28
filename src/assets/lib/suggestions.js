// Pantry staples and dry spices keep for months, so sharing them creates no
// shopping synergy and they never count as a common ingredient.
export const STAPLES = new Set([
  'Salz', 'Pfeffer', 'Öl', 'Olivenöl', 'Wasser', 'Zucker', 'Mehl', 'Butter', 'Natron', 'Honig',
  'Muskatnuss', 'Kreuzkümmel', 'Currypulver', 'Paprikapulver', 'Chiliflocken', 'Knoblauchpulver',
  'Zwiebelpulver', 'Selleriesamen', 'Hühnerbrühepulver', 'Brühe-Pulver', 'Gemüsebrühe'
]);

// Ingredient names follow "Grundzutat (Anmerkungen)" — see the
// rezept-normalisierer skill — so the base is everything before the bracket.
export function baseIngredient(name) {
  return name.replace(/\s*\(.*$/, '').trim();
}

export function baseIngredients(ingredients) {
  const bases = (ingredients || [])
    .filter(i => i && typeof i.name === 'string')
    .map(i => baseIngredient(i.name))
    .filter(b => b && !STAPLES.has(b));
  return [...new Set(bases)];
}

// Unplanned recipes ranked by how many base ingredients they share with
// the planned ones. Each entry: { recipe, shared: [base, …] }.
export function suggestRecipes(planned, all, limit = 5) {
  const plannedIds = new Set(planned.map(r => r.id));
  const plannedBases = new Set(planned.flatMap(r => r.ingredients || []));
  return all
    .filter(r => !plannedIds.has(r.id))
    .map(recipe => ({
      recipe,
      shared: (recipe.ingredients || []).filter(b => plannedBases.has(b))
    }))
    .filter(s => s.shared.length > 0)
    .sort((a, b) => b.shared.length - a.shared.length || a.recipe.title.localeCompare(b.recipe.title, 'de'))
    .slice(0, limit);
}
