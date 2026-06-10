import { aggregateIngredients } from './lib/aggregator.js';
import { buildBringUrl } from './lib/bring.js';

async function init() {
  const ids = JSON.parse(localStorage.getItem('planner') || '[]');

  if (ids.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>No recipes selected.</li>';
    return;
  }

  const recipes = await Promise.all(
    ids.map(id => fetch(`/recipes/${id}.json`).then(r => r.json()))
  );

  renderRecipeTags(recipes, ids);
  const aggregated = aggregateIngredients(recipes);
  renderShoppingList(aggregated);

  const bringBtn = document.getElementById('bring-export');
  bringBtn.disabled = false;
  bringBtn.addEventListener('click', () => {
    window.location.href = buildBringUrl(aggregated);
  });

  document.getElementById('clear-planner').addEventListener('click', () => {
    localStorage.removeItem('planner');
    window.location.reload();
  });
}

function renderRecipeTags(recipes, ids) {
  const list = document.getElementById('recipe-tags');
  list.innerHTML = recipes
    .map((r, i) => `<li>${r.title} <button class="remove-recipe" data-id="${ids[i]}">×</button></li>`)
    .join('');

  list.addEventListener('click', e => {
    const btn = e.target.closest('.remove-recipe');
    if (!btn) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    localStorage.setItem('planner', JSON.stringify(planner.filter(id => id !== btn.dataset.id)));
    window.location.reload();
  });
}

function renderShoppingList(ingredients) {
  document.getElementById('shopping-list').innerHTML = ingredients
    .map(i => `<li>${i.name}: ${i.amount} ${i.unit}</li>`)
    .join('');
}

init();
