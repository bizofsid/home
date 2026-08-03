import { Suspense } from "react";
import BusinessDetail from "./BusinessDetail";

export default function BusinessPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-secondary">Loading…</p>}
    >
      <BusinessDetail />
    </Suspense>
  );
}
