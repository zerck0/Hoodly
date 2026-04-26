import { useState } from 'react'
import { zonesApi } from '../../services/api/zone'
import { authApi } from '../../services/api/auth'
import { useAuthStore } from '../../stores/auth.store'

interface VerificationModalProps {
  isOpen: boolean
  onClose: () => void
}

function VerificationModal({ isOpen, onClose }: VerificationModalProps) {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)

  const [justificatif, setJustificatif] = useState<File | null>(null)
  const [pieceIdentite, setPieceIdentite] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!justificatif || !pieceIdentite) {
      setError('Veuillez sélectionner les deux documents.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: resJustif } = await zonesApi.uploadFile(justificatif)
      const { data: resId } = await zonesApi.uploadFile(pieceIdentite)

      await zonesApi.createMembership({
        zoneId: user?.zoneId || '',
        justificatifUrl: resJustif.fileUrl,
        pieceIdentiteUrl: resId.fileUrl,
      })

      const { data: updatedUser } = await authApi.getMe()
      setUser(updatedUser)

      onClose()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de l\'envoi des documents.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <h3 className="text-xl font-bold text-gray-900">Vérifier mon compte</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
        </div>

        <p className="text-sm text-gray-600 mb-6">
          Pour garantir la sécurité de la communauté, nous devons vérifier que vous habitez bien dans ce quartier.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Justificatif de domicile
            </label>
            <p className="text-xs text-gray-500 mb-2">Facture EDF, loyer, etc. (moins de 3 mois)</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setJustificatif(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Pièce d'identité
            </label>
            <p className="text-xs text-gray-500 mb-2">Carte d'identité ou Passeport</p>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setPieceIdentite(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !justificatif || !pieceIdentite}
              className="flex-1 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
            >
              {loading ? 'Envoi...' : 'Vérifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default VerificationModal
