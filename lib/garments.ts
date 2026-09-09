import { Garment } from "@/lib/types";

// Illustrative example size charts, hand-written for this demo — not scraped
// from any retailer. Use "Check a size chart" to preview fit against a real
// chart before you order.
export const SEED_GARMENTS: Garment[] = [
  {
    id: "everyday-tee",
    brand: "Fieldstone",
    name: "Everyday Cotton Tee",
    category: "top",
    cut: "regular",
    sizeChart: [
      { size: "S", chestCm: 96, lengthCm: 68 },
      { size: "M", chestCm: 104, lengthCm: 70 },
      { size: "L", chestCm: 112, lengthCm: 72 },
      { size: "XL", chestCm: 120, lengthCm: 74 },
    ],
    notes: "Midweight jersey, straight hem.",
  },
  {
    id: "slim-oxford",
    brand: "Kepler & Vane",
    name: "Slim Oxford Shirt",
    category: "top",
    cut: "fitted",
    sizeChart: [
      { size: "S", chestCm: 92, waistCm: 84, lengthCm: 71 },
      { size: "M", chestCm: 98, waistCm: 90, lengthCm: 73 },
      { size: "L", chestCm: 104, waistCm: 96, lengthCm: 75 },
      { size: "XL", chestCm: 112, waistCm: 104, lengthCm: 77 },
    ],
    notes: "Tapered through the body — sizes small if you're between sizes.",
  },
  {
    id: "boxy-overshirt",
    brand: "Fieldstone",
    name: "Boxy Overshirt",
    category: "top",
    cut: "relaxed",
    sizeChart: [
      { size: "S", chestCm: 110, lengthCm: 72 },
      { size: "M", chestCm: 118, lengthCm: 74 },
      { size: "L", chestCm: 126, lengthCm: 76 },
      { size: "XL", chestCm: 134, lengthCm: 78 },
    ],
    notes: "Dropped shoulder, meant to be worn oversized.",
  },
  {
    id: "straight-jeans",
    brand: "Harbourline Denim",
    name: "Straight Leg Jeans",
    category: "bottom",
    cut: "regular",
    sizeChart: [
      { size: "28", waistCm: 74, hipsCm: 96, lengthCm: 80 },
      { size: "30", waistCm: 79, hipsCm: 101, lengthCm: 81 },
      { size: "32", waistCm: 84, hipsCm: 106, lengthCm: 82 },
      { size: "34", waistCm: 89, hipsCm: 111, lengthCm: 82 },
      { size: "36", waistCm: 94, hipsCm: 116, lengthCm: 83 },
    ],
    notes: "Mid rise, straight through the leg.",
  },
  {
    id: "tailored-trouser",
    brand: "Kepler & Vane",
    name: "Tailored Trouser",
    category: "bottom",
    cut: "fitted",
    sizeChart: [
      { size: "28", waistCm: 72, hipsCm: 92, lengthCm: 79 },
      { size: "30", waistCm: 77, hipsCm: 97, lengthCm: 80 },
      { size: "32", waistCm: 82, hipsCm: 102, lengthCm: 80 },
      { size: "34", waistCm: 87, hipsCm: 107, lengthCm: 81 },
    ],
    notes: "Sits close through the waist and hip, tapered leg.",
  },
  {
    id: "relaxed-cargo",
    brand: "Northface Trail Co.",
    name: "Relaxed Cargo Pant",
    category: "bottom",
    cut: "relaxed",
    sizeChart: [
      { size: "S", waistCm: 78, hipsCm: 104, lengthCm: 78 },
      { size: "M", waistCm: 84, hipsCm: 110, lengthCm: 79 },
      { size: "L", waistCm: 92, hipsCm: 118, lengthCm: 80 },
      { size: "XL", waistCm: 100, hipsCm: 126, lengthCm: 81 },
    ],
    notes: "Room through the seat and thigh by design.",
  },
  {
    id: "wrap-dress",
    brand: "Marlow & Co.",
    name: "Wrap Midi Dress",
    category: "dress",
    cut: "regular",
    sizeChart: [
      { size: "XS", chestCm: 88, waistCm: 72, hipsCm: 96 },
      { size: "S", chestCm: 93, waistCm: 77, hipsCm: 101 },
      { size: "M", chestCm: 99, waistCm: 83, hipsCm: 107 },
      { size: "L", chestCm: 106, waistCm: 90, hipsCm: 114 },
      { size: "XL", chestCm: 114, waistCm: 98, hipsCm: 122 },
    ],
    notes: "Wrap front adjusts a little at the waist.",
  },
  {
    id: "shell-jacket",
    brand: "Northface Trail Co.",
    name: "Packable Shell Jacket",
    category: "outerwear",
    cut: "relaxed",
    sizeChart: [
      { size: "S", chestCm: 112, lengthCm: 70 },
      { size: "M", chestCm: 120, lengthCm: 72 },
      { size: "L", chestCm: 128, lengthCm: 74 },
      { size: "XL", chestCm: 136, lengthCm: 76 },
    ],
    notes: "Cut to layer over a jumper.",
  },
];

export function getSeedGarment(id: string): Garment | undefined {
  return SEED_GARMENTS.find((g) => g.id === id);
}
