// NZ default rest and meal break entitlements
// (Employment Relations Act 2000, s 69ZD; applies unless agreed otherwise).
//
//   2–4 h  → 1 paid rest
//   4–6 h  → 1 rest + 1 meal
//   6–8 h  → 2 rests + 1 meal
//   8 h +  → the pattern starts again for the extra time
//
// A guide for the worker, not legal advice.

import { HOUR } from './time.js';

function entitlementForBlock(hours) {
  if (hours >= 6) return { rest: 2, meal: 1 };
  if (hours >= 4) return { rest: 1, meal: 1 };
  if (hours >= 2) return { rest: 1, meal: 0 };
  return { rest: 0, meal: 0 };
}

/** Breaks owed for a span of time on the clock (breaks included). */
export function breaksOwed(elapsedMs) {
  const hours = elapsedMs / HOUR;
  const fullBlocks = Math.floor(hours / 8);
  const remainder = entitlementForBlock(hours - fullBlocks * 8);
  return {
    rest: fullBlocks * 2 + remainder.rest,
    meal: fullBlocks * 1 + remainder.meal,
  };
}
