import { describe, it, expect } from 'vitest';
import { nextStepIndex, prevStepIndex, swipeDirection, parseStep } from '../../src/assets/lib/cook-mode.js';

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

describe('parseStep', () => {
  it('splits a bold title from the step body', () => {
    const html = '<strong>Öl erhitzen & würzen.</strong> Olivenöl in einer großen Pfanne erhitzen.';
    expect(parseStep(html)).toEqual({
      title: 'Öl erhitzen & würzen',
      body: 'Olivenöl in einer großen Pfanne erhitzen.'
    });
  });

  it('strips a leading ingredient-chip div before the title', () => {
    const html = '<div class="step-ingredients"><span class="step-ingredients__item">400 g Tomaten</span></div><strong>Tomaten köcheln lassen.</strong> Tomaten hinzufügen und 10 Minuten köcheln lassen.';
    expect(parseStep(html)).toEqual({
      title: 'Tomaten köcheln lassen',
      body: 'Tomaten hinzufügen und 10 Minuten köcheln lassen.'
    });
  });

  it('falls back to an empty title when there is no bold lead-in', () => {
    const html = 'Sofort servieren, direkt aus der Pfanne.';
    expect(parseStep(html)).toEqual({ title: '', body: 'Sofort servieren, direkt aus der Pfanne.' });
  });

  it('preserves HTML-escaped characters in the title untouched', () => {
    const html = '<strong>Mehl &amp; Butter verkneten.</strong> Mehl und Butter zu einem Teig verkneten.';
    expect(parseStep(html).title).toBe('Mehl &amp; Butter verkneten');
  });
});
