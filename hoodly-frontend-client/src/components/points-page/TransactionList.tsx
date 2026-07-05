import { ArrowDownLeft, ArrowUpRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Transaction {
  id: string
  title: string
  category: string
  amount: number
  type: 'debit' | 'credit'
  date: string
  status: string
}

interface TransactionListProps {
  transactions: Transaction[]
  isLoading: boolean
}

export function TransactionList({ transactions, isLoading }: TransactionListProps) {
  const { t } = useTranslation()
  return (
    <div className="lg:col-span-2 space-y-4">
      <h2 className="text-xl font-bold text-gray-900 leading-none">
        {t('points.transactionList.title', 'Activité & Historique récent')}
      </h2>
      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-12 flex items-center justify-center flex-col text-gray-400 gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-[#2c308e]" />
              <p className="text-xs font-bold">{t('points.transactionList.loading', 'Chargement de votre historique...')}</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs font-light">
              {t('points.transactionList.empty', 'Aucune transaction enregistrée pour le moment.')}
            </div>
          ) : (
            transactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors animate-in fade-in duration-200">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    tx.type === 'credit'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}>
                    {tx.type === 'credit' ? (
                      <ArrowDownLeft className="h-5 w-5" />
                    ) : (
                      <ArrowUpRight className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-snug">
                      {tx.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-gray-400">{tx.date}</span>
                      <span className="text-[8px] uppercase tracking-wider font-bold text-gray-400 px-1.5 py-0.5 rounded bg-gray-100 border">
                        {tx.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-sm font-extrabold ${
                    tx.type === 'credit' ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {tx.type === 'credit' ? '+' : '-'}{tx.amount} {t('points.transactionList.pointsSuffix', 'pts')}
                  </span>
                  <p className="text-[9px] font-bold text-gray-400 mt-0.5 uppercase tracking-wider">
                    {tx.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
