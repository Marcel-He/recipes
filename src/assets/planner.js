import { aggregateIngredients } from './lib/aggregator.js';
import { buildBringImportUrl } from './lib/bring.js';
import { formatQuantity } from './lib/format.js';

async function init() {
  const ids = JSON.parse(localStorage.getItem('planner') || '[]');

  initMenu();

  // Wire clear button regardless of planner state
  document.getElementById('clear-planner').addEventListener('click', () => {
    localStorage.removeItem('planner');
    window.location.reload();
  });

  if (ids.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>No recipes selected.</li>';
    return;
  }

  const [settled, index] = await Promise.all([
    Promise.allSettled(
      ids.map(id => fetch(`/recipes/${id}/${id}.json`).then(r => r.json()))
    ),
    fetch('/index.json').then(r => r.json()).catch(() => [])
  ]);
  const images = new Map(index.map(r => [r.id, r.image]));
  const loaded = settled
    .map((r, i) => r.status === 'fulfilled' ? { recipe: r.value, id: ids[i] } : null)
    .filter(Boolean);

  if (loaded.length === 0) {
    document.getElementById('shopping-list').innerHTML = '<li>Could not load recipes.</li>';
    return;
  }

  const recipes = loaded.map(x => x.recipe);
  const loadedIds = loaded.map(x => x.id);
  renderRecipeTags(recipes, loadedIds, images);
  const aggregated = aggregateIngredients(recipes);
  renderShoppingList(aggregated);

  const bringBtn = document.getElementById('bring-export');
  bringBtn.disabled = false;
  bringBtn.addEventListener('click', () => {
    window.location.href = buildBringImportUrl(window.location.origin, aggregated);
  });
}

function renderRecipeTags(recipes, ids, images) {
  const list = document.getElementById('recipe-tags');
  list.innerHTML = recipes
    .map((r, i) => {
      const image = images.get(ids[i]);
      const photo = image
        ? `<img class="recipe-row__image" src="${image}" alt="">`
        : `<div class="recipe-row__image recipe-row__image--placeholder"><i class="fa-solid fa-utensils"></i></div>`;
      return `
        <li class="recipe-row__item">
          ${photo}
          <button type="button" class="recipe-row__remove" data-id="${ids[i]}" aria-label="Remove ${r.title}">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <span class="recipe-row__name">${r.title}</span>
        </li>`;
    })
    .join('');

  list.addEventListener('click', e => {
    const btn = e.target.closest('.recipe-row__remove');
    if (!btn) return;
    const planner = JSON.parse(localStorage.getItem('planner') || '[]');
    localStorage.setItem('planner', JSON.stringify(planner.filter(id => id !== btn.dataset.id)));
    window.location.reload();
  });
}

function renderShoppingList(ingredients) {
  document.getElementById('shopping-list').innerHTML = ingredients
    .map(i => {
      const qty = formatQuantity(i);
      const qtyMarkup = qty ? `<span class="item-qty">(${qty})</span>` : '';
      return `<li><span class="item-name">${i.name}</span> ${qtyMarkup}</li>`;
    })
    .join('');
}

function initMenu() {
  const toggle = document.getElementById('planner-menu-toggle');
  const menu = document.getElementById('planner-menu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const opening = menu.hidden;
    menu.hidden = !opening;
    toggle.setAttribute('aria-expanded', String(opening));
  });

  document.addEventListener('click', e => {
    if (menu.hidden || menu.contains(e.target) || toggle.contains(e.target)) return;
    menu.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) {
      menu.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
}

init();
