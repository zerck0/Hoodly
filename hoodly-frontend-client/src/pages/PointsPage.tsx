import { useUser } from '../hooks/useUser'
import { useTransactions } from '../hooks/useTransactions'
import { useMemo } from 'react'

import { PointsBalanceCard } from '../components/points-page/PointsBalanceCard'
import { PointsRulesCard } from '../components/points-page/PointsRulesCard'
import { TransactionList } from '../components/points-page/TransactionList'
import { SuggestedRatesCard } from '../components/points-page/SuggestedRatesCard'

export default function PointsPage() {
  const { user } = useUser()
  const { data: backendTransactions, isLoading: isLoadingInbox } = useTransactions()

  const points = user?.points ?? 100

  const realTransactions = useMemo(() => {
    if (!backendTransactions) return []

    return backendTransactions.map((tx: any) => {
      const payerId = typeof tx.payerId === 'object' ? tx.payerId?._id : tx.payerId
      const isPayer = payerId === user?.id

      const dateLabel = tx.createdAt
        ? new Date(tx.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          })
        : 'Récemment'

      return {
        id: tx._id,
        title: tx.description,
        category: tx.serviceId?.categorie || 'Système',
        amount: tx.amount,
        type: isPayer ? ('debit' as const) : ('credit' as const),
        date: dateLabel,
        status: 'complété'
      }
    })
  }, [backendTransactions, user])

  const suggestedRates = [
    { name: 'Soutien scolaire', rate: '30 - 50 pts / h' },
    { name: 'Bricolage & Jardin', rate: '30 - 50 pts / h' },
    { name: 'Babysitting', rate: '20 pts / h' },
    { name: 'Courses', rate: '20 pts / trajet' },
    { name: 'Animaux', rate: '10 pts / promenade' }
  ]

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold text-[#1e224e]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Économie locale & Solde
        </h1>
        <p className="text-gray-500 mt-1 text-sm font-light leading-relaxed">
          Gérez votre portefeuille de points virtuelles Hoodly, visualisez votre historique et découvrez la valeur de l'entraide de quartier.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <PointsBalanceCard points={points} />
        <PointsRulesCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <TransactionList transactions={realTransactions} isLoading={isLoadingInbox} />
        <SuggestedRatesCard rates={suggestedRates} />
      </div>
    </div>
  )
}
