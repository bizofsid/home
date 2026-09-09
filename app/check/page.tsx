import CheckForm from "@/components/CheckForm";

export default function CheckPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Check a size chart</h1>
      <p className="mt-2 text-sm text-ink-secondary">
        About to order something? Copy the retailer&apos;s size chart in here
        and see how each size is likely to fit before you buy.
      </p>
      <div className="mt-6">
        <CheckForm />
      </div>
    </div>
  );
}
