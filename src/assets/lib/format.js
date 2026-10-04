export function formatQuantity(ingredient) {
  const { amount, unit } = ingredient;
  if (amount == null || amount === 0) return '';
  return unit ? `${amount} ${unit}` : `${amount}`;
}
