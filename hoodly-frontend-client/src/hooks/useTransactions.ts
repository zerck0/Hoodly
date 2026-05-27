import { useQuery } from '@tanstack/react-query'
import { transactionsApi } from '../services/api/transactions'

export function useTransactions() {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: async () => {
      const { data } = await transactionsApi.getMyTransactions()
      return data
    },
    staleTime: 1000 * 10,
  })
}
