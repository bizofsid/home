import { FIT_CLASS_COLOR } from "@/lib/fit";
import { GarmentCategory, Zone, ZoneFit } from "@/lib/types";

// Fraction of the garment's height each zone band occupies, top to bottom.
const BANDS: Record<GarmentCategory, { zone: Zone; from: number; to: number }[]> = {
  top: [
    { zone: "chest", from: 0, to: 0.55 },
    { zone: "waist", from: 0.55, to: 1 },
  ],
  outerwear: [
    { zone: "chest", from: 0, to: 0.55 },
    { zone: "waist", from: 0.55, to: 1 },
  ],
  dress: [
    { zone: "chest", from: 0, to: 0.3 },
    { zone: "waist", from: 0.3, to: 0.55 },
    { zone: "hips", from: 0.55, to: 1 },
  ],
  bottom: [
    { zone: "waist", from: 0, to: 0.18 },
    { zone: "hips", from: 0.18, to: 0.45 },
    { zone: "length", from: 0.45, to: 1 },
  ],
};

const OUTLINE: Record<GarmentCategory, { viewBox: string; path: string }> = {
  top: {
    viewBox: "0 0 100 120",
    path: "M35 6 L50 16 L65 6 L88 22 L76 38 L68 32 L68 108 L32 108 L32 32 L24 38 L12 22 Z",
  },
  outerwear: {
    viewBox: "0 0 100 120",
    path: "M35 6 L50 16 L65 6 L90 24 L78 40 L68 32 L68 108 L32 108 L32 32 L22 40 L10 24 Z",
  },
  dress: {
    viewBox: "0 0 100 130",
    path: "M38 6 L50 14 L62 6 L70 30 L84 118 L16 118 L30 30 Z",
  },
  bottom: {
    viewBox: "0 0 100 140",
    path: "M28 6 L72 6 L76 60 L58 60 L54 134 L44 134 L42 60 L24 60 Z M42 60 L36 60 L38 134 L46 134 L48 60 Z",
  },
};

function zoneColor(zones: ZoneFit[], zone: Zone): string {
  const match = zones.find((z) => z.zone === zone);
  return match ? FIT_CLASS_COLOR[match.fitClass] : "var(--line)";
}

export default function FitSilhouette({
  category,
  zones,
}: {
  category: GarmentCategory;
  zones: ZoneFit[];
}) {
  const { viewBox, path } = OUTLINE[category];
  const [, , , heightStr] = viewBox.split(" ");
  const height = Number(heightStr);
  const bands = BANDS[category];
  const clipId = `garment-clip-${category}`;

  return (
    <svg viewBox={viewBox} className="mx-auto h-48 w-auto" aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        {bands.map((band) => (
          <rect
            key={band.zone}
            x={0}
            y={band.from * height}
            width={100}
            height={(band.to - band.from) * height}
            fill={zoneColor(zones, band.zone)}
          />
        ))}
      </g>
      <path d={path} fill="none" stroke="var(--ink)" strokeOpacity={0.15} strokeWidth={1.5} />
    </svg>
  );
}
