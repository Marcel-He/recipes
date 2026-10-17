export function formatQuantity(ingredient) {
  const { amount, unit } = ingredient;
  if (amount == null || amount === 0) return '';
  return unit ? `${amount} ${unit}` : `${amount}`;
}

export function formatIngredientParenthetical(ingredient) {
  const qty = formatQuantity(ingredient);
  return qty ? `${ingredient.name} (${qty})` : ingredient.name;
}
