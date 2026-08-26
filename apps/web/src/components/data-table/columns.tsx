'use client';

import type { ColumnDef } from '@tanstack/react-table';

import { Badge } from '@/components/ui/badge';
import type { Inventory, Order, OrderItem, Product } from '@/types/db';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

export const productColumns: ColumnDef<Product>[] = [
  { accessorKey: 'sku', header: 'SKU' },
  { accessorKey: 'name', header: 'Name' },
  {
    accessorKey: 'category',
    header: 'Category',
    cell: ({ getValue }) => <Badge variant="secondary">{getValue<string>()}</Badge>,
  },
  {
    accessorKey: 'price',
    header: 'Price',
    cell: ({ getValue }) => currencyFormatter.format(getValue<number>()),
  },
  { accessorKey: 'reorder_threshold', header: 'Reorder Threshold' },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

export const inventoryColumns: ColumnDef<Inventory>[] = [
  { accessorKey: 'product_id', header: 'Product ID' },
  { accessorKey: 'quantity_on_hand', header: 'Quantity On Hand' },
  {
    accessorKey: 'warehouse_location',
    header: 'Warehouse Location',
    cell: ({ getValue }) => getValue<string | null>() ?? '—',
  },
  {
    accessorKey: 'updated_at',
    header: 'Updated At',
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

export const orderColumns: ColumnDef<Order>[] = [
  { accessorKey: 'id', header: 'Order ID' },
  {
    accessorKey: 'ordered_at',
    header: 'Ordered At',
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
  {
    accessorKey: 'created_at',
    header: 'Created At',
    cell: ({ getValue }) => formatDate(getValue<string>()),
  },
];

export const orderItemColumns: ColumnDef<OrderItem>[] = [
  { accessorKey: 'id', header: 'Item ID' },
  { accessorKey: 'order_id', header: 'Order ID' },
  { accessorKey: 'product_id', header: 'Product ID' },
  { accessorKey: 'quantity', header: 'Quantity' },
  {
    accessorKey: 'unit_price',
    header: 'Unit Price',
    cell: ({ getValue }) => currencyFormatter.format(getValue<number>()),
  },
];
