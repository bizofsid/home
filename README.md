# ✈️ Itinerant — AI Travel Planner

Plan trips with an AI assistant, keep every conversation, and search across
your full chat history. Built with Next.js, Tailwind, and the Claude API.

## Features

- **AI trip planning chat** — streaming, day-by-day itineraries with costs and local tips
- **Chat history search** — full-text search across all your past conversations from the sidebar
- **Multiple sessions** — create, switch, and delete trip plans; everything persists in your browser

## Getting Started

Requires Node.js 18+ and an Anthropic API key
([get one here](https://console.anthropic.com) — the account needs credits).

```bash
git clone https://github.com/bizofsid/home.git
cd home
git checkout claude/search-chat-itinerant-app-z9fkz2
npm install
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and start planning.

## Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript + Tailwind CSS
- [`@anthropic-ai/sdk`](https://docs.claude.com) for streaming chat (`claude-sonnet-4-6`)
- `react-markdown` + `remark-gfm` for rendering itineraries
- Chat sessions stored in `localStorage` — no database needed
