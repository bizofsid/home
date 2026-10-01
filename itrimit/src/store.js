// Persistence and change notification. The only module that touches storage.

const STORAGE_KEY = 'itrimit:v1';

export const EMPTY_STATE = Object.freeze({
  user: null,   // { name, employer, rate }
  jobs: [],     // { id, name, createdAt, done }
  gear: [],     // { id, name, group, qty, checkedAt|null, notes: [{ id, at, kind, text }], bits: [{ id, name, qty }] }
  lists: [],    // { id, name, jobId|null, items: [{ gearId, qty, packed }] }
  shifts: [],   // see shift.js
  usage: [],    // { id, jobId, gearId, qty, at }: gear used on a job
});

const LIST_KEYS = Object.keys(EMPTY_STATE).filter((key) => Array.isArray(EMPTY_STATE[key]));

/** True when `data` has the shape of a saved iTrimIt state. */
export function isBackup(data) {
  const listsOk = LIST_KEYS.every((key) => data?.[key] == null || Array.isArray(data[key]));
  return Boolean(data?.user?.name) && Array.isArray(data.shifts) && Array.isArray(data.gear) && listsOk;
}

/** Fill in fields that saves and backups from older versions don't have. */
export function upgrade(state) {
  return { ...EMPTY_STATE, ...state, gear: (state.gear ?? []).map((g) => ({ bits: [], ...g })) };
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? upgrade(JSON.parse(raw)) : { ...EMPTY_STATE };
  } catch {
    return { ...EMPTY_STATE };
  }
}

function writeStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked: keep running in memory.
  }
}

export function createStore() {
  let state = readStorage();
  const listeners = new Set();

  return {
    get: () => state,
    /** Apply a pure transition: (state, ...args) => nextState. */
    apply(transition, ...args) {
      state = transition(state, ...args);
      writeStorage(state);
      listeners.forEach((listener) => listener(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

export function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
