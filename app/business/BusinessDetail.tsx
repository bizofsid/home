"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchBusiness, fetchBusinesses, fetchSupplierLinks } from "@/lib/queries";
import { Business, BusinessSupplier } from "@/lib/types";
import { flowScore } from "@/lib/flow";
import CategoryBadge from "@/components/CategoryBadge";
import FlowBar from "@/components/FlowBar";

export default function BusinessDetail() {
  const id = useSearchParams().get("id");
  const [business, setBusiness] = useState<Business | null | undefined>(undefined);
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [links, setLinks] = useState<BusinessSupplier[]>([]);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchBusiness(id), fetchBusinesses(), fetchSupplierLinks()]).then(
      ([b, all, l]) => {
        setBusiness(b);
        setAllBusinesses(all);
        setLinks(l);
      }
    );
  }, [id]);

  if (!id) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-secondary">No business selected.</p>;
  }
  if (business === undefined) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-secondary">Loading…</p>;
  }
  if (business === null) {
    return <p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-secondary">Business not found.</p>;
  }

  const byId = new Map(allBusinesses.map((b) => [b.id, b]));
  const suppliers = links
    .filter((l) => l.business_id === business.id)
    .map((l) => byId.get(l.supplier_id))
    .filter((b): b is Business => Boolean(b));
  const buyers = links
    .filter((l) => l.supplier_id === business.id)
    .map((l) => byId.get(l.business_id))
    .filter((b): b is Business => Boolean(b));

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/directory" className="text-sm text-accent underline">
        ← Back to directory
      </Link>

      <div className="mt-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{business.name}</h1>
        <CategoryBadge category={business.category} />
      </div>
      <p className="mt-2 text-sm text-ink-secondary">{business.description}</p>
      {business.website && (
        <a
          href={business.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-accent underline"
        >
          {business.website}
        </a>
      )}

      <div className="mt-6 rounded-lg border border-line bg-surface p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          Flow score
        </div>
        <div className="mt-2">
          <FlowBar score={flowScore(business)} />
        </div>
        <p className="mt-2 text-xs text-ink-secondary">
          Self-reported: spends about {business.local_respend_pct}% of revenue
          back with other Devonport businesses.
        </p>
      </div>

      {suppliers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Buys locally from</h2>
          <ul className="mt-2 space-y-1">
            {suppliers.map((s) => (
              <li key={s.id}>
                <Link href={`/business?id=${s.id}`} className="text-sm text-accent underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {buyers.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold">Locally supplies</h2>
          <ul className="mt-2 space-y-1">
            {buyers.map((s) => (
              <li key={s.id}>
                <Link href={`/business?id=${s.id}`} className="text-sm text-accent underline">
                  {s.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/log?business=${business.id}`}
        className="mt-8 inline-block rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
      >
        Log a purchase here
      </Link>
    </div>
  );
}
