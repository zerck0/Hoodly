import { Loader2, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { User } from '../../types/user.types'
import { ZoneMembershipStatus } from '../../types/status.enum'

interface StatusBannerProps {
  user: User | null
  isRefreshing: boolean
  onRefresh: () => void
  onOpenModal: () => void
}

export default function StatusBanner({ user, isRefreshing, onRefresh, onOpenModal }: StatusBannerProps) {
  const isPendingUpload = user?.zoneStatut === ZoneMembershipStatus.PENDING_MEMBERSHIP
  const isProcessing = user?.zoneStatut === ZoneMembershipStatus.VERIF_EN_COURS
  const isRefused = user?.refusalReason && user?.refusalType === 'membership'

  if (!isPendingUpload && !isProcessing) {
    return null
  }

  return (
    <div className={`border-b p-4 transition-all duration-500 ${
      isRefused ? 'bg-red-50 border-red-200' :
      isProcessing ? 'bg-blue-50 border-blue-200' :
      'bg-amber-50 border-amber-200'
    }`}>
      <div className="mx-auto max-w-7xl flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            isRefused ? 'bg-red-100 text-red-600' :
            isProcessing ? 'bg-blue-100 text-blue-600' :
            'bg-amber-100 text-amber-600'
          }`}>
            {isRefused ? <AlertCircle size={20} /> :
             isProcessing ? <Clock size={20} className="animate-pulse" /> :
             <CheckCircle2 size={20} />}
          </div>
          <div>
            <p className={`font-bold ${
              isRefused ? 'text-red-900' :
              isProcessing ? 'text-blue-900' :
              'text-amber-900'
            }`}>
              {isRefused ? 'Vérification refusée' :
               isProcessing ? 'Vérification en cours' :
               'Action requise : Vérifiez votre compte'}
            </p>
            <p className={`text-sm ${
              isRefused ? 'text-red-700' :
              isProcessing ? 'text-blue-700' :
              'text-amber-700'
            }`}>
              {isRefused
                ? `Motif : ${user?.refusalReason}. Merci de renvoyer des justificatifs lisibles.`
                : isProcessing
                ? 'Nos modérateurs examinent vos documents. Vous recevrez un accès complet sous peu.'
                : 'Pour interagir avec la communauté, merci de nous transmettre un justificatif de domicile.'
              }
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
            title="Actualiser le statut"
          >
            <Loader2 size={18} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onOpenModal}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all shadow-lg ${
              isRefused ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' :
              isProcessing ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20' :
              'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20'
            }`}
          >
            {isProcessing || isRefused ? 'Modifier les documents' : 'Vérifier mon compte'}
          </button>
        </div>
      </div>
    </div>
  )
}