import { useState } from 'react'
import { SearchBox } from '@mapbox/search-js-react'
import { zonesApi } from '../../services/api/zone'
import { authApi } from '../../services/api/auth'
import type { Zone } from '../../types/zone.types'
import { useAuthStore } from '../../stores/auth.store'
import { useNavigate } from 'react-router-dom'

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

function AddressStep() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const updateUser = useAuthStore((state) => state.updateUser)

  const [addressData, setAddressData] = useState<any>(null)
  const [nearbyZones, setNearbyZones] = useState<Zone[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleRetrieve = async (res: any) => {
    setErrorMessage(null)
    const feature = res.features[0]
    setAddressData(feature)
    setIsSearching(true)
    setHasSearched(true)

    try {
      const [lng, lat] = feature.geometry.coordinates
      const { data } = await zonesApi.findNearby(lat, lng)
      setNearbyZones(data)
    } catch (error) {
      console.error('Erreur lors de la recherche de zones:', error)
      setErrorMessage('Impossible de vérifier les quartiers alentours.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleJoinZone = async (zoneId: string) => {
    setIsSubmitting(true)
    try {
      await zonesApi.intentMembership(zoneId)
      const { data: updatedUser } = await authApi.getMe()
      setUser(updatedUser)
      navigate('/dashboard')
    } catch (error) {
      console.error('Erreur adhésion:', error)
      setErrorMessage('Une erreur est survenue lors de la demande.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequestZone = async () => {
    if (!addressData) return
    setIsSubmitting(true)
    try {
      const [lng, lat] = addressData.geometry.coordinates
      const city = addressData.properties.context?.place?.name || addressData.properties.place_name
      const zip = addressData.properties.context?.postcode?.name || ''

      await zonesApi.createZoneRequest({
        nomQuartier: 'Nouveau quartier',
        ville: city,
        codePostal: zip,
        description: `Adresse : ${addressData.properties.full_address}`,
        latitude: lat,
        longitude: lng
      })

      updateUser({ zoneStatut: 'en_attente_zone' })
      navigate('/waiting')
    } catch (error) {
      console.error(error)
      setErrorMessage('Erreur lors de l\'envoi de la demande.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Où habitez-vous ?</h2>
        <p className="mt-2 text-gray-600">Entrez votre adresse pour trouver votre communauté Hoodly.</p>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
        <SearchBox
          accessToken={MAPBOX_TOKEN}
          onRetrieve={handleRetrieve}
          placeholder="Rechercher mon adresse..."
          value=""
          options={{ country: 'fr', types: 'address' }}
        />
      </div>

      {isSearching && (
        <div className="flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        </div>
      )}

      {hasSearched && !isSearching && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {errorMessage && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div>
          )}
          {nearbyZones.length > 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4 border border-green-100">
                <p className="text-green-800 font-medium">Bonne nouvelle ! {nearbyZones.length} quartier(s) trouvé(s).</p>
              </div>
              <div className="grid gap-4">
                {nearbyZones.map((zone) => (
                  <div key={zone.id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:border-blue-300 transition-colors">
                    <div>
                      <h4 className="font-bold text-gray-900">{zone.nom}</h4>
                      <p className="text-sm text-gray-500">{zone.ville}</p>
                    </div>
                    <button
                      onClick={() => handleJoinZone(zone.id)}
                      disabled={isSubmitting}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isSubmitting ? 'Envoi...' : 'Rejoindre'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4 rounded-xl bg-blue-50 p-8 border border-blue-100">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <span className="text-2xl">📍</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-900">Pas encore de quartier ici</h3>
              <p className="mt-1 text-blue-700">Soyez le premier à lancer Hoodly dans votre zone !</p>
              <button
                onClick={handleRequestZone}
                disabled={isSubmitting}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors shadow-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {isSubmitting ? 'Envoi en cours...' : 'Demander la création du quartier'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default AddressStep
