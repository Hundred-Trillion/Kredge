import { Check } from 'lucide-react'

export default function StepIndicator({ steps, currentStep }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const isUpcoming = index > currentStep

        return (
          <div key={index} className="flex items-center">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold
                  transition-all duration-300 border-2
                  ${isCompleted
                    ? 'bg-electric border-electric text-white'
                    : isCurrent
                      ? 'bg-electric/10 border-electric text-electric'
                      : 'bg-navy-800 border-surface-border text-navy-400'
                  }
                `}
              >
                {isCompleted ? (
                  <Check size={16} className="text-white" />
                ) : (
                  index + 1
                )}
              </div>
              <span className={`text-xs mt-2 font-medium whitespace-nowrap ${
                isCurrent ? 'text-electric' : isCompleted ? 'text-white' : 'text-navy-400'
              }`}>
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-3 mb-6 rounded-full transition-all duration-300 ${
                isCompleted ? 'bg-electric' : 'bg-surface-border'
              }`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
