import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUser } from '../hooks/useUser'
import VerificationModal from '../components/shared/VerificationModal'
import StatusBanner from '../components/dashboard/StatusBanner'
import { Feed } from '../components/dashboard/feed/Feed'
import { CreatePostForm } from '../components/dashboard/feed/CreatePostForm'
import { ZoneMembershipStatus } from '../types/status.enum'

function DashboardPage() {
  const { t } = useTranslation()
  const { user, isRefreshing, refreshProfile } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const hasZone = !!user?.zoneId;
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE;

  return (
    <div className="font-sans flex flex-col h-full bg-slate-50 dark:bg-gray-950 min-h-screen pb-12">
      <StatusBanner
        user={user ?? null}
        isRefreshing={isRefreshing}
        onRefresh={refreshProfile}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <main className="flex-1 max-w-3xl w-full mx-auto p-4 md:p-6 lg:p-8">
        {!hasZone ? (
          <div className="rounded-2xl bg-white dark:bg-gray-900 p-12 text-center shadow-sm border border-gray-100 dark:border-gray-800">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              {t('dashboard.welcome')}
            </h1>
            <p className="mt-4 text-muted-foreground dark:text-gray-400 text-lg">
              {t('dashboard.joinNeighborhoodPrompt')}
            </p>
          </div>
        ) : (
          <>
            {isVerified && <CreatePostForm zoneId={user.zoneId!} />}
            <Feed zoneId={user.zoneId!} />
          </>
        )}
      </main>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default DashboardPage
