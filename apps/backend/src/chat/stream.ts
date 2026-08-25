import type { Request, Response } from 'express';

// Stub for the client chat widget's streaming endpoint. Will use `ai`'s
// streamText with the Groq provider (see ../lib/groq.ts) once the
// Vercel AI SDK wiring is implemented.
export function chatStreamHandler(_req: Request, res: Response) {
  res.json({
    message: 'Chat streaming not implemented yet.',
  });
}
