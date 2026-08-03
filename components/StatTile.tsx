export default function StatTile({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption?: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface px-4 py-3">
      <div className="text-xs font-medium text-ink-muted uppercase tracking-wide">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
      {caption && <div className="mt-1 text-xs text-ink-secondary">{caption}</div>}
    </div>
  );
}
