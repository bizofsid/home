"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchBusinesses, addPurchase } from "@/lib/queries";
import { Business } from "@/lib/types";
import { flowScore } from "@/lib/flow";
import { formatNZD } from "@/lib/format";

export default function LogForm() {
  const prefillId = useSearchParams().get("business") ?? "";
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [businessId, setBusinessId] = useState(prefillId);
  const [amount, setAmount] = useState("");
  const [spenderName, setSpenderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<{ business: Business; amount: number } | null>(null);

  useEffect(() => {
    fetchBusinesses().then((b) => {
      setBusinesses(b);
      if (!businessId && b.length > 0) setBusinessId(b[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const business = businesses.find((b) => b.id === businessId);
    const amountNum = Number(amount);
    if (!business) {
      setError("Pick a business.");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    setSubmitting(true);
    try {
      await addPurchase({ business_id: business.id, amount: amountNum, spender_name: spenderName });
      setConfirmed({ business, amount: amountNum });
      setAmount("");
      setSpenderName("");
    } catch {
      setError("Couldn't log that purchase — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    const recirculation = confirmed.amount * flowScore(confirmed.business);
    return (
      <div className="mx-auto max-w-md px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Logged</h1>
        <p className="mt-2 text-sm text-ink-secondary">
          {formatNZD(confirmed.amount)} at {confirmed.business.name} is estimated to
          recirculate about {formatNZD(recirculation)} through Devonport before it
          leaves.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => setConfirmed(null)}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
          >
            Log another
          </button>
          <Link href="/" className="rounded-md border border-line px-3 py-2 text-sm font-medium">
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Log a purchase</h1>
      <p className="mt-1 text-sm text-ink-secondary">
        No account needed — this is a trust-based community log.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Business
          </label>
          <select
            value={businessId}
            onChange={(e) => setBusinessId(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          >
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Amount (NZD)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="25.00"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Your name (optional)
          </label>
          <input
            type="text"
            value={spenderName}
            onChange={(e) => setSpenderName(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting || businesses.length === 0}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {submitting ? "Logging…" : "Log purchase"}
        </button>
      </form>
    </div>
  );
}
