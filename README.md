# 💸 Devonport Dollar Flow

A local-business network for Devonport, Auckland, built on one idea: money
that recirculates inside the community does more good than money that leaves
on the first trip out. This app tracks purchases, scores each business by how
much of its revenue it respends locally, and points spending toward whoever
keeps dollars circulating longest.

## How it works

- **Directory** — every business in the network, searchable and filterable.
- **Flow score** — each business self-reports the % of revenue it respends
  with other Devonport businesses. That feeds a simplified [Local Multiplier
  3](https://neweconomics.org/) calculation: `1 + r + r²`, estimating how many
  times a dollar recirculates locally before it leaves.
- **Recommend** — pick a category, get businesses ranked by flow score, with
  the local supply chain it likely flows to next.
- **Network graph** — a live map of who buys from whom locally.
- **Log a purchase / Join the network** — no accounts, no verification. This
  is built for a community where trust is already high; the flow score only
  means something if people are honest about it.

The starter directory (~18 businesses) is hand-written sample data clearly
marked as seed data, not scraped real listings — the network is meant to grow
from real Devonport businesses joining themselves.

## Getting Started

Requires Node.js 18+.

```bash
git clone https://github.com/bizofsid/home.git
cd home
git checkout claude/devonport-dollar-flow-app-ds2dfe
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Data is stored in Supabase (Postgres) and shared across everyone using the
app — the client connects with a public, RLS-protected key checked into
`lib/supabase.ts`, so no `.env` setup is required to run it locally. Row-level
security allows public read/insert on `businesses`, `business_suppliers` and
`purchases`, and denies update/delete — matching the trust-based, no-auth
design.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS,
  built as a static export (`output: "export"`) for GitHub Pages
- [Supabase](https://supabase.com) (Postgres) for shared directory/purchase
  data, queried directly from the browser
