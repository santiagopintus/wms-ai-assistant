import "dotenv/config";
import express from "express";
import request from "supertest";
import { db } from "../lib/db.js";
import { chatStreamHandler } from "./stream.js";

// Integration test: exercises the real /api/chat route against the real
// Groq API (and, transitively, the real database via tool calls) rather
// than mocking either — this is what actually proves the AI <-> tool-calling
// wiring works end to end, separate from the pure-function DB tool tests in
// ../tools/tools.test.ts. Requires GROQ_API_KEY + SUPABASE_DB_* in .env.

jest.setTimeout(30000);

const app = express();
app.use(express.json());
app.post("/api/chat", chatStreamHandler);

afterAll(async () => {
  await db.end();
});

function userMessage(text: string) {
  return {
    messages: [
      {
        id: "1",
        role: "user",
        parts: [{ type: "text", text }],
      },
    ],
  };
}

describe("POST /api/chat (Groq integration)", () => {
  it("streams a real response for a plain greeting (no tool call needed)", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send(userMessage("Say hello in exactly one short sentence."))
      .expect(200);

    expect(res.headers["content-type"]).toMatch(/text\/event-stream/);
    expect(res.text).toContain('"type":"start"');
    expect(res.text).toContain('"type":"finish"');
    expect(res.text).not.toContain('"type":"error"');
  });

  it("calls the getStock tool and returns real inventory data for a SKU question", async () => {
    const { rows } = await db.query<{ sku: string; name: string }>(
      "SELECT sku, name FROM products LIMIT 1",
    );
    const { sku } = rows[0];

    const res = await request(app)
      .post("/api/chat")
      .send(userMessage(`What is the current stock quantity for SKU ${sku}? Use the tool.`))
      .expect(200);

    expect(res.text).toContain('"toolName":"getStock"');
    expect(res.text).toContain(`"sku":"${sku}"`);
    expect(res.text).toContain('"type":"tool-output-available"');
    expect(res.text).toContain('"type":"finish"');
    expect(res.text).not.toContain('"type":"error"');
  });

  it("calls the getLowStockItems tool for a restock question", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send(
        userMessage(
          "Which products are at or below their reorder threshold? Use the tool.",
        ),
      )
      .expect(200);

    expect(res.text).toContain('"toolName":"getLowStockItems"');
    expect(res.text).toContain('"type":"tool-output-available"');
    expect(res.text).toContain('"type":"finish"');
    expect(res.text).not.toContain('"type":"error"');
  });

  it("calls the getAllStock tool for a full-inventory / 'what do we have the most of' question", async () => {
    const res = await request(app)
      .post("/api/chat")
      .send(userMessage("What item do we have the most of in stock? Use the tool."))
      .expect(200);

    expect(res.text).toContain('"toolName":"getAllStock"');
    expect(res.text).toContain('"type":"tool-output-available"');
    expect(res.text).toContain('"type":"finish"');
    expect(res.text).not.toContain('"type":"error"');
  });

  it("answers a price question by name using a tool result that includes price", async () => {
    const { rows } = await db.query<{ name: string }>(
      "SELECT name FROM products LIMIT 1",
    );
    const { name } = rows[0];

    const res = await request(app)
      .post("/api/chat")
      .send(userMessage(`How much does the ${name} cost? Use a tool to check.`))
      .expect(200);

    // Could be answered via getStock (if the model already knows the SKU) or
    // getAllStock (scanning by name) — either way price must be in the data.
    expect(res.text).toMatch(/"toolName":"(getStock|getAllStock)"/);
    expect(res.text).toContain('"price"');
    expect(res.text).toContain('"type":"tool-output-available"');
    expect(res.text).toContain('"type":"finish"');
    expect(res.text).not.toContain('"type":"error"');
  });
});
