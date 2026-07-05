import { Coins, ShieldCheck } from 'lucide-react'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { useTranslation } from 'react-i18next'

interface PointsBalanceCardProps {
  points: number
}

export function PointsBalanceCard({ points }: PointsBalanceCardProps) {
  const { t } = useTranslation()
  return (
    <Card className="md:col-span-2 bg-[#1f224e] border-0 text-white rounded-[2rem] p-8 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[220px]">
      <div className="absolute right-0 top-0 text-white/5 pointer-events-none">
        <Coins className="h-64 w-64 -translate-y-12 translate-x-12" />
      </div>

      <div className="z-10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold tracking-wider uppercase text-white/60">
            {t('points.balanceCard.title', 'Solde Actif du Compte')}
          </span>
          <Badge className="bg-white/10 hover:bg-white/20 border-0 text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3">
            🪙 {t('points.balanceCard.activeAccount', 'Compte Actif')}
          </Badge>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-6xl font-extrabold tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {points}
          </span>
          <span className="text-xl font-semibold text-white/80">{t('points.balanceCard.points', 'points')}</span>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider">
            {t('points.balanceCard.guaranteeTitle', 'Garantie Anti-spéculation Hoodly')}
          </span>
        </div>
        <p className="text-[10px] text-white/60 font-light leading-relaxed max-w-sm">
          {t('points.balanceCard.guaranteeText', 'Hoodly maintient une économie circulaire où chaque point gagné encourage et rémunère le travail de bon voisinage.')}
        </p>
      </div>
    </Card>
  )
}
