import {
  BodyProfile,
  FitClass,
  FitPreference,
  Garment,
  GarmentCategory,
  GarmentCut,
  SizeFit,
  SizeRow,
  Zone,
  ZoneFit,
} from "@/lib/types";

// Ease band = [low, high] cm of garment room over the body measurement that
// reads as "true to size" for that cut. Below it reads tight, above it reads
// loose, each shading gradually rather than snapping at the edge.
const EASE_BANDS: Record<GarmentCut, Record<"chest" | "waist" | "hips", [number, number]>> = {
  fitted: { chest: [-2, 4], waist: [-2, 3], hips: [-2, 4] },
  regular: { chest: [4, 10], waist: [3, 8], hips: [4, 9] },
  relaxed: { chest: [10, 18], waist: [8, 16], hips: [9, 18] },
};

const LENGTH_BAND: [number, number] = [-1, 4];

// A snug preference is happiest with less room than the cut's band assumes;
// a relaxed preference wants more. Shifting the observed ease before
// classifying it re-centers "true to size" on the wearer, not just the cut.
const PREFERENCE_SHIFT: Record<FitPreference, number> = {
  snug: 2,
  "true-to-size": 0,
  relaxed: -2,
};

const SEVERITY: Record<FitClass, number> = {
  "true-to-size": 0,
  "relaxed-fit": 1,
  snug: 1,
  "too-loose": 2,
  "too-tight": 3,
};

const PENALTY: Record<FitClass, number> = {
  "true-to-size": 0,
  "relaxed-fit": 3,
  snug: 5,
  "too-loose": 20,
  "too-tight": 50,
};

const ZONE_WEIGHTS: Record<GarmentCategory, Partial<Record<Zone, number>>> = {
  top: { chest: 1, waist: 0.4 },
  outerwear: { chest: 1, waist: 0.3 },
  bottom: { waist: 1, hips: 0.8, length: 0.6 },
  dress: { chest: 0.8, waist: 0.6, hips: 0.8 },
};

function classify(adjustedEase: number, band: [number, number]): FitClass {
  const [lo, hi] = band;
  const span = Math.max(hi - lo, 1);
  if (adjustedEase < lo - span) return "too-tight";
  if (adjustedEase < lo) return "snug";
  if (adjustedEase <= hi) return "true-to-size";
  if (adjustedEase <= hi + span) return "relaxed-fit";
  return "too-loose";
}

function worstClass(classes: FitClass[]): FitClass {
  return classes.reduce((worst, c) => (SEVERITY[c] > SEVERITY[worst] ? c : worst), "true-to-size" as FitClass);
}

function zoneBodyValue(profile: BodyProfile, zone: Zone): number | undefined {
  switch (zone) {
    case "chest":
      return profile.chestCm;
    case "waist":
      return profile.waistCm;
    case "hips":
      return profile.hipsCm;
    case "length":
      return profile.inseamCm;
  }
}

function zoneGarmentValue(row: SizeRow, zone: Zone): number | undefined {
  switch (zone) {
    case "chest":
      return row.chestCm;
    case "waist":
      return row.waistCm;
    case "hips":
      return row.hipsCm;
    case "length":
      return row.lengthCm;
  }
}

function zoneBand(garment: Garment, zone: Zone): [number, number] {
  if (zone === "length") return LENGTH_BAND;
  return EASE_BANDS[garment.cut][zone];
}

export function computeSizeFit(
  garment: Garment,
  row: SizeRow,
  profile: BodyProfile
): SizeFit {
  const weights = ZONE_WEIGHTS[garment.category];
  const shift = PREFERENCE_SHIFT[profile.fitPreference];
  const zones: ZoneFit[] = [];
  let score = 0;

  for (const [zone, weight] of Object.entries(weights) as [Zone, number][]) {
    const bodyCm = zoneBodyValue(profile, zone);
    const garmentCm = zoneGarmentValue(row, zone);
    if (bodyCm === undefined || garmentCm === undefined) continue;

    const easeCm = garmentCm - bodyCm;
    const band = zoneBand(garment, zone);
    const adjustedEase = zone === "length" ? easeCm : easeCm + shift;
    const fitClass = classify(adjustedEase, band);
    zones.push({ zone, bodyCm, garmentCm, easeCm, fitClass });

    const [lo, hi] = band;
    const center = (lo + hi) / 2;
    score += weight * (Math.abs(adjustedEase - center) + PENALTY[fitClass]);
  }

  return {
    size: row.size,
    zones,
    overall: zones.length > 0 ? worstClass(zones.map((z) => z.fitClass)) : "true-to-size",
    score,
  };
}

export function computeFit(garment: Garment, profile: BodyProfile): SizeFit[] {
  return garment.sizeChart.map((row) => computeSizeFit(garment, row, profile));
}

export function recommendSize(fits: SizeFit[]): SizeFit | undefined {
  if (fits.length === 0) return undefined;
  return [...fits].sort((a, b) => a.score - b.score)[0];
}

export const FIT_CLASS_LABEL: Record<FitClass, string> = {
  "too-tight": "Too tight",
  snug: "Snug",
  "true-to-size": "True to size",
  "relaxed-fit": "Relaxed fit",
  "too-loose": "Too loose",
};

// The "length" zone compares garment inseam to body inseam, where "tight"
// and "loose" don't read naturally — use length-specific wording instead.
const LENGTH_CLASS_LABEL: Record<FitClass, string> = {
  "too-tight": "Too short",
  snug: "Runs short",
  "true-to-size": "Good length",
  "relaxed-fit": "Runs long",
  "too-loose": "Too long",
};

export function fitClassLabel(fitClass: FitClass, zone: Zone): string {
  return zone === "length" ? LENGTH_CLASS_LABEL[fitClass] : FIT_CLASS_LABEL[fitClass];
}

export const FIT_CLASS_COLOR: Record<FitClass, string> = {
  "too-tight": "var(--fit-bad)",
  snug: "var(--fit-warn)",
  "true-to-size": "var(--fit-good)",
  "relaxed-fit": "var(--fit-warn)",
  "too-loose": "var(--fit-bad)",
};

export const ZONE_LABEL: Record<Zone, string> = {
  chest: "Chest",
  waist: "Waist",
  hips: "Hips",
  length: "Inseam",
};
