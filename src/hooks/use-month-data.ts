'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getMonthRange } from '@/lib/utils'

export interface MonthDayData {
  date: string
  praiseCount: number
  thumbUrl: string | null // Only load thumbnail for calendar grid (not original)
  hasStamp: boolean
  caption: string | null
  stickers: string[]
}

export function useMonthData(year: number, month: number) {
  const [data, setData] = useState<Map<string, MonthDayData>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchMonthData = useCallback(async () => {
    try {
      setLoading(true)
      const { start, end } = getMonthRange(year, month)

      // Fetch all data in parallel
      // IMPORTANT: Only fetch thumb_url for calendar view (not photo_url - saves bandwidth)
      const [praisesRes, dayCardsRes, dayStampsRes] = await Promise.all([
        supabase
          .from('praises')
          .select('praise_date')
          .gte('praise_date', start)
          .lte('praise_date', end),
        supabase
          .from('day_cards')
          .select('card_date, thumb_url, caption, sticker_state')
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

      // Create day card data map (using thumb_url only for calendar grid)
      const dayCardData = new Map<string, { thumbUrl: string | null; caption: string | null; stickers: string[] }>()
      dayCardsRes.data?.forEach((c) => {
        // Extract emoji stickers from sticker_state
        const stickers: string[] = []
        if (c.sticker_state && Array.isArray(c.sticker_state)) {
          c.sticker_state.forEach((s: { emoji?: string }) => {
            if (s.emoji) stickers.push(s.emoji)
          })
        }
        dayCardData.set(c.card_date, {
          thumbUrl: c.thumb_url,
          caption: c.caption,
          stickers,
        })
      })

      // Create stamp set
      const stampDates = new Set(dayStampsRes.data?.map((s) => s.praise_date) || [])

      // Build aggregated data
      const monthData = new Map<string, MonthDayData>()

      // Get all unique dates
      const allDates = new Set([
        ...praiseCounts.keys(),
        ...dayCardData.keys(),
        ...stampDates,
      ])

      allDates.forEach((date) => {
        const cardData = dayCardData.get(date)
        monthData.set(date, {
          date,
          praiseCount: praiseCounts.get(date) || 0,
          thumbUrl: cardData?.thumbUrl || null,
          hasStamp: stampDates.has(date),
          caption: cardData?.caption || null,
          stickers: cardData?.stickers || [],
        })
      })

      setData(monthData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch month data')
    } finally {
      setLoading(false)
    }
  }, [year, month, supabase])

  useEffect(() => {
    fetchMonthData()
  }, [fetchMonthData])

  return { data, loading, error, refetch: fetchMonthData }
}
