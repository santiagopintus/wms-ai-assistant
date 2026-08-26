import "dotenv/config";
import { Client } from "pg";

// Deterministic-ish synthetic warehouse dataset: enough products/orders for
// meaningful "top sellers" and low-stock queries without external data.
//
// Connects directly to Postgres (transaction pooler) rather than through
// supabase-js/PostgREST, so seeding doesn't depend on the REST API being up.

const CATEGORIES = [
  "Tools",
  "Electronics",
  "Packaging",
  "Safety",
  "Office",
] as const;

const PRODUCT_NAMES: Record<(typeof CATEGORIES)[number], string[]> = {
  Tools: [
    "Cordless Drill",
    "Claw Hammer",
    "Adjustable Wrench",
    "Tape Measure",
    "Utility Knife",
    "Socket Set",
  ],
  Electronics: [
    "Barcode Scanner",
    "Handheld Radio",
    "Label Printer",
    "Tablet Mount",
    "Forklift Battery",
  ],
  Packaging: [
    "Cardboard Box (M)",
    "Cardboard Box (L)",
    "Bubble Wrap Roll",
    "Packing Tape",
    "Stretch Film",
    "Pallet Wrap",
  ],
  Safety: [
    "Hard Hat",
    "Safety Vest",
    "Steel-Toe Boots",
    "Work Gloves",
    "Safety Goggles",
  ],
  Office: [
    "Clipboard",
    "Label Rolls",
    "Permanent Markers",
    "Inventory Binder",
    "Desk Lamp",
  ],
};

type SeedProduct = {
  sku: string;
  name: string;
  category: string;
  price: number;
  reorderThreshold: number;
  quantityOnHand: number;
};

function buildProducts(): SeedProduct[] {
  const products: SeedProduct[] = [];
  let skuCounter = 1000;

  for (const category of CATEGORIES) {
    for (const name of PRODUCT_NAMES[category]) {
      skuCounter += 1;
      products.push({
        sku: `SKU-${skuCounter}`,
        name,
        category,
        price: Number((5 + Math.random() * 195).toFixed(2)),
        reorderThreshold: 10 + Math.floor(Math.random() * 20),
        // some products intentionally seeded low, to exercise getLowStockItems
        quantityOnHand:
          Math.random() < 0.2
            ? Math.floor(Math.random() * 8)
            : 20 + Math.floor(Math.random() * 180),
      });
    }
  }

  return products;
}

function randomDateWithinDays(days: number): Date {
  const now = Date.now();
  const past = now - Math.random() * days * 24 * 60 * 60 * 1000;
  return new Date(past);
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function main() {
  const client = new Client({
    host: requireEnv("SUPABASE_DB_HOST"),
    port: Number(process.env.SUPABASE_DB_PORT ?? 6543),
    database: process.env.SUPABASE_DB_NAME ?? "postgres",
    user: requireEnv("SUPABASE_DB_USER"),
    password: requireEnv("SUPABASE_DB_PASS"),
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();

  try {
    const products = buildProducts();

    console.log(`Seeding ${products.length} products...`);
    const skuToId = new Map<string, string>();
    for (const p of products) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO products (sku, name, category, price, reorder_threshold)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (sku) DO UPDATE SET
           name = EXCLUDED.name,
           category = EXCLUDED.category,
           price = EXCLUDED.price,
           reorder_threshold = EXCLUDED.reorder_threshold
         RETURNING id`,
        [p.sku, p.name, p.category, p.price, p.reorderThreshold],
      );
      skuToId.set(p.sku, rows[0].id);
    }

    console.log("Seeding inventory...");
    for (const p of products) {
      await client.query(
        `INSERT INTO inventory (product_id, quantity_on_hand, warehouse_location)
         VALUES ($1, $2, $3)
         ON CONFLICT (product_id) DO UPDATE SET
           quantity_on_hand = EXCLUDED.quantity_on_hand,
           warehouse_location = EXCLUDED.warehouse_location`,
        [
          skuToId.get(p.sku),
          p.quantityOnHand,
          `Aisle ${1 + Math.floor(Math.random() * 12)}`,
        ],
      );
    }

    const ORDER_COUNT = 300;
    const DAYS_OF_HISTORY = 90;

    // Skew sales toward a subset of products so "top sellers" is meaningful.
    const bestSellers = new Set(
      products
        .map((p) => p.sku)
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.ceil(products.length * 0.25)),
    );

    console.log(`Seeding ${ORDER_COUNT} orders...`);
    const orderIds: string[] = [];
    for (let i = 0; i < ORDER_COUNT; i++) {
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO orders (ordered_at) VALUES ($1) RETURNING id`,
        [randomDateWithinDays(DAYS_OF_HISTORY).toISOString()],
      );
      orderIds.push(rows[0].id);
    }

    console.log("Seeding order items...");
    let orderItemCount = 0;
    for (const orderId of orderIds) {
      const itemCount = 1 + Math.floor(Math.random() * 4);
      for (let i = 0; i < itemCount; i++) {
        const pickBestSeller = Math.random() < 0.6;
        const pool = pickBestSeller
          ? products.filter((p) => bestSellers.has(p.sku))
          : products;
        const product = pool[Math.floor(Math.random() * pool.length)];
        await client.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
           VALUES ($1, $2, $3, $4)`,
          [
            orderId,
            skuToId.get(product.sku),
            1 + Math.floor(Math.random() * 5),
            product.price,
          ],
        );
        orderItemCount += 1;
      }
    }

    console.log(
      `Done. Seeded ${products.length} products, ${ORDER_COUNT} orders, ${orderItemCount} order items.`,
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
