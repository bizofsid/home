import { Suspense } from "react";
import RecommendView from "./RecommendView";

export default function RecommendPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-2xl px-4 py-8 text-sm text-ink-secondary">Loading…</p>}
    >
      <RecommendView />
    </Suspense>
  );
}
