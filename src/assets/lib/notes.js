const STORAGE_KEY = 'recipeNotes';

function readAll(store) {
  return JSON.parse(store.getItem(STORAGE_KEY) || '{}');
}

export function getNote(store, id) {
  return readAll(store)[id] ?? null;
}

export function saveNote(store, id, text, now = new Date()) {
  const notes = readAll(store);
  const trimmed = text.trim();
  if (trimmed) {
    notes[id] = { text: trimmed, updatedAt: now.toISOString() };
  } else {
    delete notes[id];
  }
  store.setItem(STORAGE_KEY, JSON.stringify(notes));
  return notes[id] ?? null;
}
