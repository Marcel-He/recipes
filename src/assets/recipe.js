import { scaleIngredients } from './lib/scaling.js';
import { groupIngredientsByStep } from './lib/steps.js';

const article = document.querySelector('[data-recipe-id]');
const recipeId = article.dataset.recipeId;
const baseServings = parseInt(article.dataset.baseServings, 10);
let currentServings = baseServings;
let recipeData = null;

async function loadRecipe() {
  try {
    const res = await fetch(`/recipes/${recipeId}/${recipeId}.json`);
    if (!res.ok) return;
    recipeData = await res.json();
    renderIngredients();
  } catch {
    // recipe data unavailable; page remains static
  }
}

function renderIngredients() {
  if (!recipeData) return;
  const scaled = scaleIngredients(recipeData.ingredients, baseServings, currentServings);
  renderAll(scaled);
  renderByStep(scaled);
}

function formatIngredient(i) {
  const qty = i.amount != null && i.amount !== 0 ? `${i.amount}${i.unit ? ' ' + i.unit : ''}` : null;
  return qty ? `${i.name}: ${qty}` : i.name;
}

function renderAll(ingredients) {
  document.getElementById('ingredients-all').innerHTML =
    `<ul>${ingredients.map(i => `<li>${formatIngredient(i)}</li>`).join('')}</ul>`;
}

function renderByStep(ingredients) {
  const groups = groupIngredientsByStep(ingredients);
  document.getElementById('ingredients-by-step').innerHTML =
    Object.entries(groups)
      .map(([step, ings]) =>
        `<div><strong>Step ${step}</strong><ul>${ings.map(i =>
          `<li>${formatIngredient(i)}</li>`
        ).join('')}</ul></div>`
      ).join('');
}

// Servings controls
document.getElementById('servings-down').addEventListener('click', () => {
  if (currentServings <= 1) return;
  currentServings--;
  document.getElementById('servings').value = currentServings;
  renderIngredients();
});

document.getElementById('servings-up').addEventListener('click', () => {
  currentServings++;
  document.getElementById('servings').value = currentServings;
  renderIngredients();
});

// Step toggle
let showByStep = false;
document.getElementById('toggle-view').addEventListener('click', () => {
  showByStep = !showByStep;
  document.getElementById('ingredients-all').hidden = showByStep;
  document.getElementById('ingredients-by-step').hidden = !showByStep;
  document.getElementById('toggle-view').textContent = showByStep ? 'Show all' : 'Show per step';
});

// Wake lock
let wakeLock = null;
document.getElementById('wake-lock-toggle').addEventListener('click', async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    document.getElementById('wake-lock-toggle').textContent = 'Keep screen on';
  } else {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      document.getElementById('wake-lock-toggle').textContent = 'Screen on ✓';
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        document.getElementById('wake-lock-toggle').textContent = 'Keep screen on';
      });
    } catch {
      // Wake lock unsupported or denied; fail silently
    }
  }
});

// Add to planner
document.getElementById('add-to-planner').addEventListener('click', () => {
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(recipeId)) {
    planner.push(recipeId);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  const btn = document.getElementById('add-to-planner');
  btn.textContent = '✓ In planner';
  btn.disabled = true;
});

loadRecipe();
