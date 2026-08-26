# WMS AI Copilot

AI copilot for a warehouse admin: a single chat interface that answers
natural-language questions about inventory and sales by calling typed tools
against a Supabase database, rendering responses as text, tables, or charts.

## Try it online

**https://your-deployment-url.example.com**

Just open the link and start asking questions — no account or setup needed.
Try things like:

- "What's our stock of SKU-123?"
- "What are the top 5 selling products this month?"
- "Which products are below their reorder threshold?"

## Features

- **Natural-language warehouse queries** — ask about stock levels, sales,
  and reorder status in plain English or Spanish (i18n via `next-intl`).
- **Tool-calling, not raw SQL** — the AI can only call a small, fixed set of
  typed backend functions (`getStock`, `getTopSellingProducts`,
  `getLowStockItems`, `getStockHistory`), keeping the data surface small and
  auditable.
- **Adaptive response rendering** — replies render as plain text, a sortable
  data table, or a D3.js chart depending on what the underlying tool
  returns.
- **Live data browser** — Products, Inventory, Orders, and Order Items
  tables with sorting, product-name resolution, and a resizable AI copilot
  sidebar alongside them.
- **Streaming responses** — chat replies stream token-by-token via the
  Vercel AI SDK.
- **Realistic seeded dataset** — ~30 products across 5 categories and 300
  synthetic orders over 90 days, skewed toward best sellers with a subset
  seeded below reorder threshold.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| i18n | next-intl (English / Spanish) |
| Data fetching | TanStack Query + TanStack Table |
| Backend | Express, TypeScript |
| AI inference | Groq Cloud (Llama 3.x) via `@ai-sdk/groq` + Vercel AI SDK |
| Database | Supabase (Postgres) |
| Charts | D3.js |
| Monorepo | npm workspaces (`apps/web`, `apps/backend`) |
| Testing | Jest |

## Architecture

```
apps/web (Next.js, no secrets)
  └─ streaming chat (useChat) ──► apps/backend /api/chat
       renders responses as text, table, or D3 chart

apps/backend (Express + TypeScript, holds all secrets)
  ├─ /api/chat — Groq streaming endpoint with tool-calling
  ├─ tools/    — fixed, typed functions the AI can call
  ├─ Supabase client (service role, read-only)
  └─ Groq client — inference + tool-call orchestration
```

`apps/web` never talks to Supabase or Groq directly; it only streams chat
responses from `apps/backend`. Tool calls are the trust boundary — the AI
can execute only the specific, parameterized read operations exposed as
tools, never arbitrary SQL.

See [`SPEC.md`](./SPEC.md) for full project scope and design decisions.
