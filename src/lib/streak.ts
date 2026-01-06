import { formatDateString } from './utils'

/**
 * Compute streak ending at anchor date
 * A day counts as "success" if it has at least 1 praise
 * Streak revives when users backfill missing dates
 */
export function computeStreak(
  praiseDates: Set<string>,
  anchorDate: Date = new Date()
): number {
  let streak = 0
  const current = new Date(anchorDate)

  // Start from anchor date and go backwards
  while (true) {
    const dateStr = formatDateString(current)

    if (praiseDates.has(dateStr)) {
      streak++
      current.setDate(current.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * Get all unique praise dates from a list of praises
 */
export function getPraiseDatesSet(
  praises: { praise_date: string }[]
): Set<string> {
  return new Set(praises.map((p) => p.praise_date))
}

/**
 * Calculate streak info for display
 */
export interface StreakInfo {
  currentStreak: number // streak ending today
  selectedStreak: number // streak ending at selected date
}

export function getStreakInfo(
  praiseDates: Set<string>,
  selectedDate: Date
): StreakInfo {
  const today = new Date()
  return {
    currentStreak: computeStreak(praiseDates, today),
    selectedStreak: computeStreak(praiseDates, selectedDate),
  }
}
