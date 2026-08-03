"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchBusinesses, fetchSupplierLinks } from "@/lib/queries";
import { Business, BusinessSupplier } from "@/lib/types";
import { flowScore, sortByFlowScore } from "@/lib/flow";
import CategoryBadge from "@/components/CategoryBadge";
import FlowBar from "@/components/FlowBar";

export default function RecommendView() {
  const initialCategory = useSearchParams().get("category") ?? "";
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [links, setLinks] = useState<BusinessSupplier[]>([]);
  const [category, setCategory] = useState(initialCategory);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    Promise.all([fetchBusinesses(), fetchSupplierLinks()])
      .then(([b, l]) => {
        setBusinesses(b);
        setLinks(l);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category))).sort(),
    [businesses]
  );

  const byId = useMemo(() => new Map(businesses.map((b) => [b.id, b])), [businesses]);

  const ranked = useMemo(() => {
    const pool = category ? businesses.filter((b) => b.category === category) : businesses;
    return sortByFlowScore(pool).slice(0, category ? pool.length : 8);
  }, [businesses, category]);

  function suppliersFor(businessId: string) {
    return links
      .filter((l) => l.business_id === businessId)
      .map((l) => byId.get(l.supplier_id))
      .filter((b): b is Business => Boolean(b));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Where should I spend?</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Ranked by flow score — money spent here has the best odds of staying
        in Devonport a little longer before it leaves.
      </p>

      <div className="mt-4">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="">All categories — top picks</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load recommendations right now — try refreshing.
        </p>
      )}

      <ul className="mt-6 space-y-4">
        {ranked.map((b, i) => {
          const chain = suppliersFor(b.id);
          return (
            <li key={b.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-xs text-ink-muted">#{i + 1}</span>{" "}
                  <Link href={`/business?id=${b.id}`} className="font-medium hover:text-accent">
                    {b.name}
                  </Link>
                </div>
                <CategoryBadge category={b.category} />
              </div>
              <div className="mt-2">
                <FlowBar score={flowScore(b)} />
              </div>
              <p className="mt-2 text-xs text-ink-secondary">
                Respends about {b.local_respend_pct}% locally — a dollar spent
                here recirculates roughly {flowScore(b).toFixed(2)}x within
                Devonport.
              </p>
              {chain.length > 0 && (
                <p className="mt-1 text-xs text-ink-muted">
                  From here it likely flows to: {chain.map((s) => s.name).join(", ")}
                </p>
              )}
              <Link
                href={`/log?business=${b.id}`}
                className="mt-3 inline-block text-xs font-medium text-accent underline"
              >
                Log a purchase here
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
