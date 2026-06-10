export function scaleIngredients(ingredients, baseServings, targetServings) {
  const factor = targetServings / baseServings;
  return ingredients.map(ing => ({
    ...ing,
    amount: Math.round(ing.amount * factor * 10) / 10
  }));
}
