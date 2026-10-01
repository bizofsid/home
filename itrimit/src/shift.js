// Shift arithmetic. Pure functions over plain shift objects.
//
// Shift: { id, jobId, site, start, end|null, breaks: [{ kind, start, end|null }], note }

export function isOpen(shift) {
  return shift.end == null;
}

export function currentBreak(shift) {
  return shift.breaks.find((b) => b.end == null) ?? null;
}

/** Time on breaks, counting only the part of each break inside the shift (edits can move the shift). */
export function breakMs(shift, now) {
  const shiftEnd = shift.end ?? now;
  const insideShift = (b) => Math.max(0, Math.min(b.end ?? now, shiftEnd) - Math.max(b.start, shift.start));
  return shift.breaks.reduce((sum, b) => sum + insideShift(b), 0);
}

export function workedMs(shift, now) {
  return (shift.end ?? now) - shift.start - breakMs(shift, now);
}

export function workedBetween(shifts, from, to, now) {
  return shifts
    .filter((s) => s.start >= from && s.start < to)
    .reduce((sum, s) => sum + workedMs(s, now), 0);
}

export function countBreaks(shift, kind) {
  return shift.breaks.filter((b) => b.kind === kind).length;
}
