"use client";

import { useState } from "react";
import Link from "next/link";
import ProfileGate from "@/components/ProfileGate";
import FitResult from "@/components/FitResult";
import { saveGarment } from "@/lib/storage";
import { Garment, GarmentCategory, GarmentCut, SizeRow } from "@/lib/types";

type DraftRow = { size: string; chestCm: string; waistCm: string; hipsCm: string; lengthCm: string };

const EMPTY_ROW: DraftRow = { size: "", chestCm: "", waistCm: "", hipsCm: "", lengthCm: "" };

function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "garment"
  );
}

function toRow(draft: DraftRow): SizeRow | null {
  if (!draft.size.trim()) return null;
  const row: SizeRow = { size: draft.size.trim() };
  if (draft.chestCm) row.chestCm = Number(draft.chestCm);
  if (draft.waistCm) row.waistCm = Number(draft.waistCm);
  if (draft.hipsCm) row.hipsCm = Number(draft.hipsCm);
  if (draft.lengthCm) row.lengthCm = Number(draft.lengthCm);
  return row;
}

export default function CheckForm() {
  const [brand, setBrand] = useState("");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<GarmentCategory>("top");
  const [cut, setCut] = useState<GarmentCut>("regular");
  const [rows, setRows] = useState<DraftRow[]>([{ ...EMPTY_ROW }, { ...EMPTY_ROW }, { ...EMPTY_ROW }]);
  const [garment, setGarment] = useState<Garment | null>(null);
  const [savedNotice, setSavedNotice] = useState(false);

  function updateRow(index: number, field: keyof DraftRow, value: string) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sizeChart = rows.map(toRow).filter((r): r is SizeRow => r !== null);
    if (sizeChart.length === 0) return;
    setSavedNotice(false);
    setGarment({
      id: `${slugify(brand)}-${slugify(name)}-${Date.now()}`,
      brand: brand.trim() || "Unnamed brand",
      name: name.trim() || "Unnamed item",
      category,
      cut,
      sizeChart,
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium" htmlFor="brand">
              Brand
            </label>
            <input
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Uniqlo"
              className="mt-1 w-full rounded-md border border-line bg-page px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="name">
              Item
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Oxford Shirt"
              className="mt-1 w-full rounded-md border border-line bg-page px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as GarmentCategory)}
              className="mt-1 w-full rounded-md border border-line bg-page px-3 py-2 text-sm"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="dress">Dress</option>
              <option value="outerwear">Outerwear</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium" htmlFor="cut">
              Cut
            </label>
            <select
              id="cut"
              value={cut}
              onChange={(e) => setCut(e.target.value as GarmentCut)}
              className="mt-1 w-full rounded-md border border-line bg-page px-3 py-2 text-sm"
            >
              <option value="fitted">Fitted</option>
              <option value="regular">Regular</option>
              <option value="relaxed">Relaxed</option>
            </select>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium">
              Size chart (cm) — copy the numbers from the retailer&apos;s page
            </label>
            <button
              type="button"
              onClick={() => setRows((r) => [...r, { ...EMPTY_ROW }])}
              className="text-xs font-medium text-accent underline"
            >
              + Add size
            </button>
          </div>
          {category === "bottom" && (
            <p className="mb-2 text-xs text-ink-muted">
              Use inseam (crotch to hem), not outseam — that&apos;s what gets
              compared to your own inseam measurement.
            </p>
          )}
          <div className="overflow-x-auto rounded-lg border border-line">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-2 py-2">Size</th>
                  <th className="px-2 py-2">Chest</th>
                  <th className="px-2 py-2">Waist</th>
                  <th className="px-2 py-2">Hips</th>
                  <th className="px-2 py-2">{category === "bottom" ? "Inseam" : "Length"}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="px-2 py-1.5">
                      <input
                        value={row.size}
                        onChange={(e) => updateRow(i, "size", e.target.value)}
                        placeholder="M"
                        className="w-16 rounded border border-line bg-page px-2 py-1"
                      />
                    </td>
                    {(["chestCm", "waistCm", "hipsCm", "lengthCm"] as const).map((field) => (
                      <td key={field} className="px-2 py-1.5">
                        <input
                          type="number"
                          value={row[field]}
                          onChange={(e) => updateRow(i, field, e.target.value)}
                          className="w-20 rounded border border-line bg-page px-2 py-1 tabular-nums"
                        />
                      </td>
                    ))}
                    <td className="px-2 py-1.5">
                      <button
                        type="button"
                        onClick={() => setRows((r) => r.filter((_, idx) => idx !== i))}
                        className="text-xs text-ink-muted hover:text-fit-bad"
                        aria-label="Remove size row"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Preview fit
        </button>
      </form>

      {garment && (
        <section className="space-y-4 border-t border-line pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              {garment.brand} — {garment.name}
            </h2>
            <button
              onClick={() => {
                saveGarment(garment);
                setSavedNotice(true);
              }}
              className="rounded-md border border-line px-3 py-1.5 text-sm font-medium hover:bg-surface"
            >
              Save to my catalog
            </button>
          </div>
          {savedNotice && (
            <p className="text-xs text-fit-good">
              Saved —{" "}
              <Link href="/catalog" className="underline">
                view your catalog
              </Link>
              .
            </p>
          )}
          <ProfileGate>{(profile) => <FitResult garment={garment} profile={profile} />}</ProfileGate>
        </section>
      )}
    </div>
  );
}
