import { useUser } from '../hooks/useUser'
import { useTransactions } from '../hooks/useTransactions'
import { useMemo } from 'react'
import {
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  HelpCircle,
  ShieldCheck,
  Info,
  ChevronRight,
  TrendingUp,
  Loader2
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'

export default function PointsPage() {
  const { user } = useUser()
  const { data: backendTransactions, isLoading: isLoadingInbox } = useTransactions()
  const points = user?.points ?? 100
  const euros = (points / 10).toFixed(2)

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
        type: isPayer ? 'debit' : 'credit',
        date: dateLabel,
        status: 'complété'
      }
    })
  }, [backendTransactions, user])

  const suggestedRates = [
    { name: 'Soutien scolaire', rate: '150 - 250 pts / h', eq: '15 - 25 €' },
    { name: 'Bricolage & Jardin', rate: '120 - 200 pts / h', eq: '12 - 20 €' },
    { name: 'Babysitting', rate: '100 - 150 pts / h', eq: '10 - 15 €' },
    { name: 'Courses', rate: '100 - 150 pts / trajet', eq: '10 - 15 €' },
    { name: 'Animaux', rate: '50 - 100 pts / promenade', eq: '5 - 10 €' }
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

        <Card className="md:col-span-2 bg-[#1f224e] border-0 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
          <div className="absolute right-0 top-0 text-white/5 pointer-events-none">
            <Coins className="h-64 w-64 -translate-y-12 translate-x-12" />
          </div>

          <div className="z-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-white/60">
                Solde Actif du Compte
              </span>
              <Badge className="bg-white/10 hover:bg-white/20 border-0 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3">
                🪙 Compte Actif
              </Badge>
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-6xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
                {points}
              </span>
              <span className="text-xl font-semibold text-white/80">points</span>
            </div>
            <p className="text-xs text-white/60 mt-1 font-light">
              Équivalent de transaction d'entraide estimé à : <strong className="text-white font-bold">{euros} €</strong>
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
                Garantie Anti-spéculation Hoodly
              </span>
            </div>
            <p className="text-[10px] text-white/60 font-light leading-relaxed max-w-sm">
              Hoodly maintient une économie circulaire où chaque point gagné encourage et rémunère le travail de bon voisinage.
            </p>
          </div>
        </Card>

        <Card className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm flex flex-col justify-between h-full">
          <div className="space-y-4">
            <div className="h-10 w-10 rounded-full bg-[#e9eaf6] flex items-center justify-center text-[#2c308e]">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-snug">Règles d'échange</h3>
              <p className="text-xs text-gray-500 mt-1.5 font-light leading-relaxed">
                Taux fixe officiel : <strong>10 Points = 1 Euro</strong>.<br/>
                Chaque nouvel habitant bénéficie d'un cadeau de <strong>100 points</strong> pour commencer à solliciter de l'aide.
              </p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/50 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-[#2c308e] shrink-0 mt-0.5" />
            <p className="text-[10px] text-gray-600 leading-relaxed font-light">
              <strong>Seuil de réserve :</strong> Pour retirer de la trésorerie réelle, vous devez conserver 100 points minimum pour faire tourner la monnaie.
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-gray-900 leading-none">
            Activité & Historique récent
          </h2>
          <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <div className="divide-y divide-gray-100">
              {isLoadingInbox ? (
                <div className="p-12 flex items-center justify-center flex-col text-gray-400 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-[#2c308e]" />
                  <p className="text-xs font-bold">Chargement de votre historique...</p>
                </div>
              ) : (
                realTransactions.map((tx) => (
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
                        {tx.type === 'credit' ? '+' : '-'}{tx.amount} pts
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

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 leading-none">
            Grille de tarifs indicatifs
          </h2>
          <Card className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                Voici les recommandations de tarifs d'entraide issues des moyennes de transactions de votre quartier :
              </p>

              <div className="space-y-3">
                {suggestedRates.map((item) => (
                  <div key={item.name} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-bold text-gray-900 leading-snug">
                        {item.name}
                      </p>
                      <p className="text-[10px] text-gray-400 font-light mt-0.5">
                        Équivalent : {item.eq}
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-[#2c308e] bg-[#e9eaf6]/60 border border-[#e9eaf6] px-2.5 py-1 rounded-full shrink-0">
                      {item.rate}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button className="w-full flex items-center justify-between text-xs font-bold text-[#2c308e] hover:text-[#2c308e]/80 transition-colors">
                  <span className="flex items-center gap-1">
                    <HelpCircle className="h-4 w-4" />
                    Comment fixer mes tarifs ?
                  </span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
