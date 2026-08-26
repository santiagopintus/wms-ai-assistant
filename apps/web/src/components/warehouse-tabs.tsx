'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';

import {
  createInventoryColumns,
  createOrderItemColumns,
  orderColumns,
  productColumns,
} from '@/components/data-table/columns';
import { DataTable } from '@/components/data-table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInventory } from '@/hooks/use-inventory';
import { useOrderItems } from '@/hooks/use-order-items';
import { useOrders } from '@/hooks/use-orders';
import { useProducts } from '@/hooks/use-products';

export function WarehouseTabs() {
  const t = useTranslations('Dashboard');

  const products = useProducts();
  const inventory = useInventory();
  const orders = useOrders();
  const orderItems = useOrderItems();

  const productNameById = useMemo(() => {
    const map: Record<string, string> = {};
    for (const product of products.data ?? []) {
      map[product.id] = product.name;
    }
    return map;
  }, [products.data]);

  const inventoryColumns = useMemo(
    () => createInventoryColumns(productNameById),
    [productNameById],
  );
  const orderItemColumns = useMemo(
    () => createOrderItemColumns(productNameById),
    [productNameById],
  );

  return (
    <Tabs defaultValue="products" className="flex h-full flex-col gap-4">
      <TabsList>
        <TabsTrigger value="products">{t('tabs.products')}</TabsTrigger>
        <TabsTrigger value="inventory">{t('tabs.inventory')}</TabsTrigger>
        <TabsTrigger value="orders">{t('tabs.orders')}</TabsTrigger>
        <TabsTrigger value="orderItems">{t('tabs.orderItems')}</TabsTrigger>
      </TabsList>

      <TabsContent value="products">
        <DataTable
          columns={productColumns}
          data={products.data}
          isLoading={products.isLoading}
          isError={products.isError}
        />
      </TabsContent>

      <TabsContent value="inventory">
        <DataTable
          columns={inventoryColumns}
          data={inventory.data}
          isLoading={inventory.isLoading}
          isError={inventory.isError}
        />
      </TabsContent>

      <TabsContent value="orders">
        <DataTable
          columns={orderColumns}
          data={orders.data}
          isLoading={orders.isLoading}
          isError={orders.isError}
        />
      </TabsContent>

      <TabsContent value="orderItems">
        <DataTable
          columns={orderItemColumns}
          data={orderItems.data}
          isLoading={orderItems.isLoading}
          isError={orderItems.isError}
        />
      </TabsContent>
    </Tabs>
  );
}
