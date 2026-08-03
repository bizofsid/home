import { Business } from "./types";

export const FLOW_SCORE_MIN = 1;
export const FLOW_SCORE_MAX = 3;

/**
 * LM3-lite: a simplified Local Multiplier 3 (New Economics Foundation
 * methodology) — compounds a business's self-reported local-respend rate
 * over three rounds of spending to estimate how many times a dollar
 * recirculates locally before it leaves the area.
 */
export function localMultiplier(respendPct: number): number {
  const r = Math.max(0, Math.min(100, respendPct)) / 100;
  return 1 + r + r * r;
}

export function flowScore(business: Pick<Business, "local_respend_pct">): number {
  return localMultiplier(business.local_respend_pct);
}

export function flowBucket(score: number): "low" | "mid" | "high" {
  const t = (score - FLOW_SCORE_MIN) / (FLOW_SCORE_MAX - FLOW_SCORE_MIN);
  if (t < 0.33) return "low";
  if (t < 0.66) return "mid";
  return "high";
}

export function sortByFlowScore(businesses: Business[]): Business[] {
  return [...businesses].sort((a, b) => flowScore(b) - flowScore(a));
}
