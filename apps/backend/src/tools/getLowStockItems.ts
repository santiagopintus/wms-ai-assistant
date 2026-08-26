import { db } from "../lib/db.js";

export type LowStockItem = {
  sku: string;
  name: string;
  category: string;
  quantityOnHand: number;
  reorderThreshold: number;
};

export async function getLowStockItems(
  thresholdOverride?: number,
): Promise<LowStockItem[]> {
  const { rows } = await db.query<{
    sku: string;
    name: string;
    category: string;
    reorder_threshold: number;
    quantity_on_hand: number | null;
  }>(
    `SELECT p.sku, p.name, p.category, p.reorder_threshold, i.quantity_on_hand
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE COALESCE(i.quantity_on_hand, 0) <= COALESCE($1, p.reorder_threshold)
     ORDER BY COALESCE(i.quantity_on_hand, 0) ASC`,
    [thresholdOverride ?? null],
  );

  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    category: row.category,
    reorderThreshold: row.reorder_threshold,
    quantityOnHand: row.quantity_on_hand ?? 0,
  }));
}
