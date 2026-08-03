import Link from "next/link";
import { Business } from "@/lib/types";
import { flowScore } from "@/lib/flow";
import CategoryBadge from "./CategoryBadge";
import FlowBar from "./FlowBar";

export default function BusinessCard({ business }: { business: Business }) {
  return (
    <Link
      href={`/business?id=${business.id}`}
      className="block rounded-lg border border-line bg-surface p-4 hover:border-accent"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{business.name}</h3>
        <CategoryBadge category={business.category} />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-ink-secondary">
        {business.description}
      </p>
      <div className="mt-3">
        <FlowBar score={flowScore(business)} />
      </div>
    </Link>
  );
}
