export default function CategoryBadge({ category }: { category: string }) {
  return (
    <span className="inline-block rounded-full border border-line px-2 py-0.5 text-xs text-ink-secondary">
      {category}
    </span>
  );
}
