import { describe, it, expect } from 'vitest';
import { nextStepIndex, prevStepIndex, swipeDirection } from '../../src/assets/lib/cook-mode.js';

describe('nextStepIndex', () => {
  it('advances to the following step', () => {
    expect(nextStepIndex(0, 6)).toBe(1);
  });

  it('stops at the last step', () => {
    expect(nextStepIndex(5, 6)).toBe(5);
  });
});

describe('prevStepIndex', () => {
  it('goes back to the previous step', () => {
    expect(prevStepIndex(3)).toBe(2);
  });

  it('stops at the first step', () => {
    expect(prevStepIndex(0)).toBe(0);
  });
});

describe('swipeDirection', () => {
  it('reports "next" for a leftward swipe past the threshold', () => {
    expect(swipeDirection(-50)).toBe('next');
  });

  it('reports "prev" for a rightward swipe past the threshold', () => {
    expect(swipeDirection(50)).toBe('prev');
  });

  it('reports no direction for a swipe under the threshold', () => {
    expect(swipeDirection(10)).toBe(null);
  });

  it('respects a custom threshold', () => {
    expect(swipeDirection(-15, 10)).toBe('next');
  });
});
