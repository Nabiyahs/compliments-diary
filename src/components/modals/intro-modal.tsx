'use client'

import { useState, useEffect } from 'react'
import { AppIcon } from '@/components/ui/app-icon'
import { cn } from '@/lib/utils'

interface IntroModalProps {
  isOpen: boolean
  onClose: () => void
}

const SLIDES = [
  {
    icon: 'calendar',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
    title: 'Day View',
    subtitle: 'Your daily Polaroid card',
    description: 'One beautiful memory per day with photo and caption',
  },
  {
    icon: 'calendar',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    title: 'Week View',
    subtitle: 'Monday to Sunday overview',
    description: 'See your week at a glance with all your memories',
  },
  {
    icon: 'calendar',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    title: 'Month View',
    subtitle: 'Full calendar grid',
    description: 'Browse through your photo memories in calendar view',
  },
] as const

// Matches main.html introModal exactly - carousel with slides
export function IntroModal({ isOpen, onClose }: IntroModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

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

  // Reset to first slide when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0)
    }
  }, [isOpen])

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(currentSlide + 1)
    } else {
      onClose()
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

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
          'bg-white rounded-3xl shadow-2xl w-full max-w-sm transform transition-transform duration-300 overflow-hidden',
          isOpen ? 'scale-100' : 'scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Guide</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100"
          >
            <AppIcon name="x" className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Slider */}
        <div className="relative overflow-hidden">
          <div
            className="flex transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {SLIDES.map((slide, index) => (
              <div key={index} className="min-w-full p-6">
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'w-16 h-16 rounded-full flex items-center justify-center mb-4',
                      slide.iconBg
                    )}
                  >
                    <AppIcon name={slide.icon as any} className={cn('w-8 h-8', slide.iconColor)} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{slide.title}</h3>
                  <p className="text-gray-600 text-center text-sm mb-4">{slide.subtitle}</p>
                  <p className="text-xs text-gray-500 text-center">{slide.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="p-6 pt-0">
          {/* Dots */}
          <div className="flex justify-center gap-2 mb-6">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  currentSlide === index ? 'bg-orange-500' : 'bg-gray-300'
                )}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {currentSlide > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
            >
              {currentSlide === SLIDES.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
