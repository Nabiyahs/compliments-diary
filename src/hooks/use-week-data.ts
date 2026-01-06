'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { MonthDayData } from '@/types/database'
import { getWeekRange } from '@/lib/utils'

export function useWeekData(anchorDate: Date) {
  const [data, setData] = useState<Map<string, MonthDayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchWeekData = useCallback(async () => {
    try {
      setLoading(true)
      const { start, end } = getWeekRange(anchorDate)

      // Fetch all data in parallel
      const [praisesRes, dayCardsRes, dayStampsRes] = await Promise.all([
        supabase
          .from('praises')
          .select('praise_date')
          .gte('praise_date', start)
          .lte('praise_date', end),
        supabase
          .from('day_cards')
          .select('card_date, photo_url')
          .gte('card_date', start)
          .lte('card_date', end),
        supabase
          .from('day_stamps')
          .select('praise_date')
          .gte('praise_date', start)
          .lte('praise_date', end),
      ])

      if (praisesRes.error) throw praisesRes.error
      if (dayCardsRes.error) throw dayCardsRes.error
      if (dayStampsRes.error) throw dayStampsRes.error

      // Aggregate praise counts
      const praiseCounts = new Map<string, number>()
      praisesRes.data?.forEach((p) => {
        const count = praiseCounts.get(p.praise_date) || 0
        praiseCounts.set(p.praise_date, count + 1)
      })

      // Create photo URL map
      const photoUrls = new Map<string, string | null>()
      dayCardsRes.data?.forEach((c) => {
        photoUrls.set(c.card_date, c.photo_url)
      })

      // Create stamp set
      const stampDates = new Set(dayStampsRes.data?.map((s) => s.praise_date) || [])

      // Build aggregated data
      const weekData = new Map<string, MonthDayData>()

      // Get all unique dates
      const allDates = new Set([
        ...praiseCounts.keys(),
        ...photoUrls.keys(),
        ...stampDates,
      ])

      allDates.forEach((date) => {
        weekData.set(date, {
          date,
          praiseCount: praiseCounts.get(date) || 0,
          photoUrl: photoUrls.get(date) || null,
          hasStamp: stampDates.has(date),
        })
      })

      setData(weekData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch week data')
    } finally {
      setLoading(false)
    }
  }, [anchorDate, supabase])

  useEffect(() => {
    fetchWeekData()
  }, [fetchWeekData])

  return { data, loading, error, refetch: fetchWeekData }
}
