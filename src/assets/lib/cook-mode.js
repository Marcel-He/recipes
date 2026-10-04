import { formatIngredientParenthetical } from './format.js';

export function nextStepIndex(current, total) {
  return Math.min(current + 1, total - 1);
}

export function prevStepIndex(current) {
  return Math.max(current - 1, 0);
}

export function swipeDirection(deltaX, threshold = 40) {
  if (deltaX <= -threshold) return 'next';
  if (deltaX >= threshold) return 'prev';
  return null;
}

export function parseStep(html) {
  const match = html.match(/^\s*(?:<div class="step-ingredients">.*?<\/div>)?\s*<strong>(.*?)\.?<\/strong>\s*(.*)$/s);
  if (!match) return { title: '', body: html.trim() };
  return { title: match[1], body: match[2].trim() };
}

// Full-screen step-by-step overlay for the recipe detail page (see the
// pattern library's "Cook mode" entry). Reads the already-rendered step
// list's text (title/body, via parseStep) from the live DOM, but takes
// per-step ingredient groups as structured data from recipe.js rather than
// scraping the ingredient-chip markup the page renders for its own list —
// cook mode's ingredient display looks different (plain list, not chips).
// Cook mode is the only caller of requestWakeLock/releaseWakeLock (there's
// no separate wake-lock toggle on the page), so it always acquires on open
// and releases on close.
export function createCookMode({ requestWakeLock, releaseWakeLock }) {
  const overlay = document.getElementById('cook-mode');
  const titleEl = document.getElementById('cook-mode-title');
  const dotsEl = document.getElementById('cook-mode-dots');
  const progressTextEl = document.getElementById('cook-mode-progress-text');
  const stepEl = document.getElementById('cook-mode-step');
  const ingredientsEl = document.getElementById('cook-mode-ingredients');
  const ingredientsListEl = document.getElementById('cook-mode-ingredients-list');
  const stepTitleEl = document.getElementById('cook-mode-step-title');
  const stepBodyEl = document.getElementById('cook-mode-step-body');
  const prevBtn = document.getElementById('cook-mode-prev');
  const nextBtn = document.getElementById('cook-mode-next');
  const nextLabelEl = document.getElementById('cook-mode-next-label');
  const closeBtn = document.getElementById('cook-mode-close');

  let steps = [];
  let stepGroups = {};
  let currentIndex = 0;
  let touchStartX = null;

  function render() {
    const { title, body } = parseStep(steps[currentIndex]);
    stepTitleEl.innerHTML = title;
    stepBodyEl.innerHTML = body;

    const ingredients = stepGroups[currentIndex + 1];
    if (ingredients && ingredients.length) {
      ingredientsEl.hidden = false;
      ingredientsListEl.innerHTML = ingredients
        .map(i => `<div class="cook-mode__ingredient">${formatIngredientParenthetical(i)}</div>`)
        .join('');
    } else {
      ingredientsEl.hidden = true;
      ingredientsListEl.innerHTML = '';
    }

    dotsEl.querySelectorAll('.cook-mode__dot').forEach((dot, i) => {
      dot.classList.toggle('is-current', i === currentIndex);
    });
    progressTextEl.textContent = `Step ${currentIndex + 1} of ${steps.length}`;

    prevBtn.disabled = currentIndex === 0;
    nextLabelEl.textContent = currentIndex === steps.length - 1 ? 'Done' : 'Next Step';
  }

  function goTo(index) {
    currentIndex = index;
    render();
  }

  async function open(groups) {
    steps = Array.from(document.querySelectorAll('#steps-section ol > li')).map(li => li.innerHTML);
    if (!steps.length) return;
    stepGroups = groups;
    currentIndex = 0;
    titleEl.textContent = document.querySelector('[data-recipe-id] h1').textContent;
    dotsEl.innerHTML = steps.map(() => '<span class="cook-mode__dot"></span>').join('');
    render();
    overlay.hidden = false;
    requestAnimationFrame(() => overlay.classList.add('is-open'));
    await requestWakeLock();
    closeBtn.focus();
  }

  async function close() {
    overlay.classList.remove('is-open');
    overlay.addEventListener('transitionend', () => { overlay.hidden = true; }, { once: true });
    await releaseWakeLock();
  }

  prevBtn.addEventListener('click', () => goTo(prevStepIndex(currentIndex)));
  nextBtn.addEventListener('click', () => {
    if (currentIndex === steps.length - 1) {
      close();
      return;
    }
    goTo(nextStepIndex(currentIndex, steps.length));
  });
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', e => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') goTo(nextStepIndex(currentIndex, steps.length));
    if (e.key === 'ArrowLeft') goTo(prevStepIndex(currentIndex));
  });

  stepEl.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });

  stepEl.addEventListener('touchend', e => {
    if (touchStartX == null) return;
    const direction = swipeDirection(e.changedTouches[0].clientX - touchStartX);
    if (direction === 'next') goTo(nextStepIndex(currentIndex, steps.length));
    if (direction === 'prev') goTo(prevStepIndex(currentIndex));
    touchStartX = null;
  });

  return { open, close };
}
