import { useQuery } from '@tanstack/react-query';
import { getOrders } from '@/lib/api';

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
  });
}
