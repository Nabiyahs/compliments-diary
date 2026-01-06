'use client'

import { useState, ReactNode, use } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2 } from 'lucide-react'
import { DailyPreview, WeeklyPreview, MonthlyPreview } from '@/components/onboarding'
import { getDictionarySync, type Locale, i18n, isValidLocale } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'

const ONBOARDING_KEY = 'onboarding_completed'

interface OnboardingStep {
  title: string
  description: string
  preview: ReactNode
}

type Props = {
  params: Promise<{ locale: string }>
}

export default function OnboardingPage({ params }: Props) {
  const { locale: localeParam } = use(params)
  const locale: Locale = isValidLocale(localeParam) ? localeParam : i18n.defaultLocale
  const dict = getDictionarySync(locale)

  const STEPS: OnboardingStep[] = [
    {
      title: dict.onboarding.steps.daily.title,
      description: dict.onboarding.steps.daily.description,
      preview: <DailyPreview />,
    },
    {
      title: dict.onboarding.steps.weekly.title,
      description: dict.onboarding.steps.weekly.description,
      preview: <WeeklyPreview />,
    },
    {
      title: dict.onboarding.steps.monthly.title,
      description: dict.onboarding.steps.monthly.description,
      preview: <MonthlyPreview />,
    },
  ]

  const [currentStep, setCurrentStep] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(false)
  const router = useRouter()

  /**
   * Complete onboarding and navigate based on auth state.
   * If user is logged in -> go to app
   * If not logged in -> go to login
   */
  const completeOnboarding = async () => {
    setIsCheckingAuth(true)
    localStorage.setItem(ONBOARDING_KEY, 'true')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // User is already logged in, go directly to app
        router.replace(`/${locale}/app`)
      } else {
        // User not logged in, go to login
        router.replace(`/${locale}/login`)
      }
    } catch {
      // On error, default to login
      router.replace(`/${locale}/login`)
    }
  }

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentStep(currentStep + 1)
        setIsTransitioning(false)
      }, 150)
    } else {
      // Final step - complete onboarding and check auth
      completeOnboarding()
    }
  }

  const handleSkip = () => {
    completeOnboarding()
  }

  const step = STEPS[currentStep]
  const isLastStep = currentStep === STEPS.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Skip button - always visible in top-right */}
      <div className="absolute top-4 right-4 z-10 safe-area-inset-top">
        <button
          onClick={handleSkip}
          disabled={isCheckingAuth}
          className="text-gray-500 hover:text-gray-700 text-sm font-medium px-3 py-2 transition-colors disabled:opacity-50"
        >
          {dict.onboarding.skip}
        </button>
      </div>

      {/* Main content - scrollable area for preview */}
      <div className="flex-1 flex flex-col items-center pt-8 pb-4 px-4 overflow-y-auto">
        <div
          className={`transition-all duration-150 w-full ${
            isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
          }`}
        >
          {/* Preview - the actual reference design */}
          <div className="flex justify-center mb-6">
            {step.preview}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-gray-800 text-center mb-2">
            {step.title}
          </h1>

          {/* Description */}
          <p className="text-gray-600 text-center text-sm leading-relaxed max-w-xs mx-auto">
            {step.description}
          </p>
        </div>
      </div>

      {/* Bottom section - fixed to bottom */}
      <div className="flex-shrink-0 p-6 pb-8 safe-area-inset-bottom bg-gradient-to-t from-amber-50 via-amber-50/80 to-transparent">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentStep
                  ? 'w-6 bg-[#F2B949]'
                  : index < currentStep
                  ? 'w-2 bg-amber-300'
                  : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>

        {/* Action button */}
        <button
          onClick={handleNext}
          disabled={isCheckingAuth}
          className="w-full bg-gradient-to-r from-[#F2B949] to-[#F27430] hover:from-[#EDD377] hover:to-[#F2B949] disabled:opacity-70 text-white font-semibold py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98]"
        >
          {isCheckingAuth ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isLastStep ? (
            dict.onboarding.startJourney
          ) : (
            <>
              {dict.onboarding.next}
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
