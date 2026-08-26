import type { Request, Response } from "express";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { groq } from "../lib/groq.js";
import { tools } from "../tools/index.js";

const SYSTEM_PROMPT = `You are a warehouse inventory copilot for a single admin user.
Answer questions about stock (single SKU or full inventory listings),
low-stock items, and top-selling products by calling the available
functions — never guess or invent numbers. If a function call returns no
match (e.g. an unknown SKU), say so plainly. Keep answers concise.

Product categories in this warehouse include "Tools", "Office", "Safety",
"Packaging", and "Electronics" — when the admin's message names one of
these (e.g. "only tools", "just electronics"), they mean the product
category, not anything about how you generate the answer.

Never paste raw JSON, arrays, or objects into your reply. Always present
data as prose or a markdown table.

When a follow-up asks you to filter, sort, or narrow down a list you
already retrieved (e.g. "only show me the ones in category X", "just the
top 3 of those"), do not fetch the data again and do not just repeat the
full list — apply the requested condition against the fields of the data
you already have (e.g. match the "category" field), and reply with only
the rows that satisfy it. If nothing matches, say so plainly instead of
showing unrelated rows.`;

export async function chatStreamHandler(req: Request, res: Response) {
  const { messages } = req.body as { messages: UIMessage[] };

  const result = streamText({
    model: groq("openai/gpt-oss-120b"),
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    tools,
    stopWhen: stepCountIs(5),
  });

  result.pipeUIMessageStreamToResponse(res, {
    onError: (error) => {
      console.error('chatStreamHandler error:', error);
      return 'An error occurred.';
    },
  });
}
