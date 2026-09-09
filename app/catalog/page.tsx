"use client";

import Link from "next/link";
import { SEED_GARMENTS } from "@/lib/garments";
import { removeSavedGarment, useSavedGarments } from "@/lib/storage";
import SavedGarmentCard from "@/components/SavedGarmentCard";

export default function CatalogPage() {
  const saved = useSavedGarments();

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">Catalog</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          Example garments to try the fit preview on, plus any size charts
          you&apos;ve checked and saved yourself.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Your saved checks</h2>
        {saved.length === 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            Nothing saved yet —{" "}
            <Link href="/check" className="text-accent underline">
              check a size chart
            </Link>{" "}
            and save it here.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {saved.map((g) => (
              <SavedGarmentCard key={g.id} garment={g} onRemove={removeSavedGarment} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold">Example garments</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Hand-written sample size charts for trying the tool out — not real
          retailer data.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SEED_GARMENTS.map((g) => (
            <Link
              key={g.id}
              href={`/garment/${g.id}`}
              className="rounded-lg border border-line bg-surface p-4 hover:border-accent"
            >
              <div className="font-medium">{g.name}</div>
              <div className="text-xs text-ink-muted">{g.brand}</div>
              <div className="mt-2 text-xs capitalize text-ink-secondary">
                {g.category} · {g.cut} cut
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
