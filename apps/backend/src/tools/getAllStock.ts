import { db } from "../lib/db.js";

export type StockLine = {
  sku: string;
  name: string;
  category: string;
  price: number;
  quantityOnHand: number;
  warehouseLocation: string | null;
};

export type SortBy = "quantity" | "name";

export async function getAllStock(sortBy?: SortBy): Promise<StockLine[]> {
  const orderBy = sortBy === "name" ? "p.name ASC" : "quantity_on_hand DESC";

  const { rows } = await db.query<{
    sku: string;
    name: string;
    category: string;
    price: number;
    quantity_on_hand: number | null;
    warehouse_location: string | null;
  }>(
    `SELECT p.sku, p.name, p.category, p.price::float8 AS price,
            i.quantity_on_hand, i.warehouse_location
    FROM products p
    LEFT JOIN inventory i ON i.product_id = p.id
    ORDER BY ${orderBy}`,
  );

  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: row.price,
    quantityOnHand: row.quantity_on_hand ?? 0,
    warehouseLocation: row.warehouse_location,
  }));
}
