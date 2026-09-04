export function formatQuantity(ingredient) {
  const { amount, unit } = ingredient;
  const hasAmount = amount != null && amount !== 0;
  if (hasAmount && unit) return `${amount} ${unit}`;
  if (hasAmount) return `${amount}`;
  if (unit) return unit;
  return null;
}

export function formatIngredient(ingredient) {
  const qty = formatQuantity(ingredient);
  return qty ? `${ingredient.name}: ${qty}` : ingredient.name;
}
