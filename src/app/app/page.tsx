'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useSupabase, resetSupabaseClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'
import type { User, AuthChangeEvent, Session } from '@supabase/supabase-js'
import { Header, ViewTabs, SideDrawer, BottomNav, type ViewType } from '@/components/shell'
import { MonthView } from '@/components/calendar/month-view'
import { WeekView } from '@/components/calendar/week-view'
import { DayView } from '@/components/day/day-view'
import { formatDateString } from '@/lib/utils'

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<ViewType>('day') // Day is the main/default view
  const [selectedDate, setSelectedDate] = useState(formatDateString(new Date()))
  const [drawerOpen, setDrawerOpen] = useState(false)
  const router = useRouter()
  const supabase = useSupabase()

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.error('[App] Auth error:', error)
        router.replace('/login')
        return
      }

      if (!user) {
        console.log('[App] No user, redirecting to login')
        router.replace('/login')
        return
      }

      console.log('[App] User authenticated:', user.email)
      setUser(user)
    } catch (err) {
      console.error('[App] Unexpected error:', err)
      router.replace('/login')
    } finally {
      setLoading(false)
    }
  }, [supabase, router])

  useEffect(() => {
    checkUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        console.log('[App] Auth state changed:', event)

        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        } else if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [checkUser, supabase, router])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    // Switch to day view when selecting a date from month/week
    if (activeView !== 'day') {
      setActiveView('day')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    resetSupabaseClient()
    router.replace('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Fixed Header with View Tabs */}
      <div className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-pink-100 z-50">
        <Header
          onMenuClick={() => setDrawerOpen(true)}
          onAddClick={() => {
            setSelectedDate(formatDateString(new Date()))
            setActiveView('day')
          }}
        />
        <ViewTabs
          activeView={activeView}
          onViewChange={setActiveView}
        />
      </div>

      {/* Side Drawer */}
      <SideDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Content - matches reference: pt-[140px] pb-24 px-5 */}
      <main className="pt-[140px] pb-24 px-5">
        {activeView === 'day' && (
          <DayView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
        {activeView === 'week' && (
          <WeekView onSelectDate={handleSelectDate} />
        )}
        {activeView === 'month' && (
          <MonthView onSelectDate={handleSelectDate} />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        onAddClick={() => {
          setSelectedDate(formatDateString(new Date()))
          setActiveView('day')
        }}
      />
    </div>
  )
}
