'use client'

import { useState, useMemo } from 'react'
import { format, isSameMonth, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMonthData } from '@/hooks/use-month-data'
import { getCalendarDays, formatDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface MonthViewProps {
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function MonthView({ onSelectDate }: MonthViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [stampAnimation, setStampAnimation] = useState<string | null>(null)

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  const { data: monthData, loading } = useMonthData(year, month)
  const calendarDays = useMemo(() => getCalendarDays(year, month), [year, month])

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const handleDayClick = (date: Date) => {
    const dateStr = formatDateString(date)
    const dayData = monthData.get(dateStr)

    // Trigger stamp animation if stamp exists
    if (dayData?.hasStamp) {
      setStampAnimation(dateStr)
      setTimeout(() => setStampAnimation(null), 800)
    }

    onSelectDate(dateStr)
  }

  return (
    <div className="max-w-md mx-auto">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevMonth}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={goToToday}
          className="text-lg font-semibold text-gray-800 hover:text-amber-600 transition-colors"
        >
          {format(currentMonth, 'MMMM yyyy')}
        </button>

        <button
          onClick={goToNextMonth}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-gray-400 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          const dateStr = formatDateString(date)
          const isCurrentMonth = isSameMonth(date, currentMonth)
          const dayData = monthData.get(dateStr)
          const isCurrentDay = isToday(date)
          const showStampAnimation = stampAnimation === dateStr

          return (
            <motion.button
              key={index}
              onClick={() => handleDayClick(date)}
              className={cn(
                'relative aspect-square rounded-xl overflow-hidden transition-all',
                isCurrentMonth
                  ? 'bg-white/60 hover:bg-white hover:shadow-md'
                  : 'bg-gray-50/50 opacity-40',
                isCurrentDay && 'ring-2 ring-amber-400'
              )}
              whileTap={{ scale: 0.95 }}
            >
              {/* Photo Thumbnail */}
              {dayData?.photoUrl && isCurrentMonth && (
                <div className="absolute inset-0">
                  <img
                    src={dayData.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10" />
                </div>
              )}

              {/* Day Number */}
              <div
                className={cn(
                  'absolute top-1 left-1 w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full',
                  dayData?.photoUrl && isCurrentMonth
                    ? 'bg-white/80 text-gray-800'
                    : isCurrentDay
                    ? 'bg-amber-400 text-white'
                    : 'text-gray-600'
                )}
              >
                {date.getDate()}
              </div>

              {/* Praise Count Badge */}
              {dayData && dayData.praiseCount > 0 && isCurrentMonth && (
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-amber-400/90 text-white text-[10px] font-medium rounded-full">
                  {dayData.praiseCount}
                </div>
              )}

              {/* Stamp Indicator (subtle corner mark) */}
              {dayData?.hasStamp && isCurrentMonth && !showStampAnimation && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}

              {/* Stamp Animation Overlay */}
              <AnimatePresence>
                {showStampAnimation && (
                  <motion.div
                    initial={{ scale: 1.5, opacity: 0, rotate: -20 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="absolute inset-0 flex items-center justify-center bg-red-500/20"
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center">
                      <span className="text-white text-[8px] font-bold">참</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading Shimmer */}
              {loading && isCurrentMonth && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
