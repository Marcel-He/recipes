import { buildBringImportUrl, recipePageUrl } from './lib/bring.js';
import { suggestRecipes } from './lib/suggestions.js';
import { createRecipePreview } from './lib/recipe-preview.js';

const preview = createRecipePreview();

// Long-press-to-reveal for the plan row's remove ("×") button — it stays
// hidden until held, so a plain tap on a plan item opens the preview.
const LONG_PRESS_MS = 500;
const LONG_PRESS_MOVE_TOLERANCE = 10;
let longPressTimer = null;
let longPressTriggered = false;
let longPressStart = null;

function initLongPressRemove(list) {
  list.addEventListener('pointerdown', e => {
    const item = e.target.closest('.recipe-row__item');
    if (!item || e.target.closest('.recipe-row__remove')) return;
    longPressTriggered = false;
    longPressStart = { x: e.clientX, y: e.clientY };
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      longPressTriggered = true;
      list.classList.add('recipe-row--removable');
    }, LONG_PRESS_MS);
  });

  // Cancel if the press turns into a horizontal-scroll drag.
  list.addEventListener('pointermove', e => {
    if (!longPressStart) return;
    const moved = Math.abs(e.clientX - longPressStart.x) > LONG_PRESS_MOVE_TOLERANCE
      || Math.abs(e.clientY - longPressStart.y) > LONG_PRESS_MOVE_TOLERANCE;
    if (moved) clearTimeout(longPressTimer);
  });

  ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
    list.addEventListener(type, () => clearTimeout(longPressTimer));
  });

  // Tapping outside the row hides the revealed remove buttons again.
  document.addEventListener('click', e => {
    if (list.contains(e.target)) return;
    list.classList.remove('recipe-row--removable');
  });
}

// The click that follows a long press just revealed the remove button — it
// shouldn't also open the preview.
function longPressRemoveConsumeClick(e) {
  if (!longPressTriggered) return false;
  longPressTriggered = false;
  e.preventDefault();
  return true;
}

async function init() {
  const ids = JSON.parse(localStorage.getItem('planner') || '[]');

  initMenu();

  // Wire clear button regardless of planner state
  document.getElementById('clear-planner').addEventListener('click', () => {
    localStorage.removeItem('planner');
    window.location.reload();
  });

  if (ids.length === 0) {
    document.getElementById('recipe-tags').innerHTML = '<li>No recipes selected.</li>';
    return;
  }

  const [settled, index] = await Promise.all([
    Promise.allSettled(
      ids.map(id => fetch(`/recipes/${id}/${id}.json`).then(r => r.json()))
    ),
    fetch('/index.json').then(r => r.json()).catch(() => [])
  ]);
  const indexById = new Map(index.map(r => [r.id, r]));
  const loaded = settled
    .map((r, i) => r.status === 'fulfilled' ? { recipe: r.value, id: ids[i] } : null)
    .filter(Boolean);

  if (loaded.length === 0) {
    document.getElementById('recipe-tags').innerHTML = '<li>Could not load recipes.</li>';
    return;
  }

  const recipes = loaded.map(x => x.recipe);
  const loadedIds = loaded.map(x => x.id);
  renderRecipeTags(recipes, loadedIds, indexById);
  renderSuggestions(index.filter(r => loadedIds.includes(r.id)), index);
}

function renderRecipeTags(recipes, ids, indexById) {
  const list = document.getElementById('recipe-tags');
  list.innerHTML = recipes
    .map((r, i) => {
      const image = indexById.get(ids[i])?.image;
      const description = indexById.get(ids[i])?.description || '';
      const photo = image
        ? `<img class="recipe-row__image" src="${image}" alt="">`
        : `<div class="recipe-row__image recipe-row__image--placeholder"><i class="fa-solid fa-utensils"></i></div>`;
      return `
        <li class="recipe-row__item">
          <a class="recipe-row__link" href="/recipes/${ids[i]}/" data-id="${ids[i]}" data-description="${description}" data-servings="${r.servings || ''}">
            ${photo}
            <span class="recipe-row__name">${r.title}</span>
          </a>
          <button type="button" class="recipe-row__remove" data-id="${ids[i]}" aria-label="Remove ${r.title}">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </li>`;
    })
    .join('');

  initLongPressRemove(list);

  list.addEventListener('click', e => {
    if (longPressRemoveConsumeClick(e)) return;

    const removeBtn = e.target.closest('.recipe-row__remove');
    if (removeBtn) {
      const planner = JSON.parse(localStorage.getItem('planner') || '[]');
      localStorage.setItem('planner', JSON.stringify(planner.filter(id => id !== removeBtn.dataset.id)));
      window.location.reload();
      return;
    }

    const link = e.target.closest('.recipe-row__link');
    if (!link) return;
    e.preventDefault();
    const img = link.querySelector('img');
    // Bring imports one recipe at a time and asks for the servings in its
    // own import dialog, so each planned recipe gets its own export link.
    const bringHref = buildBringImportUrl(recipePageUrl(window.location.origin, link.dataset.id), link.dataset.servings);
    preview.open({
      id: link.dataset.id,
      image: img ? img.src : '',
      imageAlt: img ? img.alt : '',
      title: link.querySelector('.recipe-row__name').textContent,
      description: link.dataset.description,
      href: link.href,
      bringHref
    });
  });
}

function renderSuggestions(planned, all) {
  const suggestions = suggestRecipes(planned, all);
  if (suggestions.length === 0) return;

  const list = document.getElementById('suggestion-list');
  list.innerHTML = suggestions
    .map(({ recipe, shared }) => {
      const photo = recipe.image
        ? `<img class="suggestion-list__image" src="${recipe.image}" alt="">`
        : `<div class="suggestion-list__image suggestion-list__image--placeholder"><i class="fa-solid fa-utensils"></i></div>`;
      return `
        <li class="suggestion-list__item">
          ${photo}
          <a class="suggestion-list__text" href="/recipes/${recipe.id}/" data-id="${recipe.id}" data-description="${recipe.description || ''}">
            <span class="suggestion-list__name">${recipe.title}</span>
            <span class="suggestion-list__shared">Auch mit: ${shared.join(', ')}</span>
          </a>
          <button type="button" class="icon-button icon-button--brand" data-id="${recipe.id}" aria-label="Add ${recipe.title} to planner">
            <i class="fa-solid fa-calendar-plus"></i>
          </button>
        </li>`;
    })
    .join('');
  document.getElementById('suggestions').hidden = false;

  list.addEventListener('click', e => {
    const btn = e.target.closest('button[data-id]');
    if (btn) {
      const planner = JSON.parse(localStorage.getItem('planner') || '[]');
      if (!planner.includes(btn.dataset.id)) planner.push(btn.dataset.id);
      localStorage.setItem('planner', JSON.stringify(planner));
      window.location.reload();
      return;
    }

    const link = e.target.closest('.suggestion-list__text');
    if (!link) return;
    e.preventDefault();
    const img = link.closest('li').querySelector('.suggestion-list__image');
    preview.open({
      id: link.dataset.id,
      image: img?.tagName === 'IMG' ? img.src : '',
      imageAlt: img?.tagName === 'IMG' ? img.alt : '',
      title: link.querySelector('.suggestion-list__name').textContent,
      description: link.dataset.description,
      href: link.href
    });
  });
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
