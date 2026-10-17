// Own localStorage key for the week-plan calendar — deliberately decoupled from the
// existing `planner` array (see the requirements/design docs for why).
const STORAGE_KEY = 'weekplan';

// `days` consecutive YYYY-MM-DD strings starting at `today` (a Date). Uses local
// calendar fields (not UTC) so the window matches the user's wall-clock date.
export function getWindowDates(today, days = 14) {
  const fmt = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return fmt(d);
  });
}

// Rebuilds the plan against the current window: days outside `windowDates` are dropped,
// days inside it that aren't in `stored` are added as null. Result key order follows
// `windowDates` (chronological).
export function normalizeWeekplan(stored, windowDates) {
  const safe = stored && typeof stored === 'object' ? stored : {};
  const result = {};
  for (const date of windowDates) {
    result[date] = Object.prototype.hasOwnProperty.call(safe, date) ? safe[date] : null;
  }
  return result;
}

// The only functions that touch localStorage. Corrupt/missing data falls back to an
// empty, normalized plan rather than throwing.
export function loadWeekplan(windowDates) {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    stored = {};
  }
  return normalizeWeekplan(stored, windowDates);
}

export function saveWeekplan(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}
