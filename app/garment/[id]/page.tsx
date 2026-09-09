import { notFound } from "next/navigation";
import Link from "next/link";
import { getSeedGarment, SEED_GARMENTS } from "@/lib/garments";
import SizeChartTable from "@/components/SizeChartTable";
import GarmentFitSection from "@/components/GarmentFitSection";

export function generateStaticParams() {
  return SEED_GARMENTS.map((g) => ({ id: g.id }));
}

export default async function GarmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const garment = getSeedGarment(id);
  if (!garment) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <Link href="/catalog" className="text-sm text-accent underline">
          ← Back to catalog
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{garment.name}</h1>
        <p className="text-sm text-ink-muted">{garment.brand}</p>
        {garment.notes && <p className="mt-2 text-sm text-ink-secondary">{garment.notes}</p>}
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Size chart</h2>
        <SizeChartTable garment={garment} />
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Fit preview</h2>
        <GarmentFitSection garment={garment} />
      </section>
    </div>
  );
}
