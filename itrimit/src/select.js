// Derived views of state. Pure reads, no mutation.

import { isOpen } from './shift.js';

export const UTE_LABEL = 'Ute / yard';

export const openShift = (state) => state.shifts.find(isOpen) ?? null;

export const activeJobs = (state) => state.jobs.filter((j) => !j.done);

export const jobName = (state, jobId) => state.jobs.find((j) => j.id === jobId)?.name ?? UTE_LABEL;

export const gearById = (state, id) => state.gear.find((g) => g.id === id) ?? null;

/** Gear grouped under its subheading, groups and items sorted by name. */
export function gearByGroup(gear) {
  const groups = new Map();
  for (const item of gear) {
    const key = item.group || 'Other';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, items]) => ({ group, items: items.sort((a, b) => a.name.localeCompare(b.name)) }));
}

export const groupNames = (state) => gearByGroup(state.gear).map(({ group }) => group);

/** Every bit name used on any gear item, for autocomplete. */
export function bitNames(state) {
  const names = new Map();
  for (const bit of state.gear.flatMap((g) => g.bits)) names.set(bit.name.toLowerCase(), bit.name);
  return [...names.values()].sort((a, b) => a.localeCompare(b));
}

/** "Trimmer line ×2, Spark plug" */
export const bitsSummary = (gear) => gear.bits.map((bit) => (bit.qty > 1 ? `${bit.name} ×${bit.qty}` : bit.name)).join(', ');

export const listsAt = (state, jobId) => state.lists.filter((l) => l.jobId === jobId);

export function listProgress(list) {
  const needed = list.items.reduce((sum, item) => sum + item.qty, 0);
  const packed = list.items.reduce((sum, item) => sum + item.packed, 0);
  return { needed, packed, complete: needed > 0 && packed === needed };
}

/**
 * Gear pinned out in greater numbers than he owns, across every list on a job.
 * Lists on the ute are templates, so they don't count.
 */
export function overcommitted(state) {
  const pinned = new Map();
  for (const list of state.lists) {
    if (list.jobId == null) continue;
    for (const item of list.items) pinned.set(item.gearId, (pinned.get(item.gearId) ?? 0) + item.qty);
  }
  return state.gear
    .filter((g) => (pinned.get(g.id) ?? 0) > g.qty)
    .map((g) => ({ gear: g, pinned: pinned.get(g.id), owned: g.qty }));
}

/** A gear item has an open fault when its latest fault note has no later "fixed" note. */
export function hasOpenFault(gear) {
  const latest = gear.notes.find((n) => n.kind === 'fault' || n.kind === 'fixed');
  return latest?.kind === 'fault';
}

/** Total of each gear item used on a job, most-used first. */
export function usageAtJob(state, jobId) {
  const totals = new Map();
  for (const use of state.usage) {
    if (use.jobId !== jobId) continue;
    const entry = totals.get(use.gearId) ?? { qty: 0, last: 0 };
    totals.set(use.gearId, { qty: entry.qty + use.qty, last: Math.max(entry.last, use.at) });
  }
  return [...totals.entries()]
    .map(([gearId, { qty, last }]) => ({ gear: gearById(state, gearId), qty, last }))
    .filter((row) => row.gear)
    .sort((a, b) => b.qty - a.qty);
}

/** Which jobs a gear item has been used on, most recent first. */
export function usageOfGear(state, gearId) {
  const byJob = new Map();
  for (const use of state.usage) {
    if (use.gearId !== gearId) continue;
    const entry = byJob.get(use.jobId) ?? { qty: 0, last: 0 };
    byJob.set(use.jobId, { qty: entry.qty + use.qty, last: Math.max(entry.last, use.at) });
  }
  return [...byJob.entries()]
    .map(([jobId, { qty, last }]) => ({ jobId, qty, last }))
    .sort((a, b) => b.last - a.last);
}
