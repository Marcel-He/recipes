// Bring imports one recipe at a time from a page carrying schema.org Recipe
// markup. baseQuantity is the servings that markup is written for;
// requestedQuantity pre-selects the servings in Bring's import dialog.
export function buildBringImportUrl(recipePageUrl, baseServings, requestedServings = baseServings) {
  const params = new URLSearchParams({ url: recipePageUrl, source: 'web' });
  if (baseServings) {
    params.set('baseQuantity', String(baseServings));
    params.set('requestedQuantity', String(requestedServings || baseServings));
  }
  return `https://api.getbring.com/rest/bringrecipes/deeplink?${params}`;
}

export function recipePageUrl(origin, id) {
  return `${origin}/recipes/${id}/`;
}
