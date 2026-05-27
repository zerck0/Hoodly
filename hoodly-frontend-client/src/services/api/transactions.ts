import api from '../../lib/axios'
import type { Transaction } from '../../types/transaction.types'

export const transactionsApi = {
  getMyTransactions: () =>
    api.get<Transaction[]>('/transactions/me'),
}
