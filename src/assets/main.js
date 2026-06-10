import Fuse from '/assets/fuse.min.mjs';

async function init() {
  const res = await fetch('/index.json');
  const recipes = await res.json();

  const fuse = new Fuse(recipes, {
    keys: ['title', 'difficulty'],
    threshold: 0.4
  });

  const searchInput = document.getElementById('search');
  const list = document.getElementById('recipe-list');
  const items = Array.from(list.querySelectorAll('li'));

  searchInput.addEventListener('input', () => {
    const query = searchInput.value.trim();
    if (!query) {
      items.forEach(el => { el.hidden = false; });
      return;
    }
    const matchedIds = new Set(fuse.search(query).map(r => r.item.id));
    items.forEach(el => { el.hidden = !matchedIds.has(el.dataset.id); });
  });

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
}

init();
