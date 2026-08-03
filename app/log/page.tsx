import { Suspense } from "react";
import LogForm from "./LogForm";

export default function LogPage() {
  return (
    <Suspense
      fallback={<p className="mx-auto max-w-md px-4 py-8 text-sm text-ink-secondary">Loading…</p>}
    >
      <LogForm />
    </Suspense>
  );
}
