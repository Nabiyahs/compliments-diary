'use client'

import { useEffect } from 'react'

// Extend Window interface for TypeScript
declare global {
  interface Window {
    __hideWelcomeScreen?: () => void
  }
}

/**
 * Client component that hides the welcome screen after React hydration.
 * This ensures the welcome screen stays visible until the app is fully ready.
 */
export function WelcomeScreenHider() {
  useEffect(() => {
    // Hide welcome screen after hydration is complete
    // Small delay ensures the underlying content is rendered
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && window.__hideWelcomeScreen) {
        window.__hideWelcomeScreen()
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [])

  // This component doesn't render anything
  return null
}
