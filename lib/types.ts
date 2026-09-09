export type FitPreference = "snug" | "true-to-size" | "relaxed";

export interface BodyProfile {
  heightCm: number;
  chestCm: number;
  waistCm: number;
  hipsCm: number;
  inseamCm: number;
  fitPreference: FitPreference;
}

export type GarmentCategory = "top" | "bottom" | "dress" | "outerwear";
export type GarmentCut = "fitted" | "regular" | "relaxed";

export interface SizeRow {
  size: string;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  lengthCm?: number;
}

export interface Garment {
  id: string;
  brand: string;
  name: string;
  category: GarmentCategory;
  cut: GarmentCut;
  sizeChart: SizeRow[];
  notes?: string;
}

export type Zone = "chest" | "waist" | "hips" | "length";

export type FitClass =
  | "too-tight"
  | "snug"
  | "true-to-size"
  | "relaxed-fit"
  | "too-loose";

export interface ZoneFit {
  zone: Zone;
  bodyCm: number;
  garmentCm: number;
  easeCm: number;
  fitClass: FitClass;
}

export interface SizeFit {
  size: string;
  zones: ZoneFit[];
  overall: FitClass;
  score: number;
}
