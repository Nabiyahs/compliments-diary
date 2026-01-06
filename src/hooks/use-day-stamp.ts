'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { DayStampWithAsset, StampAsset } from '@/types/database'

export function useStampAssets() {
  const [stamps, setStamps] = useState<StampAsset[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStamps = async () => {
      try {
        const { data, error } = await supabase
          .from('stamp_assets')
          .select('*')
          .order('id')

        if (error) throw error
        setStamps(data || [])
      } catch {
        // Silent fail
      } finally {
        setLoading(false)
      }
    }

    fetchStamps()
  }, [supabase])

  return { stamps, loading }
}

export function useDayStamp(date: string) {
  const [dayStamp, setDayStamp] = useState<DayStampWithAsset | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAnimation, setShowAnimation] = useState(false)
  const supabase = createClient()

  const fetchDayStamp = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('day_stamps')
        .select(`
          *,
          stamp_asset:stamp_assets(*)
        `)
        .eq('praise_date', date)
        .maybeSingle()

      if (error) throw error
      setDayStamp(data as DayStampWithAsset | null)
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
    }
  }, [date, supabase])

  useEffect(() => {
    fetchDayStamp()
  }, [fetchDayStamp])

  const setStamp = async (stampAssetId: number) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('day_stamps')
        .upsert(
          {
            user_id: user.id,
            praise_date: date,
            stamp_asset_id: stampAssetId,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,praise_date' }
        )
        .select(`
          *,
          stamp_asset:stamp_assets(*)
        `)
        .single()

      if (error) throw error
      setDayStamp(data as DayStampWithAsset)
      setShowAnimation(true)
      setTimeout(() => setShowAnimation(false), 800)
      return data
    } catch {
      return null
    } finally {
      setSaving(false)
    }
  }

  const removeStamp = async () => {
    if (!dayStamp) return

    setSaving(true)
    const oldStamp = dayStamp
    setDayStamp(null)

    try {
      const { error } = await supabase
        .from('day_stamps')
        .delete()
        .eq('id', dayStamp.id)

      if (error) throw error
    } catch {
      setDayStamp(oldStamp)
    } finally {
      setSaving(false)
    }
  }

  return {
    dayStamp,
    loading,
    saving,
    showAnimation,
    setStamp,
    removeStamp,
    refetch: fetchDayStamp,
  }
}
