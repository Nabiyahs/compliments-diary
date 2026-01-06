'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, CalendarDays, Sun, Loader2 } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { UserMenu } from '@/components/auth/user-menu'
import { MonthView } from '@/components/calendar/month-view'
import { WeekView } from '@/components/calendar/week-view'
import { DayView } from '@/components/day/day-view'
import { formatDateString } from '@/lib/utils'

type ViewTab = 'month' | 'week' | 'day'

const TABS = [
  { id: 'month', label: 'Month', icon: <Calendar className="w-4 h-4" /> },
  { id: 'week', label: 'Week', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'day', label: 'Day', icon: <Sun className="w-4 h-4" /> },
]

export default function AppPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('month')
  const [selectedDate, setSelectedDate] = useState(formatDateString(new Date()))
  const [showDayModal, setShowDayModal] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUser(user)
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT') {
          router.push('/login')
        } else if (session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router, supabase])

  const handleSelectDate = (date: string) => {
    setSelectedDate(date)
    if (activeTab !== 'day') {
      setShowDayModal(true)
    }
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as ViewTab)
    if (tab === 'day') {
      setShowDayModal(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800">
            Praise Calendar
          </h1>
          {user && <UserMenu user={user} />}
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="sticky top-[57px] z-10 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 px-4 py-3">
        <div className="max-w-lg mx-auto">
          <Tabs
            tabs={TABS}
            activeTab={activeTab}
            onChange={handleTabChange}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6">
        {activeTab === 'month' && (
          <MonthView onSelectDate={handleSelectDate} />
        )}
        {activeTab === 'week' && (
          <WeekView onSelectDate={handleSelectDate} />
        )}
        {activeTab === 'day' && (
          <DayView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}
      </main>

      {/* Day View Modal (for month/week views) */}
      <Modal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        title={`Day View`}
        className="md:max-w-lg"
      >
        <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 min-h-[60vh]">
          <DayView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClose={() => setShowDayModal(false)}
          />
        </div>
      </Modal>
    </div>
  )
}
