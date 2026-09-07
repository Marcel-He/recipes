import Fuse from '/assets/fuse.min.mjs';

let fuse = null;

const searchInput = document.getElementById('search');
const list = document.querySelector('.recipe-list');
const items = Array.from(list.querySelectorAll('li'));

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  if (!query) {
    items.forEach(el => { el.hidden = false; });
    return;
  }
  if (!fuse) return;
  const matchedIds = new Set(fuse.search(query).map(r => r.item.id));
  items.forEach(el => { el.hidden = !matchedIds.has(el.dataset.id); });
});

fetch('/index.json')
  .then(res => res.json())
  .then(recipes => {
    fuse = new Fuse(recipes, {
      keys: ['title', 'difficulty', 'aufwand'],
      threshold: 0.4
    });
  })
  .catch(err => console.error('Search failed to load:', err));

// Recipe preview overlay — shown between the list and the detail page.
const preview = document.getElementById('recipe-preview');
const previewImage = preview.querySelector('.recipe-preview__image');
const previewTitle = preview.querySelector('.recipe-preview__title');
const previewDescription = preview.querySelector('.recipe-preview__description');
const previewCta = preview.querySelector('.recipe-preview__cta');
const previewAddBtn = document.getElementById('recipe-preview-add');
let previewRecipeId = null;

function isPlanned(id) {
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  return planner.includes(id);
}

function setAddButtonState(added) {
  previewAddBtn.classList.toggle('is-active', added);
  previewAddBtn.setAttribute('aria-pressed', String(added));
  previewAddBtn.setAttribute('aria-label', added ? 'Added to planner' : 'Add to planner');
  previewAddBtn.querySelector('i').className = added ? 'fa-solid fa-calendar-check' : 'fa-solid fa-calendar-plus';
  previewAddBtn.disabled = added;
}

function openPreview(li, href) {
  const img = li.querySelector('img');
  previewRecipeId = li.dataset.id;
  previewImage.src = img ? img.src : '';
  previewImage.alt = img ? img.alt : '';
  previewTitle.textContent = li.querySelector('.headline').textContent;
  previewDescription.textContent = li.dataset.description || '';
  previewCta.href = href;
  setAddButtonState(isPlanned(previewRecipeId));
  preview.hidden = false;
  requestAnimationFrame(() => preview.classList.add('is-open'));
  previewAddBtn.closest('.recipe-preview__panel').querySelector('.recipe-preview__close').focus();
}

function closePreview() {
  preview.classList.remove('is-open');
  preview.addEventListener('transitionend', () => { preview.hidden = true; }, { once: true });
}

list.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const li = link.closest('li');
  if (!li) return;
  e.preventDefault();
  openPreview(li, link.href);
});

preview.addEventListener('click', e => {
  if (e.target.closest('[data-close]')) closePreview();
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !preview.hidden) closePreview();
});

previewAddBtn.addEventListener('click', () => {
  if (!previewRecipeId) return;
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(previewRecipeId)) {
    planner.push(previewRecipeId);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  setAddButtonState(true);
});
