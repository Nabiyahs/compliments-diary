'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface StampOverlayProps {
  /** Whether to show the stamp (entry exists) */
  show: boolean
  /** Trigger the stamp animation (after save success) */
  playAnimation: boolean
  /** Callback when animation completes */
  onAnimationComplete?: () => void
}

/**
 * Stamp overlay for Day View polaroid card.
 * Shows a "compliment seal" stamp with a "thump" animation on save.
 * Only used in Day View - never rendered in month/week views.
 */
export function StampOverlay({
  show,
  playAnimation,
  onAnimationComplete,
}: StampOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (playAnimation && show) {
      setIsAnimating(true)
      // Animation duration: 400ms
      const timer = setTimeout(() => {
        setIsAnimating(false)
        onAnimationComplete?.()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [playAnimation, show, onAnimationComplete])

  if (!show) return null

  return (
    <div
      className={cn(
        'absolute bottom-6 right-2 z-30 pointer-events-none',
        isAnimating ? 'animate-stamp-thump' : 'opacity-90'
      )}
    >
      <img
        src="/image/compliment-seal.jpg"
        alt="Compliment seal"
        className="w-20 h-20 object-contain rounded-full shadow-md"
        draggable={false}
      />
    </div>
  )
}
