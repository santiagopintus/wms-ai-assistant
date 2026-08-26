-- WMS AI Copilot — warehouse schema
-- Run this once against your Supabase project (SQL editor or `psql`).
-- Read-only from the app's perspective: only the seed script writes to these tables.

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category text not null,
  price numeric(10, 2) not null check (price >= 0),
  reorder_threshold integer not null check (reorder_threshold >= 0),
  created_at timestamptz not null default now()
);

create table if not exists inventory (
  product_id uuid primary key references products(id) on delete cascade,
  quantity_on_hand integer not null check (quantity_on_hand >= 0),
  warehouse_location text,
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  ordered_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0)
);

create index if not exists idx_order_items_product_id on order_items(product_id);
create index if not exists idx_order_items_order_id on order_items(order_id);
create index if not exists idx_orders_ordered_at on orders(ordered_at);
create index if not exists idx_products_sku on products(sku);
