# Copiloto Comercial Inteligente — Smart Sales Copilot

Bilingual (ES/EN) AI-powered sales copilot: a client-facing chat widget plus an
agent dashboard with AI-generated reply suggestions, sentiment/intent
analysis, and live metrics.

## 1. Overview

Two-sided web platform, fully internationalized (Spanish/English):

- **Client widget**: a floating chat widget backed by Groq Cloud (Llama 3.x)
  for near-instant streaming responses.
- **Agent dashboard**: shows live chats, AI-generated reply suggestions,
  sentiment/intent extraction, and daily metrics charts.

All AI inference (Groq) and database access (Supabase) live in a **separate
backend service** — the frontend never holds those credentials. See
[Architecture](#2-architecture).

## 2. Architecture

```
apps/web (Next.js, no secrets)
  │
  ├─ tRPC (@trpc/client + @tanstack/react-query) ──► apps/backend /trpc
  │    dashboard queries: metrics, chat sessions, copilot suggestions
  │
  └─ plain HTTP streaming fetch (Vercel AI SDK useChat) ──► apps/backend /api/chat
       client chat widget streaming responses

apps/backend (Express + TypeScript, holds all secrets)
  ├─ /trpc      — typed queries/mutations, real-time subscriptions (planned)
  ├─ /api/chat  — Groq streaming endpoint (ai + @ai-sdk/groq)
  ├─ Supabase client (service role key) — chat persistence, realtime relay
  └─ Groq client (@ai-sdk/groq) — inference
```

`apps/web` imports `AppRouter`'s type only from `apps/backend` (npm workspace
devDependency), so tRPC calls stay end-to-end type-safe without bundling any
backend code or secrets into the frontend.

Realtime sync (client message → agent dashboard) will be implemented as tRPC
subscriptions over WebSocket in the backend, internally relaying Supabase
Realtime events — the frontend only ever talks to the backend.

## 3. Tech stack

| Layer | Technology | Notes |
| --- | --- | --- |
| Frontend framework | Next.js (App Router) | `apps/web` |
| Language | TypeScript | both apps |
| UI & styles | Tailwind CSS + shadcn/ui | manually configured (no interactive CLI) |
| i18n | `next-intl` | ES/EN, see [i18n notes](#5-important-nextjs-16-quirks-found-during-setup) |
| Backend framework | Express | `apps/backend` |
| API layer | tRPC | typed contract between web ⇄ backend |
| AI inference | Groq Cloud via `@ai-sdk/groq` + Vercel AI SDK (`ai`) | backend-only |
| Realtime | Supabase Realtime (`@supabase/supabase-js`) | backend-only, relayed via tRPC subscriptions |
| Charts | **D3.js** (not Recharts) | per project decision |
| Monorepo | npm workspaces | `apps/web`, `apps/backend` |

## 4. Scope / Out of scope

**In scope**: bilingual chat widget, agent dashboard with copilot suggestions,
sentiment/intent analysis, live metrics charts, realtime sync.

**Out of scope**: corporate OAuth/SSO (static session-simulation selector
instead), external CRM integrations, other channels (WhatsApp/Telegram),
heavy vector-DB RAG.

## 5. Important Next.js 16 quirks found during setup

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

## 6. Current status

- [x] Restructured into an npm-workspaces monorepo: `apps/web` + `apps/backend`
- [x] `apps/web` builds and lints cleanly (`npm run build -w web`, `npm run lint -w web`)
- [x] Leftover template code removed (old `projects` routes, FontAwesome,
      mock-data-backed homepage, MUI/Emotion deps)
- [x] `next-intl` i18n scaffolded and verified working for `/en` and `/es`
      (including the `proxy.ts` gotcha above)
- [x] shadcn/ui prerequisites installed and configured manually (`components.json`, `cn()` util)
- [x] `apps/backend` skeleton scaffolded: Express + tRPC router (stub
      procedures for metrics/sessions/suggestions) + stub `/api/chat` route +
      CORS, compiles cleanly (`npm run build -w backend`), verified responding
      on `/health` and `/trpc/metrics.getDaily`
- [x] No Groq/Supabase credentials anywhere under `apps/web`
- [ ] Real chat widget UI (client-facing)
- [ ] Real Groq streaming in `apps/backend` `/api/chat`, wired to `useChat`
- [ ] Agent dashboard UI (chat list, copilot suggestion panel)
- [ ] Real Supabase schema + persistence + realtime relay
- [ ] D3 metrics charts
- [ ] Sentiment/intent extraction via Groq

## 7. Next steps

1. Build the client chat widget UI (floating widget, typing indicator, quick
   replies) in `apps/web`, wired to `apps/backend`'s `/api/chat` via `useChat`.
2. Implement real Groq streaming in `apps/backend/src/chat/stream.ts` using
   `streamText` from `ai` + `groq` from `src/lib/groq.ts`.
3. Design the Supabase schema (chat sessions, messages, sentiment/intent
   fields) and wire `apps/backend/src/lib/supabase.ts` into the tRPC router's
   stub procedures.
4. Build the agent dashboard shell (chat list, copilot suggestion panel) in
   `apps/web`, consuming the tRPC client.
5. Implement realtime sync: tRPC subscription in `apps/backend` relaying
   Supabase Realtime chat events to the dashboard.
6. Add D3-based charts for daily volume / intent distribution on the dashboard.
7. Static session-simulation selector (agent identity) in place of real auth.
