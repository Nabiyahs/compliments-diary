'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getWeekRange } from '@/lib/utils'

export interface WeekDayData {
  date: string
  praiseCount: number
  thumbUrl: string | null // Only load thumbnail for week view (not original)
  hasStamp: boolean
  caption: string | null
  stickers: string[]
  time: string | null
}

export function useWeekData(anchorDate: Date) {
  const [data, setData] = useState<Map<string, WeekDayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchWeekData = useCallback(async () => {
    try {
      setLoading(true)
      const { start, end } = getWeekRange(anchorDate)

      // Fetch all data in parallel
      // IMPORTANT: Only fetch thumb_url for week view (not photo_url - saves bandwidth)
      const [praisesRes, dayCardsRes, dayStampsRes] = await Promise.all([
        supabase
          .from('praises')
          .select('praise_date, created_at')
          .gte('praise_date', start)
          .lte('praise_date', end),
        supabase
          .from('day_cards')
          .select('card_date, thumb_url, caption, sticker_state, updated_at')
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

      // Aggregate praise counts and get latest time
      const praiseCounts = new Map<string, number>()
      const praiseTimes = new Map<string, string>()
      praisesRes.data?.forEach((p) => {
        const count = praiseCounts.get(p.praise_date) || 0
        praiseCounts.set(p.praise_date, count + 1)
        // Keep the latest time
        const time = new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        praiseTimes.set(p.praise_date, time)
      })

      // Create day card data map (using thumb_url only for week view)
      const dayCardData = new Map<string, { thumbUrl: string | null; caption: string | null; stickers: string[]; time: string | null }>()
      dayCardsRes.data?.forEach((c) => {
        // Extract emoji stickers from sticker_state
        const stickers: string[] = []
        if (c.sticker_state && Array.isArray(c.sticker_state)) {
          c.sticker_state.forEach((s: { emoji?: string }) => {
            if (s.emoji) stickers.push(s.emoji)
          })
        }
        const time = c.updated_at ? new Date(c.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null
        dayCardData.set(c.card_date, {
          thumbUrl: c.thumb_url,
          caption: c.caption,
          stickers,
          time,
        })
      })

      // Create stamp set
      const stampDates = new Set(dayStampsRes.data?.map((s) => s.praise_date) || [])

      // Build aggregated data
      const weekData = new Map<string, WeekDayData>()

      // Get all unique dates
      const allDates = new Set([
        ...praiseCounts.keys(),
        ...dayCardData.keys(),
        ...stampDates,
      ])

      allDates.forEach((date) => {
        const cardData = dayCardData.get(date)
        weekData.set(date, {
          date,
          praiseCount: praiseCounts.get(date) || 0,
          thumbUrl: cardData?.thumbUrl || null,
          hasStamp: stampDates.has(date),
          caption: cardData?.caption || null,
          stickers: cardData?.stickers || [],
          time: cardData?.time || praiseTimes.get(date) || null,
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
