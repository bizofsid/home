// Pure state transitions. Each takes the current state and returns the next one.
// Nothing here reads the clock or storage; callers pass `now`.

import { newId, EMPTY_STATE, upgrade } from './store.js';
import { isOpen } from './shift.js';

const UTE = null; // jobId for gear that's on the ute / back at the yard

// ── helpers ──────────────────────────────────────────────

const replaceById = (list, id, update) => list.map((item) => (item.id === id ? update(item) : item));

const openShift = (state) => state.shifts.find(isOpen) ?? null;

const updateOpenShift = (state, update) => {
  const shift = openShift(state);
  return shift ? { ...state, shifts: replaceById(state.shifts, shift.id, update) } : state;
};

const closeOpenBreak = (shift, now) => ({
  ...shift,
  breaks: shift.breaks.map((b) => (b.end == null ? { ...b, end: now } : b)),
});

// ── user ─────────────────────────────────────────────────

export function createUser(state, { name, employer, rate, starterGear }) {
  const gear = starterGear.map(({ name: gearName, group, qty }) => makeGear(gearName, group, qty));
  return { ...state, user: { name, employer, rate }, gear: [...state.gear, ...gear] };
}

export function updateUser(state, { name, employer, rate }) {
  return { ...state, user: { ...state.user, name, employer, rate } };
}

/** Swap in a whole saved state (restore or erase). Keys outside the schema are dropped. */
export function replaceAll(_state, { next }) {
  const known = Object.keys(EMPTY_STATE).map((key) => [key, next[key] ?? EMPTY_STATE[key]]);
  return upgrade(Object.fromEntries(known));
}

// ── clock ────────────────────────────────────────────────

export function clockIn(state, { jobId, now }) {
  if (openShift(state)) return state;
  const job = state.jobs.find((j) => j.id === jobId);
  const shift = { id: newId(), jobId, site: job?.name ?? '', start: now, end: null, breaks: [], note: '' };
  return { ...state, shifts: [...state.shifts, shift] };
}

export function startBreak(state, { kind, now }) {
  return updateOpenShift(state, (shift) => {
    const closed = closeOpenBreak(shift, now);
    return { ...closed, breaks: [...closed.breaks, { kind, start: now, end: null }] };
  });
}

export function endBreak(state, { now }) {
  return updateOpenShift(state, (shift) => closeOpenBreak(shift, now));
}

export function clockOut(state, { now }) {
  return updateOpenShift(state, (shift) => ({ ...closeOpenBreak(shift, now), end: now }));
}

export function updateShift(state, { id, changes }) {
  return { ...state, shifts: replaceById(state.shifts, id, (shift) => ({ ...shift, ...changes })) };
}

export function deleteShift(state, { id }) {
  return { ...state, shifts: state.shifts.filter((s) => s.id !== id) };
}

// ── jobs ─────────────────────────────────────────────────

export function addJob(state, { name, now }) {
  return { ...state, jobs: [...state.jobs, { id: newId(), name, createdAt: now, done: false }] };
}

/** Unpin every list from a job (they go back to the ute). */
const unpinListsFrom = (lists, jobId) => lists.map((l) => (l.jobId === jobId ? { ...l, jobId: UTE } : l));

export function setJobDone(state, { id, done }) {
  const jobs = replaceById(state.jobs, id, (job) => ({ ...job, done }));
  return { ...state, jobs, lists: done ? unpinListsFrom(state.lists, id) : state.lists };
}

export function deleteJob(state, { id }) {
  return {
    ...state,
    jobs: state.jobs.filter((j) => j.id !== id),
    lists: unpinListsFrom(state.lists, id),
    usage: state.usage.filter((u) => u.jobId !== id),
  };
}

// ── gear ─────────────────────────────────────────────────

function makeGear(name, group, qty = 1) {
  return { id: newId(), name, group, qty, checkedAt: null, notes: [], bits: [] };
}

export function addGear(state, { name, group, qty }) {
  return { ...state, gear: [...state.gear, makeGear(name, group, qty)] };
}

export function updateGear(state, { id, changes }) {
  return { ...state, gear: replaceById(state.gear, id, (g) => ({ ...g, ...changes })) };
}

export function deleteGear(state, { id }) {
  return {
    ...state,
    gear: state.gear.filter((g) => g.id !== id),
    usage: state.usage.filter((u) => u.gearId !== id),
    lists: state.lists.map((l) => ({ ...l, items: l.items.filter((item) => item.gearId !== id) })),
  };
}

export function checkGear(state, { id, now }) {
  return { ...state, gear: replaceById(state.gear, id, (g) => ({ ...g, checkedAt: now })) };
}

export function addGearNote(state, { id, kind, text, now }) {
  const note = { id: newId(), at: now, kind, text };
  return { ...state, gear: replaceById(state.gear, id, (g) => ({ ...g, notes: [note, ...g.notes] })) };
}

export function deleteGearNote(state, { gearId, noteId }) {
  return {
    ...state,
    gear: replaceById(state.gear, gearId, (g) => ({ ...g, notes: g.notes.filter((n) => n.id !== noteId) })),
  };
}

// ── bits & spares (the small stuff that goes with a gear item) ──
// Bit: { id, name, qty }

const sameName = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

const updateBits = (state, gearId, update) => ({
  ...state,
  gear: replaceById(state.gear, gearId, (g) => ({ ...g, bits: update(g.bits) })),
});

/** Add a bit to a gear item. Adding a name it already has tops up that bit instead. */
export function addBit(state, { gearId, name, qty }) {
  return updateBits(state, gearId, (bits) => {
    const existing = bits.find((bit) => sameName(bit.name, name));
    if (existing) return replaceById(bits, existing.id, (bit) => ({ ...bit, qty: bit.qty + qty }));
    return [...bits, { id: newId(), name, qty }];
  });
}

/** Set how many of a bit there are. 0 removes it. */
export function setBitQty(state, { gearId, bitId, qty }) {
  return updateBits(state, gearId, (bits) => (qty <= 0
    ? bits.filter((bit) => bit.id !== bitId)
    : replaceById(bits, bitId, (bit) => ({ ...bit, qty }))));
}

// ── gear lists (kits) ────────────────────────────────────
// List: { id, name, jobId|null, items: [{ gearId, qty, packed }] }

const updateList = (state, id, update) => ({ ...state, lists: replaceById(state.lists, id, update) });

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function addList(state, { name }) {
  return { ...state, lists: [...state.lists, { id: newId(), name, jobId: UTE, items: [] }] };
}

export function renameList(state, { id, name }) {
  return updateList(state, id, (list) => ({ ...list, name }));
}

export function deleteList(state, { id }) {
  return { ...state, lists: state.lists.filter((l) => l.id !== id) };
}

/** Set how many of a gear item the list needs. 0 removes it. */
export function setListItemQty(state, { listId, gearId, qty }) {
  return updateList(state, listId, (list) => {
    const others = list.items.filter((item) => item.gearId !== gearId);
    if (qty <= 0) return { ...list, items: others };
    const existing = list.items.find((item) => item.gearId === gearId);
    const packed = clamp(existing?.packed ?? 0, 0, qty);
    const items = existing
      ? list.items.map((item) => (item.gearId === gearId ? { ...item, qty, packed } : item))
      : [...others, { gearId, qty, packed: 0 }];
    return { ...list, items };
  });
}

/** Count packed items up or down by `delta`, within 0..qty. */
export function countPacked(state, { listId, gearId, delta }) {
  return updateList(state, listId, (list) => ({
    ...list,
    items: list.items.map((item) =>
      item.gearId === gearId ? { ...item, packed: clamp(item.packed + delta, 0, item.qty) } : item,
    ),
  }));
}

export function packAll(state, { listId }) {
  return updateList(state, listId, (list) => ({
    ...list,
    items: list.items.map((item) => ({ ...item, packed: item.qty })),
  }));
}

/** Pin a list to a job (or the ute). Moving resets the pack count: re-check at the new site. */
export function pinList(state, { listId, jobId }) {
  return updateList(state, listId, (list) => ({
    ...list,
    jobId,
    items: list.items.map((item) => ({ ...item, packed: 0 })),
  }));
}

// ── gear use per site ────────────────────────────────────
// Usage: { id, jobId, gearId, qty, at }

/** Record gear used on a job: one item, or every item in a set. */
export function recordUse(state, { jobId, items, now }) {
  const entries = items.map(({ gearId, qty }) => ({ id: newId(), jobId, gearId, qty, at: now }));
  return { ...state, usage: [...state.usage, ...entries] };
}

/** Take one off the most recent use of a gear item on a job. */
export function undoOneUse(state, { jobId, gearId }) {
  const latest = state.usage.filter((u) => u.jobId === jobId && u.gearId === gearId).at(-1);
  if (!latest) return state;
  const usage = latest.qty > 1
    ? replaceById(state.usage, latest.id, (u) => ({ ...u, qty: u.qty - 1 }))
    : state.usage.filter((u) => u.id !== latest.id);
  return { ...state, usage };
}
