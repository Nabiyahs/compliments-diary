'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Praise } from '@/types/database'

export function usePraises(date: string) {
  const [praises, setPraises] = useState<Praise[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchPraises = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('praises')
        .select('*')
        .eq('praise_date', date)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPraises(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch praises')
    } finally {
      setLoading(false)
    }
  }, [date, supabase])

  useEffect(() => {
    fetchPraises()
  }, [fetchPraises])

  const addPraise = async (content: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Optimistic update
    const tempId = Date.now()
    const tempPraise: Praise = {
      id: tempId,
      user_id: user.id,
      praise_date: date,
      content,
      created_at: new Date().toISOString(),
    }
    setPraises((prev) => [tempPraise, ...prev])

    try {
      const { data, error } = await supabase
        .from('praises')
        .insert({
          user_id: user.id,
          praise_date: date,
          content,
        })
        .select()
        .single()

      if (error) throw error

      // Replace temp with real data
      setPraises((prev) =>
        prev.map((p) => (p.id === tempId ? data : p))
      )
      return data
    } catch (err) {
      // Rollback on error
      setPraises((prev) => prev.filter((p) => p.id !== tempId))
      setError(err instanceof Error ? err.message : 'Failed to add praise')
      return null
    }
  }

  const updatePraise = async (id: number, content: string) => {
    const oldPraises = [...praises]
    setPraises((prev) =>
      prev.map((p) => (p.id === id ? { ...p, content } : p))
    )

    try {
      const { error } = await supabase
        .from('praises')
        .update({ content })
        .eq('id', id)

      if (error) throw error
    } catch (err) {
      setPraises(oldPraises)
      setError(err instanceof Error ? err.message : 'Failed to update praise')
    }
  }

  const deletePraise = async (id: number) => {
    const oldPraises = [...praises]
    setPraises((prev) => prev.filter((p) => p.id !== id))

    try {
      const { error } = await supabase.from('praises').delete().eq('id', id)

      if (error) throw error
    } catch (err) {
      setPraises(oldPraises)
      setError(err instanceof Error ? err.message : 'Failed to delete praise')
    }
  }

  return {
    praises,
    loading,
    error,
    addPraise,
    updatePraise,
    deletePraise,
    refetch: fetchPraises,
  }
}

// Hook to fetch all praise dates for streak calculation
export function useAllPraiseDates() {
  const [praiseDates, setPraiseDates] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPraiseDates = useCallback(async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('praises')
        .select('praise_date')

      if (error) throw error

      const dates = new Set(data?.map((p) => p.praise_date) || [])
      setPraiseDates(dates)
    } catch {
      // Silent fail - streak will just be 0
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPraiseDates()
  }, [fetchPraiseDates])

  return { praiseDates, loading, refetch: fetchPraiseDates }
}
