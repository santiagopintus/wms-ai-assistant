import { getInventory, getOrderItems, getOrders, getProducts } from './api';

const BACKEND_URL = 'http://localhost:4000';

function mockFetchOnce(response: Partial<Response> & { ok: boolean }) {
  const fetchMock = jest.fn().mockResolvedValue(response);
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
}

describe('api client', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('getProducts calls GET /api/products and returns parsed JSON', async () => {
    const products = [{ id: '1', sku: 'SKU-1', name: 'Widget' }];
    const fetchMock = mockFetchOnce({ ok: true, json: async () => products });

    const result = await getProducts();

    expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/api/products`);
    expect(result).toEqual(products);
  });

  it('getInventory calls GET /api/inventory and returns parsed JSON', async () => {
    const inventory = [{ product_id: '1', quantity_on_hand: 10, warehouse_location: 'A1' }];
    const fetchMock = mockFetchOnce({ ok: true, json: async () => inventory });

    const result = await getInventory();

    expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/api/inventory`);
    expect(result).toEqual(inventory);
  });

  it('getOrders calls GET /api/orders and returns parsed JSON', async () => {
    const orders = [{ id: '1', ordered_at: '2026-01-01T00:00:00Z' }];
    const fetchMock = mockFetchOnce({ ok: true, json: async () => orders });

    const result = await getOrders();

    expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/api/orders`);
    expect(result).toEqual(orders);
  });

  it('getOrderItems calls GET /api/order-items and returns parsed JSON', async () => {
    const orderItems = [{ id: '1', order_id: '1', product_id: '1', quantity: 2, unit_price: 5 }];
    const fetchMock = mockFetchOnce({ ok: true, json: async () => orderItems });

    const result = await getOrderItems();

    expect(fetchMock).toHaveBeenCalledWith(`${BACKEND_URL}/api/order-items`);
    expect(result).toEqual(orderItems);
  });

  it('throws an error with the status code when the response is not ok', async () => {
    mockFetchOnce({ ok: false, status: 500, json: async () => ({}) });

    await expect(getProducts()).rejects.toThrow('Request to /api/products failed with status 500');
  });

  it.each([
    ['getProducts', getProducts],
    ['getInventory', getInventory],
    ['getOrders', getOrders],
    ['getOrderItems', getOrderItems],
  ])('%s propagates a network failure', async (_name, fn) => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down')) as unknown as typeof fetch;

    await expect(fn()).rejects.toThrow('network down');
  });
});
