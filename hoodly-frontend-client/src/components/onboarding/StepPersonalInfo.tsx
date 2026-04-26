import { useState } from 'react'
import { useAuthStore } from '../../stores/auth.store'
import { usersApi } from '../../services/api/user'


interface StepPersonalInfoProps {
  onNext: () => void
}

function StepPersonalInfo({ onNext }: StepPersonalInfoProps) {
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await usersApi.updateProfile({ name, phone })
      updateUser(response.data)
      onNext()
    } catch {
      setError('Erreur lors de la mise à jour du profil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <h2 className="mb-2 text-xl font-semibold">Vos informations</h2>
      <p className="mb-6 text-sm text-gray-500">
        Renseignez vos informations personnelles
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Nom complet
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jean Dupont"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
            required
          />
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Téléphone
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+33 6 12 34 56 78"
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Enregistrement...' : 'Suivant'}
        </button>
      </form>
    </div>
  )
}

export default StepPersonalInfo
