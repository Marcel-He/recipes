import { aggregateIngredients } from './lib/aggregator.js';
import { buildBringUrl } from './lib/bring.js';

async function init() {
  const ids = JSON.parse(localStorage.getItem('planner') || '[]');

  // Wire clear button regardless of planner state
  document.getElementById('clear-planner').addEventListener('click', () => {
    localStorage.removeItem('planner');
    window.location.reload();
  });

  if (ids.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>No recipes selected.</li>';
    return;
  }

  const settled = await Promise.allSettled(
    ids.map(id => fetch(`/recipes/${id}/${id}.json`).then(r => r.json()))
  );
  const loaded = settled
    .map((r, i) => r.status === 'fulfilled' ? { recipe: r.value, id: ids[i] } : null)
    .filter(Boolean);

  if (loaded.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>Could not load recipes.</li>';
    return;
  }

  const recipes = loaded.map(x => x.recipe);
  const loadedIds = loaded.map(x => x.id);
  renderRecipeTags(recipes, loadedIds);
  const aggregated = aggregateIngredients(recipes);
  renderShoppingList(aggregated);

  const bringBtn = document.getElementById('bring-export');
  bringBtn.disabled = false;
  bringBtn.addEventListener('click', () => {
    window.location.href = buildBringUrl(aggregated);
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
