# Copiloto Comercial Inteligente — WMS AI Copilot

A single-conversation AI copilot for a warehouse admin: a chat interface where
the AI answers questions about inventory and sales by calling typed tool
functions against a Supabase database, responding with text, tables, or
charts as appropriate.

## 1. Overview

One user role (the warehouse admin), one conversation, one AI. The admin asks
natural-language questions like:

- "What's our stock of SKU-123?"
- "What are the top 5 selling products this month?"
- "Which products are below their reorder threshold?"

The AI (Groq Cloud, Llama 3.x) uses **function calling** against a small,
fixed set of backend tools to fetch real data — it never writes raw SQL
against the database. Depending on the question, the response renders as
plain text, a table, or a D3 chart.

This project pivoted from an earlier two-sided "sales copilot" concept
(client chat widget + agent dashboard with realtime sync). That scope was
larger than needed for a portfolio piece and split attention across two
roles; the WMS copilot keeps the same tech stack and AI-chat foundation but
narrows to one clear, demoable interaction.

## 2. Architecture

```
apps/web (Next.js, no secrets)
  └─ plain HTTP streaming fetch (Vercel AI SDK useChat) ──► apps/backend /api/chat
       renders AI responses: text, table, or D3 chart depending on tool output shape

apps/backend (Express + TypeScript, holds all secrets)
  ├─ /api/chat  — Groq streaming endpoint (ai + @ai-sdk/groq), with tool-calling
  ├─ tools/     — fixed, typed functions the AI can call:
  │     - getStock(sku)
  │     - getTopSellingProducts(n, periodDays)
  │     - getLowStockItems(thresholdOverride?)
  │     - getStockHistory(sku, days)          (stretch goal, for trend charts)
  ├─ Supabase client (service role key) — read-only access to warehouse schema
  └─ Groq client (@ai-sdk/groq) — inference + tool-call orchestration
```

`apps/web` never talks to Supabase or Groq directly — it only streams chat
responses from `apps/backend`. The tRPC scaffold from the earlier direction
is kept in place (`apps/backend/src/trpc`) but is no longer the primary API
surface; `/api/chat` is. tRPC procedures are not required for the WMS copilot
MVP and can be removed or repurposed later (e.g. a small "raw data" admin
view) rather than actively developed against.

Tool calls are the trust boundary: the AI cannot execute arbitrary SQL, only
the specific, parameterized read operations exposed as tools. This keeps the
data surface small and predictable, which matters for a portfolio project
where the correctness of "what the AI is allowed to do" should be obvious at
a glance.

## 3. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend framework | Next.js (App Router) | `apps/web` |
| Language | TypeScript | both apps |
| UI & styles | Tailwind CSS + shadcn/ui | manually configured (no interactive CLI) |
| i18n | `next-intl` | ES/EN, already scaffolded; not the focus of this pivot |
| Backend framework | Express | `apps/backend` |
| AI inference | Groq Cloud via `@ai-sdk/groq` + Vercel AI SDK (`ai`) | backend-only, with tool/function calling |
| Database | Supabase (Postgres) | warehouse schema: products, inventory, orders |
| Charts | **D3.js** (not Recharts) | per project decision |
| Monorepo | npm workspaces | `apps/web`, `apps/backend` |

## 4. Data model (planned)

Small, realistic seed dataset — enough for meaningful "top sellers" and
trend charts without heavy seeding effort:

- **products** — id, sku, name, category, price, reorder_threshold
- **inventory** — product_id, quantity_on_hand, warehouse_location (optional)
- **orders** / **order_items** — synthetic sales history over the last few
  months (~20-50 products, a few hundred orders) so aggregate queries
  (top sellers, trends) return non-trivial results

Seeded via a script, not entered by hand. No real customer or business data.

Schema: `apps/backend/supabase/schema.sql`. Seed script:
`apps/backend/scripts/seed.ts` (`npm run seed -w backend`).

## 5. Scope / Out of scope

**In scope**: one chat conversation (admin ⇄ AI), fixed tool-calling functions
for stock/sales lookups, text/table/chart rendering based on tool output,
seeded warehouse dataset.

**Out of scope**: multi-user roles, realtime sync, client-facing chat widget,
sentiment/intent analysis, agent dashboard, corporate OAuth/SSO, external
CRM/ERP integrations, other channels (WhatsApp/Telegram), AI-generated raw
SQL, heavy vector-DB RAG.

## 6. Important Next.js 16 quirks found during setup

This Next.js version (16.2.7) is newer than typical training data and has
breaking changes from the "classic" App Router conventions — see
`apps/web/AGENTS.md`. Two bit us during setup:

- **`middleware.ts` is deprecated and renamed to `proxy.ts`.** The old
  filename is silently ignored in dev/build (no error, it just never runs) —
  `next-intl`'s `createMiddleware` must be exported as `export const proxy = createMiddleware(routing)` from `proxy.ts`, not `middleware.ts`.
- **File location follows `src/`.** Since `app/` lives at `src/app/`, `proxy.ts`
  must live at `src/proxy.ts`, not the package root — Next.js only looks for
  it "at the same level as `app`".

If `next build`/`next dev` ever seem to ignore proxy/middleware logic again on
a future Next.js upgrade, check `node_modules/next/dist/docs/01-app` first for
renamed conventions before assuming the code is wrong.

## 7. Local setup

```bash
npm install                              # from repo root, installs both workspaces
cp apps/backend/.env.example apps/backend/.env      # fill in GROQ_API_KEY
cp apps/web/.env.local.example apps/web/.env.local  # NEXT_PUBLIC_BACKEND_URL only

npm run dev            # runs both apps/web (3000) and apps/backend (4000) via concurrently
npm run dev:web        # web only
npm run dev:backend    # backend only
```

Backend-only env vars (`GROQ_API_KEY`, `SUPABASE_*`) must never be added to
`apps/web`'s env files — that's the whole point of the split.

Note on `apps/backend`'s TypeScript config: it uses `moduleResolution: NodeNext`,
which requires explicit `.js` extensions on relative imports even though the
source files are `.ts` (e.g. `import { appRouter } from './trpc/router.js'`).
Easy to forget when adding new backend files.

## 8. Current status

- [x] Restructured into an npm-workspaces monorepo: `apps/web` + `apps/backend`
- [x] `apps/web` builds and lints cleanly (`npm run build -w web`, `npm run lint -w web`)
- [x] Leftover template code removed (old `projects` routes, FontAwesome,
      mock-data-backed homepage, MUI/Emotion deps)
- [x] `next-intl` i18n scaffolded and verified working for `/en` and `/es`
      (including the `proxy.ts` gotcha above)
- [x] shadcn/ui prerequisites installed and configured manually (`components.json`, `cn()` util)
- [x] `apps/backend` skeleton scaffolded: Express + tRPC router (stub
      procedures, no longer the active API surface) + stub `/api/chat` route +
      CORS, compiles cleanly (`npm run build -w backend`), verified responding
      on `/health` and `/trpc/metrics.getDaily`
- [x] No Groq/Supabase credentials anywhere under `apps/web`
- [ ] No real `.env`/`.env.local` files created yet — only the `.example`
      templates exist; nothing runs against real Groq/Supabase credentials yet
- [ ] No shadcn/ui components installed yet — `components.json` exists but
      `src/components/ui/` is empty
- [x] Supabase warehouse schema written (`apps/backend/supabase/schema.sql`):
      products, inventory, orders, order_items — not yet applied to a real
      Supabase project
- [x] Seed script written (`apps/backend/scripts/seed.ts`, `npm run seed -w backend`):
      ~30 products across 5 categories, 300 synthetic orders over 90 days,
      skewed toward a "best sellers" subset, ~20% of products seeded below
      reorder threshold — not yet run against a real project
- [ ] Fixed tool functions (`getStock`, `getTopSellingProducts`,
      `getLowStockItems`) not implemented
- [ ] Real Groq streaming + tool-calling in `apps/backend` `/api/chat` not
      implemented (currently a stub)
- [ ] Chat UI in `apps/web` not built (currently no chat surface at all)
- [ ] Text/table/chart response rendering in `apps/web` not built
- [ ] D3 chart components not built

## 9. Next steps

1. Create a real Supabase project (if not already), run
   `apps/backend/supabase/schema.sql` against it, fill in `apps/backend/.env`,
   then run `npm run seed -w backend`.
2. Implement the fixed tool functions in `apps/backend` (`getStock`,
   `getTopSellingProducts`, `getLowStockItems`) against that schema.
3. Wire real Groq streaming + tool-calling into `apps/backend/src/chat/stream.ts`,
   using `streamText`/tool definitions from the `ai` SDK.
4. Build the chat UI in `apps/web` (single conversation, no widget/dashboard
   split), wired to `/api/chat` via `useChat`.
5. Add response rendering logic in `apps/web`: inspect tool-call output shape
   and render text, a table, or a D3 chart accordingly.
6. (Stretch) Add `getStockHistory` tool + trend chart once the core loop
   works end-to-end.
