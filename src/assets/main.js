import Fuse from '/assets/fuse.min.mjs';

let fuse = null;

const searchInput = document.getElementById('search');
const list = document.getElementById('recipe-list');
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

list.addEventListener('click', e => {
  const btn = e.target.closest('.add-to-planner');
  if (!btn) return;
  const planner = JSON.parse(localStorage.getItem('planner') || '[]');
  if (!planner.includes(btn.dataset.id)) {
    planner.push(btn.dataset.id);
    localStorage.setItem('planner', JSON.stringify(planner));
  }
  btn.textContent = '✓ Added';
  btn.disabled = true;
});
