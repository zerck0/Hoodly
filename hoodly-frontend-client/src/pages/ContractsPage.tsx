import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { contractsApi } from '../services/api/contracts'
import { useUser } from '../hooks/useUser'
import { FileText, Loader2, Calendar, ArrowRight, ShieldCheck } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { format } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

export default function ContractsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useUser()
  const [filter, setFilter] = useState<'all' | 'pending' | 'signed' | 'completed' | 'cancelled'>('all')

  const dateLocale = i18n.language === 'fr' ? fr : enUS

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['my-contracts', user?.id],
    queryFn: async () => {
      const { data } = await contractsApi.getMe()
      return data
    },
    enabled: !!user?.id,
  })

  const filteredContracts = contracts.filter((c) => {
    if (filter === 'all') return true
    return c.status === filter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{t('contracts.statusPending')}</Badge>
      case 'signed':
        return <Badge className="bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{t('contracts.statusSigned')}</Badge>
      case 'completed':
        return <Badge className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{t('contracts.statusCompleted')}</Badge>
      case 'cancelled':
        return <Badge className="bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{t('contracts.statusCancelled')}</Badge>
      default:
        return <Badge className="bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto pb-24 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-[#1e224e] tracking-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {t('contracts.title')}
          </h1>
          <p className="text-gray-500 mt-1.5 text-sm font-light leading-relaxed">
            {t('contracts.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 bg-slate-100/50 p-1.5 rounded-2xl w-fit border border-slate-200/50">
        {(['all', 'pending', 'signed', 'completed', 'cancelled'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
              filter === tab
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
            }`}
          >
            {tab === 'all' && t('contracts.filterAll')}
            {tab === 'pending' && t('contracts.filterPending')}
            {tab === 'signed' && t('contracts.filterSigned')}
            {tab === 'completed' && t('contracts.filterCompleted')}
            {tab === 'cancelled' && t('contracts.filterCancelled')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center p-24 bg-white rounded-3xl border border-gray-100 shadow-xs">
          <Loader2 className="animate-spin text-[#0c3383]" size={32} />
        </div>
      ) : filteredContracts.length === 0 ? (
        <Card className="p-16 bg-white border border-dashed rounded-[2.5rem] text-center border-gray-200">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-800">{t('contracts.noDocument')}</h3>
          <p className="text-xs text-gray-400 mt-2 max-w-sm mx-auto leading-relaxed font-light">
            {t('contracts.noDocumentDesc')}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContracts.map((contract) => {
            const isClient = contract.clientId?._id === user?.id
            const roleLabel = isClient ? t('contracts.roleClient') : t('contracts.roleProvider')
            const otherParty = isClient ? contract.providerId : contract.clientId

            return (
              <Card
                key={contract._id}
                className="bg-white border border-gray-100 rounded-3xl shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    {getStatusBadge(contract.status)}
                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                      <Calendar size={12} />
                      {format(new Date(contract.createdAt), 'dd MMMM yyyy', { locale: dateLocale })}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {contract.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-light flex items-center gap-1">
                      {t('contracts.role')}<strong className="font-semibold text-[#0c3383]">{roleLabel}</strong>
                    </p>
                  </div>

                  {otherParty && (
                    <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs shrink-0">
                      <img
                        src={otherParty.picture || 'https://via.placeholder.com/150'}
                        alt={otherParty.name}
                        className="w-6 h-6 rounded-full object-cover border border-white"
                      />
                      <div className="truncate">
                        <p className="text-slate-400 font-light text-[9px] uppercase tracking-wider">{t('contracts.withNeighbor')}</p>
                        <p className="text-slate-800 font-semibold truncate">{otherParty.name}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-3">
                    <span className="text-slate-400 font-light">{t('contracts.exchangeValue')}</span>
                    <span className="font-extrabold text-[#0c3383] text-sm">{t('contracts.pointsValue', { price: contract.pricePoints })}</span>
                  </div>
                </div>

                <div className="bg-slate-50 border-t border-slate-100 p-4 flex gap-2 shrink-0">
                  <Button
                    onClick={() => navigate(`/contrats/${contract._id}`)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                  >
                    <span>{t('contracts.viewSign')}</span>
                    <ArrowRight size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <div className="bg-emerald-50/40 border border-emerald-100 rounded-3xl p-5 flex items-start gap-3 max-w-2xl text-xs text-emerald-800 leading-relaxed font-light">
        <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={18} />
        <div>
          <strong className="font-bold">{t('contracts.securityTitle')}</strong>{t('contracts.securityText')}
        </div>
      </div>
    </div>
  )
}
