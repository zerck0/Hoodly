import { useTranslation } from 'react-i18next'
import { useAuthStore } from '../stores/auth.store'

function WaitingPage() {
  const { t } = useTranslation()
  const user = useAuthStore((state) => state.user)

  const messages: Record<string, { title: string; desc: string }> = {
    en_attente_adh: {
      title: t('waiting.membershipRequestedTitle'),
      desc: t('waiting.membershipRequestedDesc'),
    },
    en_attente_zone: {
      title: t('waiting.zoneCreationRequestedTitle'),
      desc: t('waiting.zoneCreationRequestedDesc'),
    },
  }

  const message = user ? messages[user.zoneStatut] : null

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f3ed]">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 text-6xl">⏳</div>
        <h1 className="mb-3 text-2xl font-bold">
          {message?.title ?? t('waiting.defaultTitle')}
        </h1>
        <p className="text-gray-500">
          {message?.desc ?? t('waiting.defaultDesc')}
        </p>
      </div>
    </div>
  )
}

export default WaitingPage
