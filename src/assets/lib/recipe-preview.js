// Recipe preview overlay — shown between a list of recipes and the detail
// page, on both the recipe list and the planner. Wires up the shared
// #recipe-preview markup (see the pattern library's "Recipe preview" entry).
export function createRecipePreview() {
  const preview = document.getElementById('recipe-preview');
  const previewImage = preview.querySelector('.recipe-preview__image');
  const previewTitle = preview.querySelector('.recipe-preview__title');
  const previewDescription = preview.querySelector('.recipe-preview__description');
  const previewCta = preview.querySelector('.recipe-preview__cta');
  const previewAddBtn = document.getElementById('recipe-preview-add');
  // Optional — only present where the caller can supply a Bring export link
  // (e.g. the planner, which knows servings for already-planned recipes).
  const previewBringBtn = document.getElementById('recipe-preview-bring');
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

  function open({ id, image, imageAlt, title, description, href, bringHref }) {
    previewRecipeId = id;
    previewImage.src = image || '';
    previewImage.alt = imageAlt || '';
    previewTitle.textContent = title;
    previewDescription.textContent = description || '';
    previewCta.href = href;
    if (previewBringBtn) {
      previewBringBtn.hidden = !bringHref;
      if (bringHref) previewBringBtn.href = bringHref;
    }
    setAddButtonState(isPlanned(id));
    preview.hidden = false;
    requestAnimationFrame(() => preview.classList.add('is-open'));
    previewAddBtn.closest('.recipe-preview__panel').querySelector('.recipe-preview__close').focus();
  }

  function close() {
    preview.classList.remove('is-open');
    preview.addEventListener('transitionend', () => { preview.hidden = true; }, { once: true });
  }

  preview.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) close();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !preview.hidden) close();
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

  return { open, close };
}
