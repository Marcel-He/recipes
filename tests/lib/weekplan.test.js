import { describe, it, expect, beforeEach } from 'vitest';
import { getWindowDates, normalizeWeekplan, loadWeekplan, swapPlanDays, cellThumbState } from '../../src/assets/lib/weekplan.js';

describe('getWindowDates', () => {
  it('returns 14 consecutive dates starting today', () => {
    const dates = getWindowDates(new Date(2026, 9, 17)); // Oct 17, 2026
    expect(dates).toHaveLength(14);
    expect(dates[0]).toBe('2026-10-17');
    expect(dates[13]).toBe('2026-10-30');
  });

  it('rolls over a month/year boundary correctly', () => {
    const dates = getWindowDates(new Date(2026, 11, 28)); // Dec 28, 2026
    expect(dates[0]).toBe('2026-12-28');
    expect(dates[3]).toBe('2026-12-31');
    expect(dates[4]).toBe('2027-01-01');
    expect(dates[13]).toBe('2027-01-10');
  });

  it('supports a custom window length', () => {
    expect(getWindowDates(new Date(2026, 9, 17), 3)).toEqual(['2026-10-17', '2026-10-18', '2026-10-19']);
  });
});

describe('normalizeWeekplan', () => {
  const windowDates = ['2026-10-17', '2026-10-18', '2026-10-19'];

  it('drops stored days outside the window and adds missing window days as null', () => {
    const stored = { '2026-10-16': 'old-recipe', '2026-10-18': 'carbonara' };
    expect(normalizeWeekplan(stored, windowDates)).toEqual({
      '2026-10-17': null,
      '2026-10-18': 'carbonara',
      '2026-10-19': null
    });
  });

  it('preserves windowDates order in the result', () => {
    expect(Object.keys(normalizeWeekplan({}, windowDates))).toEqual(windowDates);
  });

  it('falls back to an all-empty plan when stored is not an object', () => {
    expect(normalizeWeekplan(null, windowDates)).toEqual({
      '2026-10-17': null,
      '2026-10-18': null,
      '2026-10-19': null
    });
  });
});

describe('loadWeekplan', () => {
  const windowDates = ['2026-10-17', '2026-10-18'];

  beforeEach(() => {
    globalThis.localStorage = {
      store: {},
      getItem(key) { return this.store[key] ?? null; },
      setItem(key, value) { this.store[key] = value; }
    };
  });

  it('reads and normalizes a valid stored plan', () => {
    localStorage.setItem('weekplan', JSON.stringify({ '2026-10-17': 'carbonara' }));
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': 'carbonara', '2026-10-18': null });
  });

  it('falls back to an empty normalized plan on corrupt JSON instead of throwing', () => {
    localStorage.setItem('weekplan', '{not valid json');
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': null, '2026-10-18': null });
  });

  it('falls back to an empty normalized plan when nothing is stored yet', () => {
    expect(loadWeekplan(windowDates)).toEqual({ '2026-10-17': null, '2026-10-18': null });
  });
});

describe('swapPlanDays', () => {
  const plan = { '2026-10-17': 'carbonara', '2026-10-18': 'tortilla', '2026-10-19': null };

  it('swaps the recipe ids of two days in the plan', () => {
    expect(swapPlanDays(plan, '2026-10-17', '2026-10-18')).toEqual({
      '2026-10-17': 'tortilla',
      '2026-10-18': 'carbonara',
      '2026-10-19': null
    });
  });

  it('moves a recipe onto an empty day, leaving the source empty', () => {
    expect(swapPlanDays(plan, '2026-10-17', '2026-10-19')).toEqual({
      '2026-10-17': null,
      '2026-10-18': 'tortilla',
      '2026-10-19': 'carbonara'
    });
  });

  it('ignores a fromDate that is not a day in the plan (e.g. foreign drag data) and returns the same plan unchanged', () => {
    const result = swapPlanDays(plan, 'https://example.com/image.png', '2026-10-18');
    expect(result).toBe(plan);
  });

  it('ignores a toDate that is not a day in the plan', () => {
    const result = swapPlanDays(plan, '2026-10-17', '2026-10-25');
    expect(result).toBe(plan);
  });

  it('is a no-op when fromDate equals toDate', () => {
    const result = swapPlanDays(plan, '2026-10-17', '2026-10-17');
    expect(result).toBe(plan);
  });

  it('does not mutate the input plan', () => {
    const original = { ...plan };
    swapPlanDays(plan, '2026-10-17', '2026-10-18');
    expect(plan).toEqual(original);
  });
});

describe('cellThumbState', () => {
  const recipe = { id: 'carbonara', title: 'Carbonara', image: '/img/carbonara.jpg' };
  const recipeNoImage = { id: 'tortilla', title: 'Tortilla' };

  it('returns "empty" when no recipe is assigned', () => {
    expect(cellThumbState(null, null, false)).toBe('empty');
  });

  it('returns "empty" for an unassigned day even if the index failed to load', () => {
    expect(cellThumbState(null, null, true)).toBe('empty');
  });

  it('returns "unknown" when a recipe is assigned but the index failed to load', () => {
    expect(cellThumbState('carbonara', undefined, true)).toBe('unknown');
  });

  it('returns "missing" when a recipe is assigned, the index loaded, but the id no longer resolves', () => {
    expect(cellThumbState('deleted-recipe', undefined, false)).toBe('missing');
  });

  it('returns "image" when the assigned recipe resolves and has an image', () => {
    expect(cellThumbState('carbonara', recipe, false)).toBe('image');
  });

  it('returns "placeholder" when the assigned recipe resolves but has no image', () => {
    expect(cellThumbState('tortilla', recipeNoImage, false)).toBe('placeholder');
  });
});
