'use client'

import { useRef, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { toPng } from 'html-to-image'
import { AppIcon } from '@/components/ui/app-icon'
import { Toast, useToast } from '@/components/ui/toast'
import { useDayCard } from '@/hooks/use-day-card'
import { useSwipeNav } from '@/hooks/use-swipe-nav'
import { formatDateString, parseDateString } from '@/lib/utils'
import {
  nextPaint,
  waitForImages,
  prepareImagesForCapture,
  replaceImageSrcsWithDataUrls,
  createOffscreenClone,
  assertNonEmptyRect,
  CaptureError,
} from '@/lib/image-utils'
import { PolaroidCard, type PolaroidCardRef } from './polaroid-card'

const DEBUG = process.env.NODE_ENV === 'development'

// Export target dimensions
const EXPORT_TARGETS = {
  instagram_post: { width: 1080, height: 1080 },
  instagram_story: { width: 1080, height: 1920 },
  instagram_reel: { width: 1080, height: 1920 },
} as const

type ExportTarget = keyof typeof EXPORT_TARGETS

// Background color for letterbox areas
const EXPORT_BG_COLOR = '#FFFDF8'

// Timeout for image preloading (ms)
const IMAGE_PRELOAD_TIMEOUT = 4000

interface DayViewProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onClose?: () => void
}

export function DayView({ selectedDate, onDateChange }: DayViewProps) {
  const date = parseDateString(selectedDate)
  const dateStr = formatDateString(date)
  const polaroidRef = useRef<PolaroidCardRef>(null)
  const dayViewRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const { toast, showToast, hideToast } = useToast()

  const { dayCard, photoSignedUrl, loading, saving: cardSaving, error, upsertDayCard, toggleLike, setEditingState } = useDayCard(dateStr)

  /**
   * Capture ONLY the Polaroid container as image and scale to target canvas.
   * Returns a data URL of the final image.
   *
   * IMPORTANT: Captures ONLY the polaroid card, NOT the entire DayView.
   * This ensures SNS share images contain just the polaroid without UI elements.
   *
   * Key steps:
   * 1. Get polaroid container element from PolaroidCard ref
   * 2. Set data-exporting attribute (hides stamp, removes shadow via CSS)
   * 3. Wait for fonts and images to load
   * 4. Create offscreen clone with proper positioning
   * 5. Capture the clone
   * 6. Scale to Instagram target dimensions
   */
  const capturePolaroid = async (target: ExportTarget): Promise<string> => {
    // Get the polaroid container element from PolaroidCard ref
    const polaroidEl = polaroidRef.current?.getExportElement()
    if (!polaroidEl) throw new CaptureError('Polaroid container not found')

    if (DEBUG) console.log('[DayView] Starting polaroid capture for target:', target)

    // Step 1: Validate source element
    assertNonEmptyRect(polaroidEl, 'Polaroid source')
    if (DEBUG) console.log('[DayView] Polaroid source validated')

    // Step 2: Set exporting mode on source (for CSS to hide stamp/shadow)
    polaroidEl.setAttribute('data-exporting', 'true')

    try {
      // Step 3: Ensure fonts are loaded
      await document.fonts.ready
      if (DEBUG) console.log('[DayView] Fonts ready')

      // Step 4: Wait for layout/paint stabilization
      await nextPaint()
      if (DEBUG) console.log('[DayView] Paint stabilized')

      // Step 5: Preload all images and convert to dataURLs (CORS safety)
      const imageUrlMap = await prepareImagesForCapture(polaroidEl, { timeoutMs: IMAGE_PRELOAD_TIMEOUT })
      if (DEBUG) console.log('[DayView] Images preloaded:', imageUrlMap.size)

      // Step 6: Create offscreen clone with PROPER positioning
      const { clone, cleanup } = createOffscreenClone(polaroidEl, {
        backgroundColor: EXPORT_BG_COLOR,
      })

      try {
        // Ensure clone also has exporting attribute
        clone.setAttribute('data-exporting', 'true')

        // Step 7: Replace image srcs with dataURLs in the clone
        replaceImageSrcsWithDataUrls(clone, imageUrlMap)
        if (DEBUG) console.log('[DayView] Clone images replaced with dataURLs')

        // Step 8: Wait for clone images to fully load
        await nextPaint()
        await waitForImages(clone, { timeoutMs: 3000 })
        if (DEBUG) console.log('[DayView] Clone images loaded')

        // Step 9: Validate clone dimensions before capture
        clone.style.transform = 'translateX(0)'
        await nextPaint()
        assertNonEmptyRect(clone, 'Polaroid clone')
        if (DEBUG) console.log('[DayView] Clone validated')

        // Step 10: Capture the clone at high resolution (2x for quality)
        const pixelRatio = 2
        const dataUrl = await toPng(clone, {
          pixelRatio,
          backgroundColor: EXPORT_BG_COLOR,
          cacheBust: true,
          skipFonts: false,
          filter: (node: HTMLElement) => {
            // Exclude welcome screen if somehow present
            if (node.id === 'welcome-screen') return false
            // Exclude elements marked for export exclusion (e.g., edit buttons)
            if (node.dataset?.exportExclude === 'true') return false
            return true
          },
        })

        // Verify captured data is not blank
        if (!dataUrl || dataUrl.length < 200) {
          throw new CaptureError('Captured image is blank or too small', {
            dataUrlLength: dataUrl?.length ?? 0,
          })
        }
        if (DEBUG) console.log('[DayView] Polaroid captured, dataUrl length:', dataUrl.length)

        // Load the captured image
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve()
          img.onerror = () => reject(new CaptureError('Failed to load captured image'))
          img.src = dataUrl
        })

        // Get target dimensions
        const targetDim = EXPORT_TARGETS[target]
        const canvas = document.createElement('canvas')
        canvas.width = targetDim.width
        canvas.height = targetDim.height
        const ctx = canvas.getContext('2d')!

        // Fill background
        ctx.fillStyle = EXPORT_BG_COLOR
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Calculate "contain" scaling - maximize size while maintaining aspect ratio
        const srcW = img.naturalWidth
        const srcH = img.naturalHeight
        const scale = Math.min(targetDim.width / srcW, targetDim.height / srcH)
        const drawW = srcW * scale
        const drawH = srcH * scale
        const offsetX = (targetDim.width - drawW) / 2
        const offsetY = (targetDim.height - drawH) / 2

        // Draw the captured image centered with contain scaling
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH)

        if (DEBUG) console.log('[DayView] Final canvas created')
        return canvas.toDataURL('image/png')
      } finally {
        // Always clean up the clone
        cleanup()
      }
    } finally {
      // Always remove exporting attribute from source
      polaroidEl.removeAttribute('data-exporting')
    }
  }

  // Share handler for action bar (with toast feedback)
  const handleShareFromActionBar = async () => {
    // Prevent duplicate clicks while sharing is in progress
    if (sharing) {
      if (DEBUG) console.log('[DayView] Share blocked - already sharing')
      return
    }

    // Must have a saved photo to share
    if (!dayCard?.photo_path) {
      if (DEBUG) console.log('[DayView] Share blocked - no photo')
      return
    }

    if (DEBUG) console.log('[DayView] Starting share flow')

    // Set loading states BEFORE any async operations
    setSharing(true)
    setIsExporting(true)

    try {
      // Small delay to ensure React re-renders with isExporting=true
      // This allows the slogan to appear instead of timestamp
      await new Promise(resolve => setTimeout(resolve, 100))

      // Capture ONLY the Polaroid container (NOT entire DayView)
      if (DEBUG) console.log('[DayView] Capturing Polaroid...')
      const dataUrl = await capturePolaroid('instagram_post')
      if (DEBUG) console.log('[DayView] Polaroid capture complete')

      // Convert to blob for sharing
      const response = await fetch(dataUrl)
      const blob = await response.blob()
      const file = new File([blob], `day-pat-${dateStr}.png`, { type: 'image/png' })

      // Try Web Share API first
      if (navigator.canShare?.({ files: [file] })) {
        if (DEBUG) console.log('[DayView] Using Web Share API')
        try {
          await navigator.share({ files: [file] })
          showToast('Successfully done!', 'success')
        } catch (err) {
          if ((err as Error).name === 'AbortError') {
            // User cancelled - don't show toast, but this is NOT an error
            if (DEBUG) console.log('[DayView] Share cancelled by user')
          } else {
            // Share failed, fallback to download
            if (DEBUG) console.log('[DayView] Share failed, falling back to download:', err)
            downloadDataUrl(dataUrl, `day-pat-${dateStr}.png`)
            showToast('Successfully done!', 'success')
          }
        }
      } else {
        // Fallback to download
        if (DEBUG) console.log('[DayView] Web Share not available, downloading')
        downloadDataUrl(dataUrl, `day-pat-${dateStr}.png`)
        showToast('Successfully done!', 'success')
      }
    } catch (err) {
      console.error('[DayView] Share failed:', err)
      // Provide more specific error messages for debugging
      if (err instanceof CaptureError) {
        console.error('[DayView] CaptureError details:', err.details)
        showToast('Failed to capture image', 'error')
      } else {
        showToast('Something went wrong', 'error')
      }
    } finally {
      // ALWAYS reset loading states, regardless of success/failure/cancel
      if (DEBUG) console.log('[DayView] Share flow complete, resetting states')
      setIsExporting(false)
      setSharing(false)
    }
  }

  // Helper function to download data URL
  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a')
    link.href = dataUrl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const goToPrevDay = useCallback(() => {
    const prev = new Date(date)
    prev.setDate(prev.getDate() - 1)
    onDateChange(formatDateString(prev))
  }, [date, onDateChange])

  const goToNextDay = useCallback(() => {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    onDateChange(formatDateString(next))
  }, [date, onDateChange])

  // Swipe navigation: right = prev day, left = next day
  const { getSwipeHandlers } = useSwipeNav({
    onSwipeRight: goToPrevDay,
    onSwipeLeft: goToNextDay,
  })

  const handleSave = async (updates: {
    photo_url?: string | null
    caption?: string | null
    sticker_state?: import('@/types/database').StickerState[]
  }): Promise<{ success: boolean; error?: string; refreshError?: string }> => {
    return await upsertDayCard(updates)
  }

  return (
    <div
      ref={dayViewRef}
      className="pb-6"
      style={{ touchAction: 'pan-y' }}
      {...getSwipeHandlers()}
    >
      {/* Date Navigation - compact header */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <button
            onClick={goToPrevDay}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
          >
            <AppIcon name="chevron-left" className="w-5 h-5 text-gray-600" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-bold text-gray-800">
              {format(date, 'MMMM d')}
            </h2>
            <p className="text-xs text-gray-500">
              {format(date, 'EEEE, yyyy')}
            </p>
          </div>

          <button
            onClick={goToNextDay}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
          >
            <AppIcon name="chevron-right" className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Polaroid Card - constrained width with side margins */}
      <div className="px-4">
        <PolaroidCard
          ref={polaroidRef}
          dayCard={dayCard}
          photoSignedUrl={photoSignedUrl}
          date={dateStr}
          loading={loading}
          onSave={handleSave}
          onToggleLike={toggleLike}
          onShare={handleShareFromActionBar}
          saving={cardSaving}
          sharing={sharing}
          saveError={error}
          onEditingChange={setEditingState}
          isExporting={isExporting}
        />
      </div>

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}
