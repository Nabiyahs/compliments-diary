'use client'

import { format, isToday } from 'date-fns'
import { ChevronLeft, ChevronRight, Flame } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePraises, useAllPraiseDates } from '@/hooks/use-praises'
import { useDayCard } from '@/hooks/use-day-card'
import { useDayStamp, useStampAssets } from '@/hooks/use-day-stamp'
import { getStreakInfo } from '@/lib/streak'
import { formatDateString, parseDateString } from '@/lib/utils'
import { PolaroidCard } from './polaroid-card'
import { PraiseList } from './praise-list'
import { Stamp, StampPicker } from './stamp'
import { cn } from '@/lib/utils'

interface DayViewProps {
  selectedDate: string
  onDateChange: (date: string) => void
  onClose?: () => void
}

export function DayView({ selectedDate, onDateChange }: DayViewProps) {
  const date = parseDateString(selectedDate)
  const dateStr = formatDateString(date)

  const { praises, loading: praisesLoading, addPraise, updatePraise, deletePraise } = usePraises(dateStr)
  const { dayCard, saving: cardSaving, upsertDayCard } = useDayCard(dateStr)
  const { dayStamp, showAnimation, setStamp, removeStamp, saving: stampSaving } = useDayStamp(dateStr)
  const { stamps } = useStampAssets()
  const { praiseDates } = useAllPraiseDates()

  const streakInfo = getStreakInfo(praiseDates, date)

  const goToPrevDay = () => {
    const prev = new Date(date)
    prev.setDate(prev.getDate() - 1)
    onDateChange(formatDateString(prev))
  }

  const goToNextDay = () => {
    const next = new Date(date)
    next.setDate(next.getDate() + 1)
    onDateChange(formatDateString(next))
  }

  const goToToday = () => {
    onDateChange(formatDateString(new Date()))
  }

  return (
    <div className="max-w-lg mx-auto px-4 pb-8">
      {/* Date Navigation */}
      <div className="flex items-center justify-between py-4 sticky top-0 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 z-10">
        <button
          onClick={goToPrevDay}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>

        <div className="text-center">
          <button
            onClick={goToToday}
            className={cn(
              'text-lg font-semibold transition-colors',
              isToday(date) ? 'text-amber-600' : 'text-gray-800 hover:text-amber-600'
            )}
          >
            {format(date, 'EEEE, MMMM d')}
          </button>
          {isToday(date) && (
            <p className="text-xs text-amber-500">Today</p>
          )}
        </div>

        <button
          onClick={goToNextDay}
          className="p-2 hover:bg-white/60 rounded-full transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Streak Display */}
      <div className="flex justify-center gap-6 mb-6">
        <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full">
          <Flame className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">
            {streakInfo.currentStreak} day streak
          </span>
        </div>
        {!isToday(date) && streakInfo.selectedStreak > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white/60 rounded-full">
            <span className="text-sm text-gray-500">
              {streakInfo.selectedStreak} days on this date
            </span>
          </div>
        )}
      </div>

      {/* Polaroid Card */}
      <div className="mb-8">
        <PolaroidCard
          dayCard={dayCard}
          date={dateStr}
          onPhotoChange={async (url) => {
            await upsertDayCard({ photo_url: url })
          }}
          onCaptionChange={async (caption) => {
            await upsertDayCard({ caption })
          }}
          onStickersChange={async (stickers) => {
            await upsertDayCard({ sticker_state: stickers })
          }}
          saving={cardSaving}
        />
      </div>

      {/* Stamp Section */}
      <div className="mb-8 relative">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {dayStamp ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={showAnimation ? { scale: 1.3, opacity: 0, rotate: -15 } : false}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                >
                  <Stamp asset={dayStamp.stamp_asset} showAnimation={showAnimation} size="md" />
                </motion.div>
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    {dayStamp.stamp_asset.label}
                  </p>
                  <p className="text-xs text-gray-400">Today&apos;s stamp</p>
                </div>
              </div>
              <button
                onClick={removeStamp}
                disabled={stampSaving}
                className="text-xs text-red-500 hover:text-red-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <StampPicker
              stamps={stamps}
              selectedId={null}
              onSelect={setStamp}
              loading={stampSaving}
            />
          )}
        </div>
      </div>

      {/* Praise List */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <PraiseList
          praises={praises}
          onAdd={addPraise}
          onUpdate={updatePraise}
          onDelete={deletePraise}
          loading={praisesLoading}
        />
      </div>
    </div>
  )
}
