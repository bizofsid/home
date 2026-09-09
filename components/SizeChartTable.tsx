import { Garment } from "@/lib/types";

const COLUMNS: { key: "chestCm" | "waistCm" | "hipsCm" | "lengthCm"; label: string }[] = [
  { key: "chestCm", label: "Chest" },
  { key: "waistCm", label: "Waist" },
  { key: "hipsCm", label: "Hips" },
  { key: "lengthCm", label: "Length" },
];

export default function SizeChartTable({ garment }: { garment: Garment }) {
  const columns = COLUMNS.map((c) =>
    c.key === "lengthCm" && garment.category === "bottom" ? { ...c, label: "Inseam" } : c
  ).filter((c) => garment.sizeChart.some((row) => row[c.key] !== undefined));

  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[24rem] text-sm">
        <thead>
          <tr className="border-b border-line bg-surface text-left text-xs uppercase tracking-wide text-ink-muted">
            <th className="px-3 py-2">Size</th>
            {columns.map((c) => (
              <th key={c.key} className="px-3 py-2">
                {c.label} (cm)
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {garment.sizeChart.map((row) => (
            <tr key={row.size} className="border-b border-line last:border-0">
              <td className="px-3 py-2 font-medium">{row.size}</td>
              {columns.map((c) => (
                <td key={c.key} className="px-3 py-2 tabular-nums text-ink-secondary">
                  {row[c.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
