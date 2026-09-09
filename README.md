# 👕 Fit Preview

Ordering clothes online is a guess — sizes vary by brand, and the only
feedback loop is a parcel that doesn't fit. Fit Preview closes that loop
before you buy: enter your body measurements once, then check any
retailer's size chart against them for a zone-by-zone preview of how each
size will actually sit.

## How it works

- **Your measurements** — height, chest/bust, waist, hips, and inseam, plus
  how snug you like clothes to fit. Saved only in `localStorage`; nothing is
  ever sent anywhere.
- **Check a size chart** — paste in a brand's size chart (chest/waist/hips/
  length per size) and get an instant, size-by-size fit preview: a
  recommended size, a garment-shaped diagram colored by zone, and a
  too-tight ↔ too-loose reading for chest, waist, hips, and length.
- **Catalog** — a handful of hand-written example garments to try the tool
  on, plus anything you've checked and chosen to save for later.

The fit model estimates "ease" (garment measurement minus body measurement)
per zone and classifies it against what a fitted, regular, or relaxed cut
is expected to allow, shifted by your stated fit preference. It's a
heuristic based on the numbers you give it — not a guarantee, and no
substitute for a brand's own fit notes when they're more specific.

## Getting Started

Requires Node.js 20.9+.

```bash
git clone https://github.com/bizofsid/home.git
cd home
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS,
  built as a static export (`output: "export"`) for GitHub Pages
- No backend, no accounts — all state (your measurements, saved garments)
  lives in the browser's `localStorage`
