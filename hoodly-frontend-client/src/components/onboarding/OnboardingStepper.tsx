interface OnboardingStepperProps {
  currentStep: number
  totalSteps: number
}

function OnboardingStepper({ currentStep, totalSteps }: OnboardingStepperProps) {
  return (
    <div className="flex items-center justify-center gap-4 py-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
              step <= currentStep
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {step < currentStep ? '✓' : step}
          </div>

          {step < totalSteps && (
            <div
              className={`mx-2 h-1 w-16 transition-colors ${
                step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

export default OnboardingStepper
