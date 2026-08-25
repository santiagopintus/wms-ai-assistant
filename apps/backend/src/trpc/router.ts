import { initTRPC } from '@trpc/server';
import { z } from 'zod';
import type { Context } from './context.js';

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const appRouter = router({
  metrics: router({
    // Stub: daily chat volume + intent distribution for the dashboard charts.
    // Real implementation will query Supabase.
    getDaily: publicProcedure.query(() => ({
      volumeByHour: [] as { hour: number; count: number }[],
      intentDistribution: [] as { intent: string; count: number }[],
    })),
  }),
  chat: router({
    // Stub: list of active chat sessions for the agent dashboard.
    listSessions: publicProcedure.query(() => ({
      sessions: [] as { id: string; customerName: string; lastMessage: string }[],
    })),
    // Stub: copilot suggestions for a given session's latest message.
    getSuggestions: publicProcedure
      .input(z.object({ sessionId: z.string() }))
      .query(({ input }) => ({
        sessionId: input.sessionId,
        suggestions: [] as string[],
        sentiment: null as 'positive' | 'neutral' | 'negative' | null,
        intent: null as string | null,
      })),
  }),
});

export type AppRouter = typeof appRouter;
