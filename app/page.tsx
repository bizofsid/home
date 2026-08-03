"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchBusinesses, fetchPurchases, fetchSupplierLinks } from "@/lib/queries";
import { Business, BusinessSupplier, Purchase } from "@/lib/types";
import { flowScore, sortByFlowScore } from "@/lib/flow";
import { formatNZD } from "@/lib/format";
import StatTile from "@/components/StatTile";
import FlowBar from "@/components/FlowBar";
import NetworkGraph from "@/components/NetworkGraph";

export default function Dashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [links, setLinks] = useState<BusinessSupplier[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    Promise.all([fetchBusinesses(), fetchSupplierLinks(), fetchPurchases()])
      .then(([b, l, p]) => {
        setBusinesses(b);
        setLinks(l);
        setPurchases(p);
        setStatus("ready");
      })
      .catch(() => setStatus("error"));
  }, []);

  const byId = new Map(businesses.map((b) => [b.id, b]));
  const totalLogged = purchases.reduce((sum, p) => sum + Number(p.amount), 0);
  const estimatedRecirculation = purchases.reduce((sum, p) => {
    const business = byId.get(p.business_id);
    return sum + Number(p.amount) * (business ? flowScore(business) : 1);
  }, 0);
  const avgFlow =
    businesses.length > 0
      ? businesses.reduce((sum, b) => sum + flowScore(b), 0) / businesses.length
      : 0;
  const topFlow = sortByFlowScore(businesses).slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-10">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          If our dollars leave Devonport in hours, we&apos;re the problem.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          This tracks how spending moves through Devonport&apos;s own business
          network — and points you toward the businesses that keep dollars
          circulating locally the longest, instead of letting them leak out
          on the first trip to the mainland chains.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/log"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
          >
            Log a purchase
          </Link>
          <Link
            href="/recommend"
            className="rounded-md border border-line px-3 py-2 text-sm font-medium"
          >
            Where should I spend?
          </Link>
          <Link
            href="/join"
            className="rounded-md border border-line px-3 py-2 text-sm font-medium"
          >
            Add your business
          </Link>
        </div>
      </section>

      {status === "error" && (
        <p className="text-sm text-red-600">
          Couldn&apos;t load live data right now — try refreshing.
        </p>
      )}

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Businesses in network" value={String(businesses.length)} />
        <StatTile
          label="Dollars logged"
          value={formatNZD(totalLogged)}
          caption={`${purchases.length} purchase${purchases.length === 1 ? "" : "s"} logged`}
        />
        <StatTile
          label="Est. local recirculation"
          value={formatNZD(estimatedRecirculation)}
          caption="Logged spend × each business's flow score"
        />
        <StatTile label="Avg. network flow score" value={`${avgFlow.toFixed(2)}x`} />
      </section>

      {purchases.length === 0 && status === "ready" && (
        <p className="text-sm text-ink-secondary">
          Nobody has logged a purchase yet —{" "}
          <Link href="/log" className="text-accent underline">
            be the first
          </Link>
          .
        </p>
      )}

      <section>
        <h2 className="text-lg font-semibold">Best flow in the network</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Ranked by flow score — an estimate of how many times a dollar spent
          there recirculates locally before it leaves Devonport, based on
          each business&apos;s self-reported local respend rate.
        </p>
        <ul className="mt-4 space-y-3">
          {topFlow.map((b) => (
            <li key={b.id}>
              <Link href={`/business?id=${b.id}`} className="block hover:opacity-80">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{b.name}</span>
                  <span className="text-ink-muted">{b.category}</span>
                </div>
                <div className="mt-1">
                  <FlowBar score={flowScore(b)} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">The local network</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Who buys from whom, so far.
        </p>
        <div className="mt-4">
          <NetworkGraph businesses={businesses} links={links} />
        </div>
      </section>
    </div>
  );
}
