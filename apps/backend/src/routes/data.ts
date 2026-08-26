import { Router } from "express";
import type { Request, Response } from "express";
import { db } from "../lib/db.js";

// Plain read-only REST endpoints for browsing raw table data in the admin
// dashboard — separate from the AI tool-calling surface under /api/chat.
// No auth/pagination/filtering: the dataset is small and the frontend fetches
// everything per tab on mount.

export const dataRouter = Router();

// Express 4 doesn't catch rejected promises from async handlers on its own.
function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void>,
) {
  return (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal server error" });
    });
  };
}

dataRouter.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT id, sku, name, category, price::float8 AS price,
              reorder_threshold, created_at
       FROM products`,
    );
    res.json(rows);
  }),
);

dataRouter.get(
  "/inventory",
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT product_id, quantity_on_hand, warehouse_location, updated_at
       FROM inventory`,
    );
    res.json(rows);
  }),
);

dataRouter.get(
  "/orders",
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT id, ordered_at, created_at FROM orders`,
    );
    res.json(rows);
  }),
);

dataRouter.get(
  "/order-items",
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT id, order_id, product_id, quantity, unit_price::float8 AS unit_price
       FROM order_items`,
    );
    res.json(rows);
  }),
);
