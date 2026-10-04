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
// list — including the per-step ingredient chips the page injects — rather
// than re-deriving it, so it never duplicates the servings-scaling logic.
// Cook mode is the only caller of requestWakeLock/releaseWakeLock (there's
// no separate wake-lock toggle on the page), so it always acquires on open
// and releases on close.
export function createCookMode({ requestWakeLock, releaseWakeLock }) {
  const overlay = document.getElementById('cook-mode');
  const progressEl = document.getElementById('cook-mode-progress');
  const stepEl = document.getElementById('cook-mode-step');
  const prevBtn = document.getElementById('cook-mode-prev');
  const nextBtn = document.getElementById('cook-mode-next');
  const closeBtn = document.getElementById('cook-mode-close');

  let steps = [];
  let currentIndex = 0;
  let touchStartX = null;

  function render() {
    stepEl.innerHTML = steps[currentIndex];
    progressEl.textContent = `Step ${currentIndex + 1} / ${steps.length}`;
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === steps.length - 1;
  }

  function goTo(index) {
    currentIndex = index;
    render();
  }

  async function open() {
    steps = Array.from(document.querySelectorAll('#steps-section ol > li')).map(li => li.innerHTML);
    if (!steps.length) return;
    currentIndex = 0;
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
  nextBtn.addEventListener('click', () => goTo(nextStepIndex(currentIndex, steps.length)));
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
