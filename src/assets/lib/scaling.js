export function scaleIngredients(ingredients, baseServings, targetServings) {
  const factor = targetServings / baseServings;
  return ingredients.map(ing => ({
    ...ing,
    amount: ing.amount == null ? null : Math.round(ing.amount * factor * 10) / 10
  }));
}
