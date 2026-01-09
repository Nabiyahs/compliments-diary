'use client'

import { useState, useEffect, useMemo } from 'react'
import { jsPDF } from 'jspdf'
import { AppIcon } from '@/components/ui/app-icon'
import { cn } from '@/lib/utils'
import { buildPdfPages, type ExportMode, type PageImage } from '@/lib/export-view-renderer'
import { format, startOfWeek, startOfMonth, subMonths } from 'date-fns'

/**
 * View-Based Export Modal with Date Range Selection
 *
 * Export Types:
 * - Day: One polaroid per day in range
 * - Week: Multi-page week views for each week in range
 * - Month: Calendar grid for each month in range
 * - Favorites: Polaroid grid of favorited entries in range
 *
 * Date Range: Independent from main page toggle state
 */

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  activeView: 'day' | 'week' | 'month'
  selectedDate: string // YYYY-MM-DD format (used as default for date range)
}

// Export mode options with labels and descriptions
const EXPORT_MODES: Array<{
  value: ExportMode
  label: string
  description: string
  icon: 'calendar' | 'calendar' | 'calendar' | 'heart'
  color: string
  bgColor: string
}> = [
  {
    value: 'day',
    label: 'Day',
    description: 'Polaroid per day',
    icon: 'calendar',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    value: 'week',
    label: 'Week',
    description: 'Week cards (multi-page)',
    icon: 'calendar',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    value: 'month',
    label: 'Month',
    description: 'Calendar grid',
    icon: 'calendar',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  {
    value: 'favorites',
    label: 'Favorites',
    description: 'Liked entries only',
    icon: 'heart',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
]

// Get filename based on export mode and date range
function getFilename(mode: ExportMode, fromDate: string, toDate: string): string {
  const fromStr = fromDate.replace(/-/g, '')
  const toStr = toDate.replace(/-/g, '')

  switch (mode) {
    case 'day':
      return `DayPat_Days_${fromStr}-${toStr}.pdf`
    case 'week':
      return `DayPat_Weeks_${fromStr}-${toStr}.pdf`
    case 'month':
      return `DayPat_Months_${fromStr}-${toStr}.pdf`
    case 'favorites':
      return `DayPat_Favorites_${fromStr}-${toStr}.pdf`
    default:
      return 'DayPat_Export.pdf'
  }
}

// Generate PDF from page images
async function generatePdfFromPages(pages: PageImage[], filename: string): Promise<void> {
  if (pages.length === 0) {
    throw new Error('No pages to export')
  }

  // Create PDF with A4 dimensions
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]

    if (i > 0) {
      pdf.addPage()
    }

    // Calculate scaling to fit image on page while maintaining aspect ratio
    const imgAspect = page.width / page.height
    const pageAspect = pageWidth / pageHeight

    let imgWidth: number
    let imgHeight: number

    if (imgAspect > pageAspect) {
      // Image is wider - fit to width
      imgWidth = pageWidth
      imgHeight = pageWidth / imgAspect
    } else {
      // Image is taller - fit to height
      imgHeight = pageHeight
      imgWidth = pageHeight * imgAspect
    }

    // Center image on page
    const x = (pageWidth - imgWidth) / 2
    const y = (pageHeight - imgHeight) / 2

    // Add image to PDF
    pdf.addImage(page.dataUrl, 'PNG', x, y, imgWidth, imgHeight)
  }

  // Save PDF
  pdf.save(filename)
}

export function ExportModal({
  isOpen,
  onClose,
  activeView,
  selectedDate,
}: ExportModalProps) {
  // Map activeView to ExportMode for initial value
  const initialMode: ExportMode = activeView === 'day' ? 'day' : activeView === 'week' ? 'week' : 'month'

  const [exportMode, setExportMode] = useState<ExportMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<string>('')

  // Date range state - default to last 30 days
  const defaultTo = selectedDate
  const defaultFrom = useMemo(() => {
    const date = new Date(selectedDate + 'T00:00:00')
    return format(subMonths(date, 1), 'yyyy-MM-dd')
  }, [selectedDate])

  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null)
      setProgress('')
      setExportMode(initialMode)
      setFromDate(defaultFrom)
      setToDate(defaultTo)
    }
  }, [isOpen, initialMode, defaultFrom, defaultTo])

  // Validate date range
  const isValidRange = useMemo(() => {
    return fromDate && toDate && fromDate <= toDate
  }, [fromDate, toDate])

  // Format date range for display
  const dateRangeDisplay = useMemo(() => {
    if (!fromDate || !toDate) return ''
    const from = new Date(fromDate + 'T00:00:00')
    const to = new Date(toDate + 'T00:00:00')
    return `${format(from, 'MMM d, yyyy')} - ${format(to, 'MMM d, yyyy')}`
  }, [fromDate, toDate])

  // Handle export
  const handleExport = async () => {
    if (!isValidRange) {
      setError('Please select a valid date range')
      return
    }

    setLoading(true)
    setError(null)
    setProgress('Preparing export...')

    try {
      // Build pages using the new date range API
      setProgress(`Rendering ${exportMode} view...`)
      const pages = await buildPdfPages({
        mode: exportMode,
        fromDate,
        toDate,
      })

      if (pages.length === 0) {
        throw new Error('No content to export for the selected date range')
      }

      // Generate PDF
      setProgress(`Generating PDF (${pages.length} page${pages.length > 1 ? 's' : ''})...`)
      const filename = getFilename(exportMode, fromDate, toDate)
      await generatePdfFromPages(pages, filename)

      setProgress('')
      onClose()
    } catch (err) {
      console.error('[ExportModal] Export error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate PDF')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const selectedModeInfo = EXPORT_MODES.find((m) => m.value === exportMode)

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] transition-opacity duration-300 flex items-center justify-center p-5',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-800">Export to PDF</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 disabled:opacity-50"
          >
            <AppIcon name="x" className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Export Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Export Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_MODES.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  disabled={loading}
                  onClick={() => setExportMode(mode.value)}
                  className={cn(
                    'p-3 rounded-xl border-2 transition-all text-left',
                    exportMode === mode.value
                      ? 'border-orange-400 bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center',
                        mode.bgColor
                      )}
                    >
                      <AppIcon name={mode.icon} className={cn('w-4 h-4', mode.color)} />
                    </div>
                    <span className="font-semibold text-gray-800">{mode.label}</span>
                  </div>
                  <p className="text-xs text-gray-500 ml-9">{mode.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700">
              Date Range
            </label>

            <div className="grid grid-cols-2 gap-3">
              {/* From Date */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">From</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* To Date */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">To</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>
            </div>

            {/* Date Range Invalid Warning */}
            {!isValidRange && fromDate && toDate && (
              <p className="text-xs text-red-500">
                "From" date must be before or equal to "To" date
              </p>
            )}
          </div>

          {/* Export Preview Info */}
          <div className="bg-amber-50 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  selectedModeInfo?.bgColor
                )}
              >
                <AppIcon
                  name={selectedModeInfo?.icon || 'calendar'}
                  className={cn('w-5 h-5', selectedModeInfo?.color)}
                />
              </div>
              <div>
                <p className="font-semibold text-gray-800">
                  {selectedModeInfo?.label} Export
                </p>
                <p className="text-sm text-gray-600">{dateRangeDisplay}</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-2">
              {exportMode === 'day' &&
                'Each day in the range will be exported as a polaroid page.'}
              {exportMode === 'week' &&
                'Each week in the range will be exported with all entries. Multiple pages per week if needed.'}
              {exportMode === 'month' &&
                'Each month in the range will be exported as a calendar grid page.'}
              {exportMode === 'favorites' &&
                'All favorited entries in the range will be exported as a polaroid grid.'}
            </p>
          </div>

          {/* Progress indicator */}
          {loading && progress && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
              <AppIcon name="spinner" className="w-5 h-5 animate-spin text-blue-500" />
              <p className="text-sm text-blue-700">{progress}</p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Export button */}
          <button
            onClick={handleExport}
            disabled={loading || !isValidRange}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <AppIcon name="spinner" className="w-5 h-5 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <AppIcon name="file-pdf" className="w-5 h-5" />
                Export {selectedModeInfo?.label}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
