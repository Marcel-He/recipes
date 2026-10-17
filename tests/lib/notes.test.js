import { describe, it, expect, beforeEach } from 'vitest';
import { getNote, saveNote } from '../../src/assets/lib/notes.js';

function createStore() {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value)
  };
}

describe('notes', () => {
  let store;

  beforeEach(() => {
    store = createStore();
  });

  it('returns null when no note exists for a recipe', () => {
    expect(getNote(store, 'shakshuka')).toBeNull();
  });

  it('saves a note and makes it retrievable with a timestamp', () => {
    const now = new Date('2026-10-05T12:00:00Z');
    saveNote(store, 'shakshuka', 'mehr Salz', now);
    expect(getNote(store, 'shakshuka')).toEqual({
      text: 'mehr Salz',
      updatedAt: now.toISOString()
    });
  });

  it('overwrites an existing note for the same recipe', () => {
    saveNote(store, 'shakshuka', 'mehr Salz', new Date('2026-10-01T00:00:00Z'));
    saveNote(store, 'shakshuka', 'Garzeit -5min', new Date('2026-10-05T00:00:00Z'));
    expect(getNote(store, 'shakshuka').text).toBe('Garzeit -5min');
  });

  it('keeps notes for different recipes independent', () => {
    saveNote(store, 'shakshuka', 'mehr Salz', new Date());
    saveNote(store, 'piccata', 'weniger Zitrone', new Date());
    expect(getNote(store, 'shakshuka').text).toBe('mehr Salz');
    expect(getNote(store, 'piccata').text).toBe('weniger Zitrone');
  });

  it('removes the note when saved with empty text', () => {
    saveNote(store, 'shakshuka', 'mehr Salz', new Date());
    saveNote(store, 'shakshuka', '   ', new Date());
    expect(getNote(store, 'shakshuka')).toBeNull();
  });

  it('trims whitespace from the saved text', () => {
    saveNote(store, 'shakshuka', '  mehr Salz  ', new Date());
    expect(getNote(store, 'shakshuka').text).toBe('mehr Salz');
  });
});
