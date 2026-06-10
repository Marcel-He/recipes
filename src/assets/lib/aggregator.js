export function aggregateIngredients(recipes) {
  const map = new Map();
  for (const recipe of recipes) {
    for (const ing of recipe.ingredients) {
      const key = `${ing.name}|${ing.unit}`;
      if (map.has(key)) {
        map.get(key).amount += ing.amount;
      } else {
        map.set(key, { name: ing.name, amount: ing.amount, unit: ing.unit });
      }
    }
  }
  return Array.from(map.values());
}
