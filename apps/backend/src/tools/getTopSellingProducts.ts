import { db } from "../lib/db.js";

export type TopSellingProduct = {
  sku: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
};

export async function getTopSellingProducts(
  n: number,
  periodDays: number,
): Promise<TopSellingProduct[]> {
  const { rows } = await db.query<{
    sku: string;
    name: string;
    category: string;
    units_sold: string;
    revenue: string;
  }>(
    `SELECT p.sku, p.name, p.category,
            SUM(oi.quantity) AS units_sold,
            SUM(oi.quantity * oi.unit_price) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN products p ON p.id = oi.product_id
     WHERE o.ordered_at >= NOW() - ($1 || ' days')::interval
     GROUP BY p.sku, p.name, p.category
     ORDER BY units_sold DESC
     LIMIT $2`,
    [periodDays, n],
  );

  return rows.map((row) => ({
    sku: row.sku,
    name: row.name,
    category: row.category,
    unitsSold: Number(row.units_sold),
    revenue: Number(Number(row.revenue).toFixed(2)),
  }));
}
