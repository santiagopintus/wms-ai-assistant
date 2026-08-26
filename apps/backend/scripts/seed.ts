import "dotenv/config";
import { supabase } from "../src/lib/supabase.js";

// Deterministic-ish synthetic warehouse dataset: enough products/orders for
// meaningful "top sellers" and low-stock queries without external data.

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

async function main() {
  const products = buildProducts();

  console.log(`Seeding ${products.length} products...`);
  const { data: insertedProducts, error: productsError } = await supabase
    .from("products")
    .upsert(
      products.map(({ sku, name, category, price, reorderThreshold }) => ({
        sku,
        name,
        category,
        price,
        reorder_threshold: reorderThreshold,
      })),
      { onConflict: "sku" },
    )
    .select("id, sku");

  if (productsError) throw productsError;
  if (!insertedProducts) throw new Error("No products returned after insert");

  const skuToId = new Map(insertedProducts.map((p) => [p.sku, p.id as string]));

  console.log("Seeding inventory...");
  const { error: inventoryError } = await supabase.from("inventory").upsert(
    products.map((p) => ({
      product_id: skuToId.get(p.sku),
      quantity_on_hand: p.quantityOnHand,
      warehouse_location: `Aisle ${1 + Math.floor(Math.random() * 12)}`,
    })),
    { onConflict: "product_id" },
  );
  if (inventoryError) throw inventoryError;

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
  const { data: insertedOrders, error: ordersError } = await supabase
    .from("orders")
    .insert(
      Array.from({ length: ORDER_COUNT }, () => ({
        ordered_at: randomDateWithinDays(DAYS_OF_HISTORY).toISOString(),
      })),
    )
    .select("id");
  if (ordersError) throw ordersError;
  if (!insertedOrders) throw new Error("No orders returned after insert");

  console.log("Seeding order items...");
  const orderItems = insertedOrders.flatMap((order) => {
    const itemCount = 1 + Math.floor(Math.random() * 4);
    return Array.from({ length: itemCount }, () => {
      const pickBestSeller = Math.random() < 0.6;
      const pool = pickBestSeller
        ? products.filter((p) => bestSellers.has(p.sku))
        : products;
      const product = pool[Math.floor(Math.random() * pool.length)];
      return {
        order_id: order.id,
        product_id: skuToId.get(product.sku),
        quantity: 1 + Math.floor(Math.random() * 5),
        unit_price: product.price,
      };
    });
  });

  const { error: orderItemsError } = await supabase
    .from("order_items")
    .insert(orderItems);
  if (orderItemsError) throw orderItemsError;

  console.log(
    `Done. Seeded ${products.length} products, ${ORDER_COUNT} orders, ${orderItems.length} order items.`,
  );
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
