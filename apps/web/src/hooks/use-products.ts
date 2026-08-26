import { useQuery } from '@tanstack/react-query';
import { getProducts } from '@/lib/api';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
