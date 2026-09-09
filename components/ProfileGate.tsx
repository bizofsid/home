"use client";

import Link from "next/link";
import { useProfile } from "@/lib/storage";
import { BodyProfile } from "@/lib/types";

export default function ProfileGate({
  children,
}: {
  children: (profile: BodyProfile) => React.ReactNode;
}) {
  const profile = useProfile();

  if (!profile) {
    return (
      <div className="rounded-lg border border-dashed border-line px-4 py-6 text-center">
        <p className="text-sm text-ink-secondary">
          Set up your measurements to see a personal fit preview.
        </p>
        <Link
          href="/profile"
          className="mt-3 inline-block rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Set up your profile
        </Link>
      </div>
    );
  }

  return <>{children(profile)}</>;
}
