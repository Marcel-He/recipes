import Fuse from '/assets/fuse.min.mjs';
import { getWindowDates, loadWeekplan, saveWeekplan, swapPlanDays, cellThumbState } from './lib/weekplan.js';
import { suggestRecipes } from './lib/suggestions.js';
import { createRecipePreview } from './lib/recipe-preview.js';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const preview = createRecipePreview();

let windowDates = [];
let plan = {};
let indexById = new Map();
let allRecipes = [];
let indexLoadFailed = false;
let currentSelectDate = null;
let daySelectFuse = null;
let daySelectItems = [];

async function init() {
  windowDates = getWindowDates(new Date());
  plan = loadWeekplan(windowDates);

  allRecipes = await fetch('/index.json').then(r => r.json()).catch(() => {
    indexLoadFailed = true;
    return [];
  });
  indexById = new Map(allRecipes.map(r => [r.id, r]));
  daySelectFuse = new Fuse(allRecipes, { keys: ['title', 'difficulty', 'aufwand'], threshold: 0.4 });
  daySelectItems = Array.from(document.querySelectorAll('#day-select-list > li'));

  renderGrid();
  initGridTap();
  initDaySelect();
  initDragAndDrop();
}

function cellLabel(date) {
  const d = new Date(`${date}T00:00:00`);
  return { weekday: WEEKDAYS[d.getDay()], day: d.getDate() };
}

function renderGrid() {
  document.getElementById('weekplan-grid').innerHTML = windowDates.map(renderCell).join('');
}

function renderCell(date) {
  const { weekday, day } = cellLabel(date);
  const recipeId = plan[date];
  const recipe = recipeId ? indexById.get(recipeId) : null;

  let thumb;
  switch (cellThumbState(recipeId, recipe, indexLoadFailed)) {
    case 'empty':
      thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-plus"></i></span>';
      break;
    case 'unknown':
      thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-question"></i></span>';
      break;
    case 'missing':
      thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--warning"><i class="fa-solid fa-triangle-exclamation"></i></span>';
      break;
    case 'image':
      thumb = `<img class="weekplan-cell__thumb" src="${recipe.image}" alt="">`;
      break;
    default: // placeholder
      thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-utensils"></i></span>';
  }

  return `
    <button type="button" class="weekplan-cell" data-date="${date}" ${recipeId ? 'draggable="true"' : ''}>
      <span class="weekplan-cell__weekday">${weekday}</span>
      <span class="weekplan-cell__day">${day}</span>
      ${thumb}
    </button>`;
}

function clearDay(date) {
  plan[date] = null;
  saveWeekplan(plan);
  renderGrid();
  preview.close();
}

function initGridTap() {
  document.getElementById('weekplan-grid').addEventListener('click', e => {
    const cell = e.target.closest('.weekplan-cell');
    if (!cell) return;
    const date = cell.dataset.date;
    const recipeId = plan[date];

    if (!recipeId) {
      openDaySelect(date);
      return;
    }

    // The index hasn't loaded (e.g. offline) — we can't tell a deleted
    // recipe from a transient fetch failure, so don't act on this cell at
    // all rather than risk routing to the "no longer available" drawer and
    // having the user overwrite a perfectly valid assignment.
    if (indexLoadFailed) return;

    const recipe = indexById.get(recipeId);
    if (!recipe) {
      openDaySelect(date, { missing: true });
      return;
    }

    preview.open({
      id: recipeId,
      image: recipe.image || '',
      imageAlt: '',
      title: recipe.title,
      description: recipe.description || '',
      href: `/recipes/${recipeId}/`,
      action: {
        label: 'Tag leeren',
        icon: 'fa-calendar-xmark',
        onClick: () => clearDay(date)
      }
    });
  });
}

function plannedRecipes() {
  return windowDates
    .map(d => plan[d])
    .filter(Boolean)
    .map(id => indexById.get(id))
    .filter(Boolean);
}

function renderDaySelectSuggestions() {
  const section = document.getElementById('day-select-suggestions');
  const suggestions = suggestRecipes(plannedRecipes(), allRecipes);
  if (suggestions.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  document.getElementById('day-select-suggestion-list').innerHTML = suggestions
    .map(({ recipe, shared }) => {
      const photo = recipe.image
        ? `<img class="suggestion-list__image" src="${recipe.image}" alt="">`
        : `<div class="suggestion-list__image suggestion-list__image--placeholder"><i class="fa-solid fa-utensils"></i></div>`;
      return `
        <li class="suggestion-list__item" data-id="${recipe.id}">
          ${photo}
          <span class="suggestion-list__text">
            <span class="suggestion-list__name">${recipe.title}</span>
            <span class="suggestion-list__shared">Auch mit: ${shared.join(', ')}</span>
          </span>
        </li>`;
    })
    .join('');
}

function openDaySelect(date, { missing = false } = {}) {
  currentSelectDate = date;
  const { weekday, day } = cellLabel(date);
  document.getElementById('day-select-title').textContent = `${weekday}, ${day}.`;
  document.getElementById('day-select-missing-hint').hidden = !missing;

  renderDaySelectSuggestions();
  document.getElementById('day-select-search').value = '';
  daySelectItems.forEach(el => { el.hidden = false; });

  const panel = document.getElementById('day-select');
  panel.hidden = false;
  requestAnimationFrame(() => panel.classList.add('is-open'));
}

function closeDaySelect() {
  const panel = document.getElementById('day-select');
  panel.classList.remove('is-open');
  panel.addEventListener('transitionend', () => { panel.hidden = true; }, { once: true });
}

function assignDay(date, recipeId) {
  plan[date] = recipeId;
  saveWeekplan(plan);
  renderGrid();
  closeDaySelect();
}

function initDaySelect() {
  const panel = document.getElementById('day-select');

  panel.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) {
      closeDaySelect();
      return;
    }
    const suggestion = e.target.closest('.suggestion-list__item');
    if (suggestion) {
      assignDay(currentSelectDate, suggestion.dataset.id);
      return;
    }
    const link = e.target.closest('#day-select-list a[data-id]');
    if (link) {
      e.preventDefault();
      assignDay(currentSelectDate, link.dataset.id);
    }
  });

  document.getElementById('day-select-search').addEventListener('input', e => {
    const query = e.target.value.trim();
    if (!query) {
      daySelectItems.forEach(el => { el.hidden = false; });
      return;
    }
    const matchedIds = new Set(daySelectFuse.search(query).map(r => r.item.id));
    daySelectItems.forEach(el => { el.hidden = !matchedIds.has(el.dataset.id); });
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !panel.hidden) closeDaySelect();
  });
}

function initDragAndDrop() {
  const grid = document.getElementById('weekplan-grid');

  grid.addEventListener('dragstart', e => {
    const cell = e.target.closest('.weekplan-cell[draggable="true"]');
    if (!cell) return;
    e.dataTransfer.setData('text/plain', cell.dataset.date);
  });

  grid.addEventListener('dragover', e => {
    if (e.target.closest('.weekplan-cell')) e.preventDefault(); // allow drop
  });

  grid.addEventListener('drop', e => {
    const target = e.target.closest('.weekplan-cell');
    if (!target) return;
    e.preventDefault();
    const fromDate = e.dataTransfer.getData('text/plain');
    const toDate = target.dataset.date;
    const next = swapPlanDays(plan, fromDate, toDate);
    if (next === plan) return; // no-op: same day, or fromDate wasn't one of ours (e.g. foreign drag data)
    plan = next;
    saveWeekplan(plan);
    renderGrid();
  });
}

init();
