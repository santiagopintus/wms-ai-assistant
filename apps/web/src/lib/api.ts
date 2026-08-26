import type { Inventory, Order, OrderItem, Product } from '@/types/db';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:4000';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`);

  if (!res.ok) {
    throw new Error(`Request to ${path} failed with status ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export function getProducts() {
  return fetchJson<Product[]>('/api/products');
}

export function getInventory() {
  return fetchJson<Inventory[]>('/api/inventory');
}

export function getOrders() {
  return fetchJson<Order[]>('/api/orders');
}

export function getOrderItems() {
  return fetchJson<OrderItem[]>('/api/order-items');
}
