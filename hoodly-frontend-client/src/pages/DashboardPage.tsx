import { useState } from 'react'
import { useUser } from '../hooks/useUser'
import VerificationModal from '../components/shared/VerificationModal'
import StatusBanner from '../components/dashboard/StatusBanner'
import { CheckCircle2 } from 'lucide-react'

function DashboardPage() {
  const { user, isRefreshing, refreshProfile } = useUser()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <StatusBanner
        user={user ?? null}
        isRefreshing={isRefreshing}
        onRefresh={refreshProfile}
        onOpenModal={() => setIsModalOpen(true)}
      />

      <div className="p-8 flex-1 flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto">
          <div className="rounded-3xl bg-white p-12 text-center shadow-sm border border-gray-100">
             <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <CheckCircle2 size={40} />
             </div>
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Bienvenue dans votre quartier !
            </h1>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Heureux de vous compter parmi nous. Une fois votre compte certifié,
              vous pourrez échanger avec vos voisins, signaler des incidents et participer aux événements locaux.
            </p>
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
