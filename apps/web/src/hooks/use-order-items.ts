import { useQuery } from '@tanstack/react-query';
import { getOrderItems } from '@/lib/api';

export function useOrderItems() {
  return useQuery({
    queryKey: ['order-items'],
    queryFn: getOrderItems,
  });
}
