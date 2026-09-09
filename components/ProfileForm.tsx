"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProfile, useProfile } from "@/lib/storage";
import { BodyProfile, FitPreference } from "@/lib/types";

const EMPTY: BodyProfile = {
  heightCm: 170,
  chestCm: 96,
  waistCm: 82,
  hipsCm: 100,
  inseamCm: 80,
  fitPreference: "true-to-size",
};

const FIELDS: { key: keyof Omit<BodyProfile, "fitPreference">; label: string; hint: string }[] = [
  { key: "heightCm", label: "Height", hint: "Standing, no shoes." },
  { key: "chestCm", label: "Chest / bust", hint: "Around the fullest part, tape level." },
  { key: "waistCm", label: "Waist", hint: "Around the narrowest point, usually just above the navel." },
  { key: "hipsCm", label: "Hips", hint: "Around the fullest part of your seat." },
  { key: "inseamCm", label: "Inseam", hint: "Crotch to ankle bone, down the inside of the leg." },
];

export default function ProfileForm() {
  // Keying on whether a stored profile has loaded forces a remount once it
  // arrives, so the inner form's initial state can seed from it directly
  // instead of syncing local state from an effect.
  const stored = useProfile();
  return <ProfileFields key={stored ? "loaded" : "empty"} initial={stored ?? EMPTY} />;
}

function ProfileFields({ initial }: { initial: BodyProfile }) {
  const router = useRouter();
  const [profile, setProfile] = useState<BodyProfile>(initial);
  const [saved, setSaved] = useState(false);

  function update<K extends keyof BodyProfile>(key: K, value: BodyProfile[K]) {
    setSaved(false);
    setProfile((p) => ({ ...p, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveProfile(profile);
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <div key={field.key}>
            <label className="block text-sm font-medium" htmlFor={field.key}>
              {field.label} (cm)
            </label>
            <input
              id={field.key}
              type="number"
              min={0}
              max={300}
              required
              value={profile[field.key]}
              onChange={(e) => update(field.key, Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-line bg-page px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-ink-muted">{field.hint}</p>
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium" htmlFor="fitPreference">
          How do you like clothes to fit?
        </label>
        <select
          id="fitPreference"
          value={profile.fitPreference}
          onChange={(e) => update("fitPreference", e.target.value as FitPreference)}
          className="mt-1 w-full max-w-xs rounded-md border border-line bg-page px-3 py-2 text-sm"
        >
          <option value="snug">Snug — close to the body</option>
          <option value="true-to-size">True to size — standard room</option>
          <option value="relaxed">Relaxed — room to spare</option>
        </select>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white"
        >
          Save profile
        </button>
        {saved && (
          <button
            type="button"
            onClick={() => router.push("/catalog")}
            className="text-sm font-medium text-accent underline"
          >
            Saved — browse the catalog →
          </button>
        )}
      </div>
    </form>
  );
}
