import { db } from "../lib/db.js";

export type StockResult = {
  sku: string;
  name: string;
  category: string;
  quantityOnHand: number;
  warehouseLocation: string | null;
  reorderThreshold: number;
} | null;

export async function getStock(sku: string): Promise<StockResult> {
  const { rows } = await db.query<{
    sku: string;
    name: string;
    category: string;
    reorder_threshold: number;
    quantity_on_hand: number | null;
    warehouse_location: string | null;
  }>(
    `SELECT p.sku, p.name, p.category, p.reorder_threshold,
            i.quantity_on_hand, i.warehouse_location
     FROM products p
     LEFT JOIN inventory i ON i.product_id = p.id
     WHERE p.sku = $1`,
    [sku],
  );

  const row = rows[0];
  if (!row) return null;

  return {
    sku: row.sku,
    name: row.name,
    category: row.category,
    reorderThreshold: row.reorder_threshold,
    quantityOnHand: row.quantity_on_hand ?? 0,
    warehouseLocation: row.warehouse_location,
  };
}
