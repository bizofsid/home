import { useSyncExternalStore } from "react";
import { BodyProfile, Garment } from "@/lib/types";

const PROFILE_KEY = "fitpreview.profile.v1";
const SAVED_GARMENTS_KEY = "fitpreview.saved-garments.v1";

const listeners = new Set<() => void>();
const cache = new Map<string, { raw: string | null; value: unknown }>();

function emitChange(): void {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

// Returns a cached, referentially-stable value unless the underlying raw
// localStorage string actually changed, so useSyncExternalStore doesn't spin.
function readCached<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // ignore — treat as empty
  }
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;

  let value = fallback;
  if (raw) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  cache.set(key, { raw, value });
  return value;
}

function write<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable (private browsing, quota) — fail silently.
  }
  emitChange();
}

function remove(key: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
  emitChange();
}

export function getProfile(): BodyProfile | null {
  return readCached<BodyProfile | null>(PROFILE_KEY, null);
}

export function useProfile(): BodyProfile | null {
  return useSyncExternalStore(
    subscribe,
    () => getProfile(),
    () => null
  );
}

export function saveProfile(profile: BodyProfile): void {
  write(PROFILE_KEY, profile);
}

export function clearProfile(): void {
  remove(PROFILE_KEY);
}

export function getSavedGarments(): Garment[] {
  return readCached<Garment[]>(SAVED_GARMENTS_KEY, []);
}

export function useSavedGarments(): Garment[] {
  return useSyncExternalStore(
    subscribe,
    () => getSavedGarments(),
    () => []
  );
}

export function saveGarment(garment: Garment): void {
  const existing = getSavedGarments().filter((g) => g.id !== garment.id);
  write(SAVED_GARMENTS_KEY, [garment, ...existing]);
}

export function removeSavedGarment(id: string): void {
  write(
    SAVED_GARMENTS_KEY,
    getSavedGarments().filter((g) => g.id !== id)
  );
}
