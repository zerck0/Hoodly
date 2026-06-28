/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import StepPersonalInfo from '../components/onboarding/StepPersonalInfo'
import AddressStep from '../components/onboarding/AddressStep'
import RecapStep from '../components/onboarding/RecapStep'
import { useAuthStore } from '../stores/auth.store'
import { zonesApi } from '../services/api/zone'
import { authApi } from '../services/api/auth'
import type { Zone } from '../types/zone.types'
import { ZoneMembershipStatus } from '../types/status.enum'

function OnboardingPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((state) => state.setUser)
  const updateUser = useAuthStore((state) => state.updateUser)
  const user = useAuthStore((state) => state.user)

  const [currentStep, setCurrentStep] = useState(1)

  const [addressData, setAddressData] = useState<any>(null)
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null)
  const [isRequestingNewZone, setIsRequestingNewZone] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleAddressSelection = (data: { addressData: any; selectedZone: Zone | null; isRequestingNewZone: boolean }) => {
    setAddressData(data.addressData)
    setSelectedZone(data.selectedZone)
    setIsRequestingNewZone(data.isRequestingNewZone)
    setCurrentStep(3)
  }

  const handleFinalConfirm = async () => {
    setErrorMessage(null)
    setIsSubmitting(true)
    try {
      if (isRequestingNewZone && addressData) {
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

        updateUser({ zoneStatut: ZoneMembershipStatus.PENDING_ZONE })
        navigate('/waiting')
      } else if (selectedZone) {
        await zonesApi.intentMembership(selectedZone.id)
        const { data: updatedUser } = await authApi.getMe()
        setUser(updatedUser)
        navigate('/dashboard')
      } else {
        setErrorMessage('Adresse ou quartier non valide pour l\'inscription.')
      }
    } catch (error) {
      console.error(error)
      setErrorMessage('Une erreur est survenue lors de la validation. Veuillez réessayer.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <OnboardingStepper currentStep={currentStep} totalSteps={3} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {user?.refusalReason && (user.refusalType === 'zone' || user.refusalType === 'membership') && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <span className="text-xl font-bold">!</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">
                  {user.refusalType === 'zone' ? 'Demande de création de quartier refusée' : 'Adhésion au quartier refusée'}
                </h3>
                <p className="mt-1 text-sm text-red-700">
                  Votre précédente demande n'a pas pu être acceptée pour le motif suivant :
                </p>
                <div className="mt-3 rounded-lg bg-white/50 p-3 text-sm font-medium italic text-red-800 border border-red-100">
                  "{user.refusalReason}"
                </div>
                <p className="mt-3 text-xs text-red-600">
                  Vous pouvez modifier vos informations et tenter une nouvelle demande.
                </p>
              </div>
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <StepPersonalInfo onNext={() => setCurrentStep(2)} />
        )}

        {currentStep === 2 && (
          <AddressStep 
            onNext={handleAddressSelection} 
            onBack={() => setCurrentStep(1)} 
          />
        )}

        {currentStep === 3 && (
          <RecapStep
            addressData={addressData}
            selectedZone={selectedZone}
            isRequestingNewZone={isRequestingNewZone}
            onBackToStep1={() => setCurrentStep(1)}
            onBackToStep2={() => setCurrentStep(2)}
            onConfirm={handleFinalConfirm}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
          />
        )}
      </div>
    </div>
  )
}

export default OnboardingPage
