'use client'

import { useEffect } from 'react'
import { AppIcon } from '@/components/ui/app-icon'
import { cn } from '@/lib/utils'

interface FavoriteEntry {
  id: string
  date: string
  caption: string
  photoUrl: string
}

interface FavoritesModalProps {
  isOpen: boolean
  onClose: () => void
  favorites?: FavoriteEntry[]
}

// Rotation patterns matching main.html
const ROTATIONS = [
  'rotate-[-2deg]',
  'rotate-[2deg] mt-6',
  'rotate-[1deg]',
  'rotate-[-1deg] mt-4',
  'rotate-[-2deg]',
  'rotate-[2deg] mt-8',
]

// Matches main.html favoritesModal exactly - slides up from bottom
export function FavoritesModal({
  isOpen,
  onClose,
  favorites = [],
}: FavoritesModalProps) {
  const hasFavorites = favorites.length > 0

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
        'fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 flex items-start justify-center overflow-y-auto',
        isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-t-3xl shadow-2xl w-full min-h-screen transform transition-transform duration-300 pt-6 pb-24',
          isOpen ? 'translate-y-0' : 'translate-y-full'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Favorite Moments</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <AppIcon name="x" className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-4">
          {hasFavorites ? (
            <>
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-sm text-gray-600">{favorites.length} saved memories</p>
                <AppIcon name="heart" className="w-5 h-5 text-orange-500" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {favorites.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'relative bg-white rounded-2xl shadow-md overflow-hidden hover:rotate-0 transition-transform duration-300 transform',
                      ROTATIONS[index % ROTATIONS.length]
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={entry.photoUrl}
                      alt={entry.caption}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <AppIcon name="heart" className="w-5 h-5 text-red-500 drop-shadow-lg fill-current" />
                    </div>
                    <div className="p-3 bg-white">
                      <p className="text-xs text-gray-500 mb-1">{entry.date}</p>
                      <p className="text-sm text-gray-700 line-clamp-2">{entry.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Introduction/Empty State - shown when no favorites */
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <AppIcon name="heart" className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 text-center">
                Your Cherished Moments
              </h3>
              <p className="text-gray-600 text-center text-sm leading-relaxed max-w-xs">
                Tap the heart icon on any daily entry to save it here. Your favorite memories will be collected in this special place.
              </p>
              <div className="mt-8 flex gap-2">
                <div className="w-16 h-16 bg-gray-100 rounded-xl transform rotate-[-3deg]" />
                <div className="w-16 h-16 bg-gray-100 rounded-xl transform rotate-[2deg] mt-2" />
                <div className="w-16 h-16 bg-gray-100 rounded-xl transform rotate-[-1deg]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
