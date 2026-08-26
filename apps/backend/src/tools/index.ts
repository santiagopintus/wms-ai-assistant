import { tool } from "ai";
import { z } from "zod";
import { getStock } from "./getStock.js";
import { getTopSellingProducts } from "./getTopSellingProducts.js";
import { getLowStockItems } from "./getLowStockItems.js";

export const tools = {
  getStock: tool({
    description:
      "Look up current stock (quantity on hand, location) for a single product by SKU.",
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
};
