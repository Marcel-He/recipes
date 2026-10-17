import { getWindowDates, loadWeekplan, saveWeekplan } from './lib/weekplan.js';
import { createRecipePreview } from './lib/recipe-preview.js';

const WEEKDAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

const preview = createRecipePreview();

let windowDates = [];
let plan = {};
let indexById = new Map();
let allRecipes = [];

async function init() {
  windowDates = getWindowDates(new Date());
  plan = loadWeekplan(windowDates);

  allRecipes = await fetch('/index.json').then(r => r.json()).catch(() => []);
  indexById = new Map(allRecipes.map(r => [r.id, r]));

  renderGrid();
  initGridTap();
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
  if (!recipeId) {
    thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--empty"><i class="fa-solid fa-plus"></i></span>';
  } else if (!recipe) {
    thumb = '<span class="weekplan-cell__thumb weekplan-cell__thumb--warning"><i class="fa-solid fa-triangle-exclamation"></i></span>';
  } else if (recipe.image) {
    thumb = `<img class="weekplan-cell__thumb" src="${recipe.image}" alt="">`;
  } else {
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

init();
