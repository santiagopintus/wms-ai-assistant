export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  reorder_threshold: number;
  created_at: string;
}

export interface Inventory {
  product_id: string;
  quantity_on_hand: number;
  warehouse_location: string | null;
  updated_at: string;
}

export interface Order {
  id: string;
  ordered_at: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
}
