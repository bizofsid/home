"use client";

import { Business, BusinessSupplier } from "@/lib/types";
import { flowScore, flowBucket } from "@/lib/flow";

const BUCKET_FILL: Record<string, string> = {
  low: "var(--flow-low)",
  mid: "var(--flow-mid)",
  high: "var(--flow-high)",
};

export default function NetworkGraph({
  businesses,
  links,
}: {
  businesses: Business[];
  links: BusinessSupplier[];
}) {
  const connectedIds = new Set<string>();
  links.forEach((l) => {
    connectedIds.add(l.business_id);
    connectedIds.add(l.supplier_id);
  });
  const nodes = businesses.filter((b) => connectedIds.has(b.id));

  if (nodes.length === 0) {
    return (
      <p className="text-sm text-ink-secondary">
        No supplier connections logged yet — businesses can add who they buy
        from locally on the Join page.
      </p>
    );
  }

  const inDegree = new Map<string, number>();
  links.forEach((l) => {
    inDegree.set(l.supplier_id, (inDegree.get(l.supplier_id) ?? 0) + 1);
  });

  const size = 560;
  const center = size / 2;
  const radius = size / 2 - 70;
  const positions = new Map<string, { x: number; y: number }>();
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length - Math.PI / 2;
    positions.set(n.id, {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
    });
  });

  return (
    <div>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="mx-auto w-full max-w-xl"
        role="img"
        aria-label="Network of businesses that buy from each other locally, coloured by local flow score"
      >
        {links.map((l) => {
          const a = positions.get(l.business_id);
          const b = positions.get(l.supplier_id);
          if (!a || !b) return null;
          return (
            <line
              key={l.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="var(--line)"
              strokeWidth={1.5}
            />
          );
        })}
        {nodes.map((n) => {
          const pos = positions.get(n.id)!;
          const bucket = flowBucket(flowScore(n));
          const isHub = (inDegree.get(n.id) ?? 0) >= 2;
          return (
            <g key={n.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={7}
                fill={BUCKET_FILL[bucket]}
                stroke="var(--surface)"
                strokeWidth={2}
              >
                <title>{`${n.name} — flow score ${flowScore(n).toFixed(2)}x`}</title>
              </circle>
              {isHub && (
                <text
                  x={pos.x}
                  y={pos.y - 12}
                  textAnchor="middle"
                  fontSize={11}
                  className="fill-ink-secondary"
                >
                  {n.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-ink-muted">
        Lines show who buys from whom locally. Darker dots keep dollars
        circulating longer — hover any dot for its flow score.
      </p>
    </div>
  );
}
