'use client'

import { useRef, useCallback } from 'react'

interface UseSwipeNavOptions {
  /** Called when user swipes right (go to previous) */
  onSwipeRight?: () => void
  /** Called when user swipes left (go to next) */
  onSwipeLeft?: () => void
  /** Minimum horizontal distance to trigger navigation (default: 60px or 8% of screen width) */
  minSwipeDistance?: number
  /** Maximum time in ms for a valid swipe (default: 800ms) */
  maxSwipeTime?: number
  /** Whether swipe navigation is enabled (default: true) */
  enabled?: boolean
}

interface SwipeState {
  startX: number
  startY: number
  startTime: number
  isTracking: boolean
  hasTriggered: boolean
  pointerId: number | null
}

/**
 * Elements that should not trigger swipe navigation
 */
const EXCLUDED_ELEMENTS = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A']

/**
 * Check if an element or its ancestors should exclude swipe navigation
 */
function shouldExcludeElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof HTMLElement)) return false

  let current: HTMLElement | null = element

  while (current) {
    // Check for excluded tag names
    if (EXCLUDED_ELEMENTS.includes(current.tagName)) {
      return true
    }

    // Check for contentEditable
    if (current.isContentEditable) {
      return true
    }

    // Check for opt-out attribute
    if (current.dataset.noSwipeNav === 'true') {
      return true
    }

    // Check for Moveable controls (sticker dragging)
    if (current.classList.contains('moveable-control') ||
        current.classList.contains('moveable-line') ||
        current.closest('.moveable-control-box')) {
      return true
    }

    current = current.parentElement
  }

  return false
}

/**
 * Hook for handling swipe gestures to navigate between days.
 * Swipe right = previous day, swipe left = next day.
 *
 * Features:
 * - Works on touch and pointer devices
 * - Doesn't interfere with vertical scrolling
 * - Excludes form elements, buttons, and elements with data-no-swipe-nav
 * - Prevents duplicate triggers
 */
export function useSwipeNav({
  onSwipeRight,
  onSwipeLeft,
  minSwipeDistance,
  maxSwipeTime = 800,
  enabled = true,
}: UseSwipeNavOptions) {
  const stateRef = useRef<SwipeState>({
    startX: 0,
    startY: 0,
    startTime: 0,
    isTracking: false,
    hasTriggered: false,
    pointerId: null,
  })

  // Calculate minimum swipe distance dynamically
  const getMinDistance = useCallback(() => {
    if (minSwipeDistance !== undefined) return minSwipeDistance
    // Use 60px or 8% of screen width, whichever is smaller
    return Math.min(60, window.innerWidth * 0.08)
  }, [minSwipeDistance])

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (!enabled) return

    // Skip if element should be excluded
    if (shouldExcludeElement(e.target)) return

    // Only track primary pointer (first finger or left mouse button)
    if (!e.isPrimary) return

    const state = stateRef.current
    state.startX = e.clientX
    state.startY = e.clientY
    state.startTime = Date.now()
    state.isTracking = true
    state.hasTriggered = false
    state.pointerId = e.pointerId
  }, [enabled])

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const state = stateRef.current

    if (!state.isTracking || state.hasTriggered) return
    if (state.pointerId !== e.pointerId) return

    const dx = e.clientX - state.startX
    const dy = e.clientY - state.startY
    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // Check if horizontal movement is dominant (|dx| > |dy| * 1.2)
    const isHorizontalSwipe = absDx > absDy * 1.2

    // If vertical movement is dominant, stop tracking (user is scrolling)
    if (absDy > absDx * 1.2 && absDy > 10) {
      state.isTracking = false
      return
    }

    // Check if we've met the threshold for triggering
    const minDist = getMinDistance()
    const elapsed = Date.now() - state.startTime

    if (isHorizontalSwipe && absDx >= minDist && elapsed <= maxSwipeTime) {
      state.hasTriggered = true
      state.isTracking = false

      if (dx > 0) {
        // Swiped right -> go to previous day
        onSwipeRight?.()
      } else {
        // Swiped left -> go to next day
        onSwipeLeft?.()
      }
    }
  }, [getMinDistance, maxSwipeTime, onSwipeRight, onSwipeLeft])

  const handlePointerUp = useCallback((e: PointerEvent) => {
    const state = stateRef.current

    if (state.pointerId !== e.pointerId) return

    // Reset state
    state.isTracking = false
    state.pointerId = null
  }, [])

  const handlePointerCancel = useCallback((e: PointerEvent) => {
    const state = stateRef.current

    if (state.pointerId !== e.pointerId) return

    // Reset state
    state.isTracking = false
    state.hasTriggered = false
    state.pointerId = null
  }, [])

  // Return event handlers to be spread on the container element
  const getSwipeHandlers = useCallback(() => ({
    onPointerDown: (e: React.PointerEvent) => handlePointerDown(e.nativeEvent),
    onPointerMove: (e: React.PointerEvent) => handlePointerMove(e.nativeEvent),
    onPointerUp: (e: React.PointerEvent) => handlePointerUp(e.nativeEvent),
    onPointerCancel: (e: React.PointerEvent) => handlePointerCancel(e.nativeEvent),
  }), [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel])

  // Also support ref-based binding for more flexibility
  const bindSwipeHandlers = useCallback((element: HTMLElement | null) => {
    if (!element) return

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerCancel)

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerCancel)
    }
  }, [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel])

  return {
    getSwipeHandlers,
    bindSwipeHandlers,
  }
}
