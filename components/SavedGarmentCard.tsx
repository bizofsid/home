"use client";

import { useState } from "react";
import ProfileGate from "@/components/ProfileGate";
import FitResult from "@/components/FitResult";
import { Garment } from "@/lib/types";

export default function SavedGarmentCard({
  garment,
  onRemove,
}: {
  garment: Garment;
  onRemove: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={() => setOpen((o) => !o)} className="text-left">
          <div className="font-medium">
            {garment.brand} — {garment.name}
          </div>
          <div className="text-xs text-ink-muted capitalize">
            {garment.category} · {garment.cut} cut
          </div>
        </button>
        <div className="flex shrink-0 gap-3 text-xs">
          <button onClick={() => setOpen((o) => !o)} className="text-accent underline">
            {open ? "Hide" : "Preview fit"}
          </button>
          <button onClick={() => onRemove(garment.id)} className="text-ink-muted hover:text-fit-bad">
            Remove
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-4 border-t border-line pt-4">
          <ProfileGate>{(profile) => <FitResult garment={garment} profile={profile} />}</ProfileGate>
        </div>
      )}
    </div>
  );
}
