import type { Request, Response } from "express";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { groq } from "../lib/groq.js";
import { tools } from "../tools/index.js";

const SYSTEM_PROMPT = `You are a warehouse inventory copilot for a single admin user.
Answer questions about stock, low-stock items, and top-selling products using
the provided tools only — never guess or invent numbers. If a tool returns no
match (e.g. an unknown SKU), say so plainly. Keep answers concise.`;

export async function chatStreamHandler(req: Request, res: Response) {
  const { messages } = req.body as { messages: UIMessage[] };

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  result.pipeUIMessageStreamToResponse(res);
}
