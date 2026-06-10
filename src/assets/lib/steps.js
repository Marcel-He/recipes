export function groupIngredientsByStep(ingredients) {
  return ingredients.reduce((groups, ing) => {
    const step = ing.step ?? 0;
    if (!groups[step]) groups[step] = [];
    groups[step].push(ing);
    return groups;
  }, {});
}
