import { useState } from 'react'
import OnboardingStepper from '../components/onboarding/OnboardingStepper'
import StepPersonalInfo from '../components/onboarding/StepPersonalInfo'
import AddressStep from '../components/onboarding/AddressStep'
import { useAuthStore } from '../stores/auth.store'

function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const user = useAuthStore((state) => state.user)

  return (
    <div className="min-h-screen bg-[#f5f3ed]">
      <OnboardingStepper currentStep={currentStep} totalSteps={2} />

      <div className="mx-auto max-w-2xl px-4 py-6">
        {user?.refusalReason && user?.refusalType === 'zone' && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <span className="text-xl font-bold">!</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-red-900">Demande de quartier refusée</h3>
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

        {currentStep === 2 && <AddressStep />}
      </div>
    </div>
  )
}

export default OnboardingPage
