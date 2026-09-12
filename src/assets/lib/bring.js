export function buildBringImportUrl(origin, ingredients) {
  const data = encodeURIComponent(JSON.stringify(ingredients));
  const recipeUrl = `${origin}/api/planner-recipe?data=${data}`;
  return `https://api.getbring.com/rest/bringrecipes/deeplink?url=${encodeURIComponent(recipeUrl)}&source=web`;
}
