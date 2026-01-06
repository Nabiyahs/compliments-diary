'use client'

import { useState, useMemo } from 'react'
import { format, isToday, startOfWeek, addWeeks, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { useWeekData } from '@/hooks/use-week-data'
import { getWeekDays, formatDateString } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Stamp } from '../day/stamp'

interface WeekViewProps {
  onSelectDate: (date: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function WeekView({ onSelectDate }: WeekViewProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  )

  const { data: weekData, loading } = useWeekData(currentWeekStart)
  const weekDays = useMemo(() => getWeekDays(currentWeekStart), [currentWeekStart])

  const goToPrevWeek = () => {
    setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  }

  const goToThisWeek = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
  }

  return (
    <div className="max-w-lg mx-auto">
      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={goToPrevWeek}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <button
          onClick={goToThisWeek}
          className="text-lg font-semibold text-gray-800 hover:text-amber-600 transition-colors"
        >
          {format(weekDays[0], 'MMM d')} - {format(weekDays[6], 'MMM d, yyyy')}
        </button>

        <button
          onClick={goToNextWeek}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Week Days */}
      <div className="space-y-3">
        {weekDays.map((date, index) => {
          const dateStr = formatDateString(date)
          const dayData = weekData.get(dateStr)
          const isCurrentDay = isToday(date)

          return (
            <motion.button
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'w-full flex items-center gap-4 p-3 rounded-xl transition-all',
                'bg-white/60 hover:bg-white hover:shadow-md',
                isCurrentDay && 'ring-2 ring-amber-400'
              )}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              {/* Day Info */}
              <div className="flex flex-col items-center min-w-[50px]">
                <span className="text-xs text-gray-400 uppercase">
                  {WEEKDAYS[index]}
                </span>
                <span
                  className={cn(
                    'text-lg font-semibold',
                    isCurrentDay ? 'text-amber-600' : 'text-gray-800'
                  )}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Photo Thumbnail */}
              <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                {dayData?.photoUrl ? (
                  <img
                    src={dayData.photoUrl}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
              </div>

              {/* Day Stats */}
              <div className="flex-1 min-w-0">
                {dayData && dayData.praiseCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span className="text-sm text-gray-600">
                      {dayData.praiseCount} {dayData.praiseCount === 1 ? 'win' : 'wins'}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">No entries</span>
                )}
              </div>

              {/* Stamp Indicator */}
              {dayData?.hasStamp && (
                <Stamp size="sm" />
              )}

              {/* Loading State */}
              {loading && (
                <div className="absolute inset-0 bg-white/50 animate-pulse rounded-xl" />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
