import { useState } from 'react'
import { useUser } from '../hooks/useUser'
import VerificationModal from '../components/shared/VerificationModal'
import StatusBanner from '../components/dashboard/StatusBanner'
import api from '../lib/axios'

function DashboardPage() {
  const { user, isRefreshing, refreshProfile } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="font-sans flex flex-col h-full">
      <StatusBanner
        user={user ?? null}
        isRefreshing={isRefreshing}
        onRefresh={refreshProfile}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <div className="p-8 flex-1 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-gray-100">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Bienvenue dans votre quartier !
            </h1>
            <button
              onClick={() => api.get('/route-qui-n-existe-pas')}
              className="mt-8 bg-red-500 text-white px-4 py-2 rounded-lg"
            >
              Tester l'erreur !
            </button>
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}

export default DashboardPage
