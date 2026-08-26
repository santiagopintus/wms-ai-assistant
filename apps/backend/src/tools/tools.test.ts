import "dotenv/config";
import { db } from "../lib/db.js";
import { getStock } from "./getStock.js";
import { getTopSellingProducts } from "./getTopSellingProducts.js";
import { getLowStockItems } from "./getLowStockItems.js";

// Integration tests: these hit the real Supabase Postgres database (same
// connection scripts/seed.ts uses) rather than mocking it, so a seeded
// database with SUPABASE_DB_* env vars set is required to run them.

afterAll(async () => {
  await db.end();
});

describe("getStock", () => {
  it("returns real stock data for an existing SKU", async () => {
    const { rows } = await db.query<{ sku: string }>(
      "SELECT sku FROM products LIMIT 1",
    );
    expect(rows.length).toBeGreaterThan(0);
    const sku = rows[0].sku;

    const result = await getStock(sku);

    expect(result).not.toBeNull();
    expect(result?.sku).toBe(sku);
    expect(typeof result?.name).toBe("string");
    expect(typeof result?.category).toBe("string");
    expect(typeof result?.quantityOnHand).toBe("number");
    expect(result?.quantityOnHand).toBeGreaterThanOrEqual(0);
    expect(typeof result?.reorderThreshold).toBe("number");
  });

  it("returns null for a SKU that doesn't exist", async () => {
    const result = await getStock("SKU-DOES-NOT-EXIST-12345");
    expect(result).toBeNull();
  });
});

describe("getTopSellingProducts", () => {
  it("returns a non-empty, correctly shaped, descending-sorted list", async () => {
    const result = await getTopSellingProducts(5, 90);

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);

    for (const item of result) {
      expect(typeof item.sku).toBe("string");
      expect(typeof item.name).toBe("string");
      expect(typeof item.category).toBe("string");
      expect(typeof item.unitsSold).toBe("number");
      expect(item.unitsSold).toBeGreaterThan(0);
      expect(typeof item.revenue).toBe("number");
      expect(item.revenue).toBeGreaterThanOrEqual(0);
    }

    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].unitsSold).toBeGreaterThanOrEqual(
        result[i].unitsSold,
      );
    }
  });

  it("respects the n limit", async () => {
    const result = await getTopSellingProducts(2, 90);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("returns nothing for a period with no order history", async () => {
    const result = await getTopSellingProducts(5, 0);
    expect(result).toEqual([]);
  });
});

describe("getLowStockItems", () => {
  it("returns items at or below their own reorder threshold", async () => {
    const result = await getLowStockItems();

    expect(Array.isArray(result)).toBe(true);
    for (const item of result) {
      expect(item.quantityOnHand).toBeLessThanOrEqual(item.reorderThreshold);
    }
  });

  it("respects a custom threshold override", async () => {
    const result = await getLowStockItems(0);
    for (const item of result) {
      expect(item.quantityOnHand).toBeLessThanOrEqual(0);
    }

    // A generous override should return at least as many items as the
    // strict zero-threshold query above.
    const generous = await getLowStockItems(100000);
    expect(generous.length).toBeGreaterThanOrEqual(result.length);
    expect(generous.length).toBeGreaterThan(0);
  });
});
