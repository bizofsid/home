import { FLOW_SCORE_MAX, FLOW_SCORE_MIN } from "@/lib/flow";

export default function FlowBar({ score, label }: { score: number; label?: string }) {
  const pct = Math.round(
    ((Math.min(score, FLOW_SCORE_MAX) - FLOW_SCORE_MIN) / (FLOW_SCORE_MAX - FLOW_SCORE_MIN)) * 100
  );

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-2 flex-1 rounded-full bg-line"
        role="img"
        aria-label={`Flow score ${score.toFixed(2)} out of ${FLOW_SCORE_MAX.toFixed(1)}`}
      >
        <div
          className="h-2 rounded-full bg-accent"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-medium tabular-nums text-ink-secondary">
        {score.toFixed(2)}x
      </span>
      {label && <span className="text-xs text-ink-muted">{label}</span>}
    </div>
  );
}
