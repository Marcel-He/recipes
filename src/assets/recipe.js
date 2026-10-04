import { scaleIngredients } from './lib/scaling.js';
import { groupIngredientsByStep } from './lib/steps.js';
import { formatQuantity } from './lib/format.js';
import { buildBringImportUrl, recipePageUrl } from './lib/bring.js';
import { createCookMode } from './lib/cook-mode.js';

const article = document.querySelector('[data-recipe-id]');
const recipeId = article.dataset.recipeId;
const baseServings = parseInt(article.dataset.baseServings, 10);
let currentServings = baseServings;
let recipeData = null;
let currentStepGroups = {};

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
  renderStepIngredients(scaled);
  currentStepGroups = groupIngredientsByStep(scaled);
}

function renderAll(ingredients) {
  document.getElementById('ingredients-all').innerHTML =
    `<ul>${ingredients
      .map(
        i =>
          `<li><span class="ingredient-name">${i.name}</span><span class="ingredient-qty">${formatQuantity(i)}</span></li>`
      )
      .join('')}</ul>`;
}

function renderStepIngredients(ingredients) {
  const groups = groupIngredientsByStep(ingredients);
  document.querySelectorAll('#steps-section ol > li').forEach((li, index) => {
    li.querySelector(':scope > .step-ingredients')?.remove();
    const ings = groups[index + 1];
    if (!ings || !ings.length) return;
    const header = document.createElement('div');
    header.className = 'step-ingredients';
    header.innerHTML = ings
      .map(i => {
        const qty = formatQuantity(i);
        const qtyEl = qty ? `<span class="step-ingredients__qty">${qty}</span> ` : '';
        return `<span class="step-ingredients__item">${qtyEl}${i.name}</span>`;
      })
      .join('');
    li.prepend(header);
  });
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

// Wake lock — only used by cook mode, to keep the screen on while cooking
let wakeLock = null;

async function requestWakeLock() {
  if (wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
  } catch {
    // Wake lock unsupported or denied; fail silently
  }
}

async function releaseWakeLock() {
  if (!wakeLock) return;
  await wakeLock.release();
  wakeLock = null;
}

// Cook mode
const cookMode = createCookMode({ requestWakeLock, releaseWakeLock });
document.getElementById('start-cook-mode').addEventListener('click', () => cookMode.open(currentStepGroups));

// Add to planner
document.getElementById('add-to-planner').addEventListener('click', () => {
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(recipeId)) {
    planner.push(recipeId);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  const btn = document.getElementById('add-to-planner');
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-label', 'Added to planner');
  btn.querySelector('i').className = 'fa-solid fa-calendar-check';
  btn.disabled = true;
});

// Export to Bring — one recipe, pre-set to the servings currently shown
document.getElementById('bring-export').addEventListener('click', () => {
  window.location.href = buildBringImportUrl(
    recipePageUrl(window.location.origin, recipeId),
    baseServings,
    currentServings
  );
});

loadRecipe();
