import { scaleIngredients } from './lib/scaling.js';
import { groupIngredientsByStep } from './lib/steps.js';
import { formatIngredientLine } from './lib/format.js';

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
  renderStepIngredients(scaled);
}

function renderAll(ingredients) {
  document.getElementById('ingredients-all').innerHTML =
    `<ul>${ingredients.map(i => `<li>${formatIngredientLine(i)}</li>`).join('')}</ul>`;
}

function renderStepIngredients(ingredients) {
  const groups = groupIngredientsByStep(ingredients);
  document.querySelectorAll('#steps-section ol > li').forEach((li, index) => {
    li.querySelector(':scope > .step-ingredients')?.remove();
    const ings = groups[index + 1];
    if (!ings || !ings.length) return;
    const header = document.createElement('div');
    header.className = 'step-ingredients';
    header.textContent = ings.map(formatIngredientLine).join(' · ');
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

// Wake lock
let wakeLock = null;
const wakeLockBtn = document.getElementById('wake-lock-toggle');
const wakeLockIcon = wakeLockBtn.querySelector('i');

function setWakeLockState(active) {
  wakeLockBtn.classList.toggle('is-active', active);
  wakeLockBtn.setAttribute('aria-pressed', String(active));
  wakeLockIcon.classList.toggle('fa-regular', !active);
  wakeLockIcon.classList.toggle('fa-solid', active);
}

wakeLockBtn.addEventListener('click', async () => {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
    setWakeLockState(false);
  } else {
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      setWakeLockState(true);
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
        setWakeLockState(false);
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
  btn.classList.add('is-active');
  btn.setAttribute('aria-pressed', 'true');
  btn.setAttribute('aria-label', 'Added to planner');
  btn.querySelector('i').className = 'fa-solid fa-calendar-check';
  btn.disabled = true;
});

loadRecipe();
