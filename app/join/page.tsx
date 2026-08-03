"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchBusinesses, addBusiness } from "@/lib/queries";
import { Business } from "@/lib/types";

export default function JoinPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [respend, setRespend] = useState(30);
  const [supplierIds, setSupplierIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBusinesses().then(setBusinesses);
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(businesses.map((b) => b.category))).sort(),
    [businesses]
  );

  function toggleSupplier(id: string) {
    setSupplierIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !category.trim() || !description.trim()) {
      setError("Name, category and a short description are required.");
      return;
    }
    setSubmitting(true);
    try {
      const created = await addBusiness({
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        website: website.trim() || null,
        local_respend_pct: respend,
        supplierIds,
      });
      router.push(`/business?id=${created.id}`);
    } catch {
      setError("Couldn't add your business — try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Join the network</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        Any Devonport business can join — no verification, just honesty about
        where your money goes. That&apos;s what makes the flow score mean
        something.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Business name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Category
          </label>
          <input
            type="text"
            list="category-options"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g. Cafe & Coffee"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
          <datalist id="category-options">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Short description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Website (optional)
          </label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            % of revenue you spend back with other Devonport businesses: {respend}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={respend}
            onChange={(e) => setRespend(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </div>

        {businesses.length > 0 && (
          <div>
            <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
              Which local businesses do you buy from? (optional)
            </label>
            <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-md border border-line p-2">
              {businesses.map((b) => (
                <label key={b.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={supplierIds.includes(b.id)}
                    onChange={() => toggleSupplier(b.id)}
                  />
                  {b.name}
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Adding…" : "Join the network"}
        </button>
      </form>
    </div>
  );
}
