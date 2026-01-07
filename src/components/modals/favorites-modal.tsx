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

// Matches main.html favoritesModal exactly - slides up from bottom
export function FavoritesModal({
  isOpen,
  onClose,
  favorites = [],
}: FavoritesModalProps) {
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
          <div className="flex items-center justify-between mb-4 px-2">
            <p className="text-sm text-gray-600">{favorites.length} saved memories</p>
            <AppIcon name="heart" className="w-5 h-5 text-orange-500" />
          </div>

          {favorites.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <AppIcon name="heart" className="w-16 h-16 text-gray-200 mb-4" />
              <p className="text-gray-500 text-center">
                No favorites yet.
                <br />
                Tap the heart on any entry to save it here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {favorites.map((entry, index) => (
                <div
                  key={entry.id}
                  className={cn(
                    'relative bg-white rounded-2xl shadow-md overflow-hidden hover:rotate-0 transition-transform duration-300',
                    index % 2 === 0 ? 'transform rotate-[-2deg]' : 'transform rotate-[2deg] mt-6'
                  )}
                >
                  <img
                    src={entry.photoUrl}
                    alt={entry.caption}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">{entry.date}</p>
                    <p className="text-sm text-gray-700 line-clamp-2">{entry.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
