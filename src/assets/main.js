import Fuse from '/assets/fuse.min.mjs';
import { createRecipePreview } from './lib/recipe-preview.js';

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
const preview = createRecipePreview();

list.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (!link) return;
  const li = link.closest('li');
  if (!li) return;
  e.preventDefault();
  const img = li.querySelector('img');
  preview.open({
    id: li.dataset.id,
    image: img ? img.src : '',
    imageAlt: img ? img.alt : '',
    title: li.querySelector('.headline').textContent,
    description: li.dataset.description || '',
    href: link.href
  });
});
