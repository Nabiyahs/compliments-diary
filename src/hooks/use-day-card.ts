'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DayCard, StickerState } from '@/types/database'

// Helper to convert database row to DayCard
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDayCard(row: any): DayCard {
  return {
    id: row.id,
    user_id: row.user_id,
    card_date: row.card_date,
    photo_url: row.photo_url,
    thumb_url: row.thumb_url || null, // Thumbnail for calendar views
    caption: row.caption,
    sticker_state: (row.sticker_state as StickerState[]) || [],
    updated_at: row.updated_at,
  }
}

export function useDayCard(date: string) {
  const [dayCard, setDayCard] = useState<DayCard | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchDayCard = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('day_cards')
        .select('*')
        .eq('card_date', date)
        .maybeSingle()

      if (error) throw error
      setDayCard(data ? toDayCard(data) : null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch day card')
    } finally {
      setLoading(false)
    }
  }, [date, supabase])

  useEffect(() => {
    fetchDayCard()
  }, [fetchDayCard])

  const upsertDayCard = async (updates: {
    photo_url?: string | null
    caption?: string | null
    sticker_state?: StickerState[]
  }) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    setSaving(true)
    const oldDayCard = dayCard

    // Optimistic update
    if (dayCard) {
      setDayCard({ ...dayCard, ...updates, updated_at: new Date().toISOString() })
    } else {
      setDayCard({
        id: Date.now(),
        user_id: user.id,
        card_date: date,
        photo_url: updates.photo_url ?? null,
        thumb_url: null, // Will be generated server-side
        caption: updates.caption ?? null,
        sticker_state: updates.sticker_state ?? [],
        updated_at: new Date().toISOString(),
      })
    }

    try {
      const stickers = updates.sticker_state ?? dayCard?.sticker_state ?? []

      const { data, error } = await supabase
        .from('day_cards')
        .upsert(
          {
            user_id: user.id,
            card_date: date,
            photo_url: updates.photo_url ?? dayCard?.photo_url ?? null,
            caption: updates.caption ?? dayCard?.caption ?? null,
            sticker_state: stickers,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,card_date' }
        )
        .select()
        .single()

      if (error) throw error
      setDayCard(toDayCard(data))
      return toDayCard(data)
    } catch (err) {
      setDayCard(oldDayCard)
      setError(err instanceof Error ? err.message : 'Failed to save day card')
      return null
    } finally {
      setSaving(false)
    }
  }

  return {
    dayCard,
    loading,
    saving,
    error,
    upsertDayCard,
    refetch: fetchDayCard,
  }
}
