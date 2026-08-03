"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBusinesses } from "@/lib/queries";
import { Business } from "@/lib/types";
import { sortByFlowScore } from "@/lib/flow";
import BusinessCard from "@/components/BusinessCard";

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  useEffect(() => {
    fetchBusinesses()
      .then((b) => {
        setBusinesses(b);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(businesses.map((b) => b.category))).sort()],
    [businesses]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sortByFlowScore(
      businesses.filter((b) => {
        const matchesCategory = category === "All" || b.category === category;
        const matchesQuery =
          !q ||
          b.name.toLowerCase().includes(q) ||
          b.description.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      })
    );
  }, [businesses, query, category]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Every business in the Devonport network, ranked by flow score.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search businesses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {status === "error" && (
        <p className="mt-6 text-sm text-red-600">
          Couldn&apos;t load the directory right now — try refreshing.
        </p>
      )}
      {status === "ready" && filtered.length === 0 && (
        <p className="mt-6 text-sm text-ink-secondary">No businesses match that search.</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((b) => (
          <BusinessCard key={b.id} business={b} />
        ))}
      </div>
    </div>
  );
}
