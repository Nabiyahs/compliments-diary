'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IntroModal } from '@/components/modals/intro-modal'
import { AppIcon } from '@/components/ui/app-icon'

/**
 * Root page - Onboarding for logged-out users
 *
 * - Logged out: Shows IntroModal (onboarding) automatically
 * - Logged in: Redirects to /app
 * - After onboarding: Redirects to /login
 */
export default function OnboardingPage() {
  const [loading, setLoading] = useState(true)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        // Logged in - redirect to main app
        router.replace('/app')
      } else {
        // Logged out - show onboarding
        setShowOnboarding(true)
        setLoading(false)
      }
    }

    checkAuth()
  }, [router])

  const handleOnboardingClose = () => {
    // After viewing onboarding, go to login
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <AppIcon name="spinner" className="w-8 h-8 animate-spin text-[#F27430] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800" style={{ fontFamily: 'Caveat, cursive' }}>
            DayPat
          </h1>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* IntroModal shows automatically for onboarding */}
      <IntroModal isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  )
}
