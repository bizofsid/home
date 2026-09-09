import Link from "next/link";
import StatTile from "@/components/StatTile";
import { SEED_GARMENTS } from "@/lib/garments";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-8">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Know it&apos;ll fit before it arrives.
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Ordering clothes online is a guess — sizes vary by brand, and the
          only feedback loop is a parcel that doesn&apos;t fit. Enter your
          measurements once, then check any garment&apos;s size chart against
          them for a zone-by-zone preview of how it&apos;ll actually sit,
          before you buy.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/profile"
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white"
          >
            Set up your measurements
          </Link>
          <Link
            href="/check"
            className="rounded-md border border-line px-3 py-2 text-sm font-medium"
          >
            Check a size chart
          </Link>
          <Link
            href="/catalog"
            className="rounded-md border border-line px-3 py-2 text-sm font-medium"
          >
            Browse examples
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <StatTile label="Measurements needed" value="5" caption="Height, chest, waist, hips, inseam" />
        <StatTile label="Example garments" value={String(SEED_GARMENTS.length)} caption="To try the tool on" />
        <StatTile label="Leaves your browser" value="Never" caption="Measurements stay local" />
      </section>

      <section>
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="mt-3 space-y-3 text-sm text-ink-secondary">
          <li>
            <span className="font-medium text-ink">1. Measure once.</span>{" "}
            Height, chest, waist, hips, inseam — saved only in this browser.
          </li>
          <li>
            <span className="font-medium text-ink">2. Paste a size chart.</span>{" "}
            Copy the numbers from any retailer&apos;s page into{" "}
            <Link href="/check" className="text-accent underline">
              Check a size chart
            </Link>
            .
          </li>
          <li>
            <span className="font-medium text-ink">3. See the preview.</span>{" "}
            Each size is scored zone by zone — chest, waist, hips, length —
            and rated from too tight to too loose, with a recommended size.
          </li>
        </ol>
      </section>
    </div>
  );
}
