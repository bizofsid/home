"use client";

import { useMemo, useState } from "react";
import { computeFit, fitClassLabel, FIT_CLASS_COLOR, recommendSize, ZONE_LABEL } from "@/lib/fit";
import { BodyProfile, Garment } from "@/lib/types";
import FitPill from "@/components/FitPill";
import FitSilhouette from "@/components/FitSilhouette";

function easeBarWidth(easeCm: number): number {
  const clamped = Math.max(-10, Math.min(20, easeCm));
  return ((clamped + 10) / 30) * 100;
}

export default function FitResult({
  garment,
  profile,
}: {
  garment: Garment;
  profile: BodyProfile;
}) {
  const fits = useMemo(() => computeFit(garment, profile), [garment, profile]);
  const recommended = useMemo(() => recommendSize(fits), [fits]);
  const [selectedSize, setSelectedSize] = useState(recommended?.size ?? fits[0]?.size);

  const selected = fits.find((f) => f.size === selectedSize) ?? fits[0];
  if (!selected) return null;

  return (
    <div className="space-y-5">
      {recommended && (
        <div className="rounded-lg border border-line bg-surface px-4 py-3">
          <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
            Recommended size
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold">{recommended.size}</span>
            <FitPill fitClass={recommended.overall} />
          </div>
          <p className="mt-1 text-xs text-ink-secondary">
            Closest match to your measurements and fit preference — this is an
            estimate, not a guarantee.
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {fits.map((f) => (
          <button
            key={f.size}
            onClick={() => setSelectedSize(f.size)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              f.size === selectedSize
                ? "border-accent bg-accent text-white"
                : "border-line text-ink-secondary hover:text-ink"
            }`}
          >
            {f.size}
            {f.size === recommended?.size ? " ★" : ""}
          </button>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
        <FitSilhouette category={garment.category} zones={selected.zones} />

        <div className="space-y-3">
          {selected.zones.map((z) => (
            <div key={z.zone}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{ZONE_LABEL[z.zone]}</span>
                <FitPill fitClass={z.fitClass} label={fitClassLabel(z.fitClass, z.zone)} />
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-line">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${easeBarWidth(z.easeCm)}%`,
                    backgroundColor: FIT_CLASS_COLOR[z.fitClass],
                  }}
                />
              </div>
              <div className="mt-1 text-xs text-ink-muted">
                You: {z.bodyCm}cm · Garment: {z.garmentCm}cm ·{" "}
                {z.zone === "length"
                  ? `${z.easeCm >= 0 ? `${z.easeCm}cm longer` : `${Math.abs(z.easeCm)}cm shorter`} than your inseam`
                  : `${z.easeCm >= 0 ? `+${z.easeCm}` : z.easeCm}cm of room`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
