import { describe, it, expect, beforeEach } from 'vitest';
import { getWindowDates, normalizeWeekplan, loadWeekplan } from '../../src/assets/lib/weekplan.js';

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
