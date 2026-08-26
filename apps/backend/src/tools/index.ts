import { tool } from "ai";
import { z } from "zod";
import { getStock } from "./getStock.js";
import { getTopSellingProducts } from "./getTopSellingProducts.js";
import { getLowStockItems } from "./getLowStockItems.js";
import { getAllStock } from "./getAllStock.js";

export const tools = {
  getStock: tool({
    description:
      "Look up current stock (quantity on hand, location, price) for a single product by SKU.",
    inputSchema: z.object({
      sku: z.string().describe("The product SKU, e.g. SKU-1001"),
    }),
    execute: async ({ sku }) => {
      const result = await getStock(sku);
      return result ?? { error: `No product found with SKU "${sku}".` };
    },
  }),

  getTopSellingProducts: tool({
    description:
      "Get the best-selling products (by units sold) over a recent time period.",
    inputSchema: z.object({
      n: z.number().int().positive().max(50).describe("How many top products to return"),
      periodDays: z
        .number()
        .int()
        .positive()
        .max(365)
        .describe("Look back this many days from now"),
    }),
    execute: async ({ n, periodDays }) => getTopSellingProducts(n, periodDays),
  }),

  getLowStockItems: tool({
    description:
      "List products at or below their reorder threshold (or a custom threshold), so the admin knows what to restock.",
    inputSchema: z.object({
      // Groq's tool-calling models send an explicit `null` for omitted
      // optional params rather than leaving the key out, so this must accept
      // null (not just undefined) and normalize it away.
      thresholdOverride: z
        .number()
        .int()
        .nonnegative()
        .nullable()
        .optional()
        .transform((value) => value ?? undefined)
        .describe(
          "If provided, use this quantity instead of each product's own reorder threshold",
        ),
    }),
    execute: async ({ thresholdOverride }) =>
      getLowStockItems(thresholdOverride),
  }),

  getAllStock: tool({
    description:
      "List every product with its current stock quantity, category, price, and warehouse location — the full inventory, not just low-stock ones. Use this for questions like 'what do we have the most of', 'show me all the stock', or price lookups by name.",
    inputSchema: z.object({
      sortBy: z
        .enum(["quantity", "name"])
        .nullable()
        .optional()
        .transform((value) => value ?? undefined)
        .describe(
          "How to sort the list: 'quantity' (highest stock first, default) or 'name' (alphabetical)",
        ),
    }),
    execute: async ({ sortBy }) => getAllStock(sortBy),
  }),
};
