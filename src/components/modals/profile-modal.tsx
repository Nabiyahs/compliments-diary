'use client'

import { useEffect } from 'react'
import { AppIcon } from '@/components/ui/app-icon'
import { cn } from '@/lib/utils'

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onLogout?: () => void
  userEmail?: string
  totalEntries?: number
  currentStreak?: number
  memberSince?: string
}

// Matches main.html profileModal exactly
export function ProfileModal({
  isOpen,
  onClose,
  onLogout,
  userEmail = '',
  totalEntries = 0,
  currentStreak = 0,
  memberSince = '',
}: ProfileModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  return (
    <div
      className={cn(
        'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-center justify-center p-5',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-3xl shadow-2xl w-full max-w-sm transform transition-transform duration-300 p-8',
          isOpen ? 'scale-100' : 'scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Profile</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <AppIcon name="x" className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="flex flex-col items-center mb-8">
          {/* Avatar */}
          <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-amber-400 rounded-full flex items-center justify-center mb-4">
            <AppIcon name="user" className="w-12 h-12 text-white" />
          </div>
          <p className="text-gray-600 text-sm">{userEmail || 'Guest'}</p>
          {memberSince && (
            <p className="text-gray-400 text-xs mt-1">Member since {memberSince}</p>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{totalEntries}</p>
            <p className="text-sm text-gray-600">Entries</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-bold text-orange-500">{currentStreak}</p>
            <p className="text-sm text-gray-600">Day Streak</p>
          </div>
        </div>

        {/* Sign Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <AppIcon name="logout" className="w-5 h-5" />
            <span className="font-semibold">Sign Out</span>
          </button>
        )}
      </div>
    </div>
  )
}
