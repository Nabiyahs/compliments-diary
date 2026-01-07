'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AppIcon } from '@/components/ui/app-icon'
import { cn } from '@/lib/utils'

const SWIPE_HINT_STORAGE_KEY = 'daypat_guide_swipe_hint_shown'

interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
}

/**
 * GuideModal - Fullscreen swipeable view of main.html pages
 * Shows Day/Week/Month/Favorites exactly as they appear in main.html
 * No header, no bottom nav - just the raw page content with subtle < > navigation
 */
export function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const totalSlides = 4
  const [showSwipeHint, setShowSwipeHint] = useState(false)

  // Touch handling
  const touchStartX = useRef(0)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${window.scrollY}px`
    }
    return () => {
      const scrollY = document.body.style.top
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1)
    }
  }, [isOpen])

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setCurrentSlide(0)
      setDragOffset(0)
    }
  }, [isOpen])

  // Swipe hint (once)
  useEffect(() => {
    if (!isOpen) return
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return
    try {
      const hintShown = localStorage.getItem(SWIPE_HINT_STORAGE_KEY)
      if (!hintShown) {
        const showTimer = setTimeout(() => setShowSwipeHint(true), 300)
        const hideTimer = setTimeout(() => {
          setShowSwipeHint(false)
          localStorage.setItem(SWIPE_HINT_STORAGE_KEY, 'true')
        }, 1800)
        return () => { clearTimeout(showTimer); clearTimeout(hideTimer) }
      }
    } catch { /* localStorage not available */ }
  }, [isOpen])

  const dismissSwipeHint = useCallback(() => {
    if (showSwipeHint) {
      setShowSwipeHint(false)
      try { localStorage.setItem(SWIPE_HINT_STORAGE_KEY, 'true') } catch { /* */ }
    }
  }, [showSwipeHint])

  // Keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && currentSlide > 0) setCurrentSlide(currentSlide - 1)
      if (e.key === 'ArrowRight' && currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, currentSlide])

  // Touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX
    setIsDragging(true)
    dismissSwipeHint()
  }, [dismissSwipeHint])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return
    const diff = e.changedTouches[0].screenX - touchStartX.current
    if ((currentSlide === 0 && diff > 0) || (currentSlide === totalSlides - 1 && diff < 0)) {
      setDragOffset(diff * 0.3)
    } else {
      setDragOffset(diff)
    }
  }, [isDragging, currentSlide])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    setIsDragging(false)
    setDragOffset(0)
    const diff = e.changedTouches[0].screenX - touchStartX.current
    if (diff > 50 && currentSlide > 0) setCurrentSlide(currentSlide - 1)
    else if (diff < -50 && currentSlide < totalSlides - 1) setCurrentSlide(currentSlide + 1)
  }, [currentSlide])

  const goNext = () => currentSlide < totalSlides - 1 && setCurrentSlide(currentSlide + 1)
  const goPrev = () => currentSlide > 0 && setCurrentSlide(currentSlide - 1)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Close button - top right */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-30 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors"
        aria-label="Close"
      >
        <AppIcon name="x" className="w-5 h-5 text-gray-600" />
      </button>

      {/* Left arrow */}
      <button
        onClick={goPrev}
        className={cn(
          'fixed left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-16 flex items-center justify-center transition-opacity',
          currentSlide === 0 ? 'opacity-0 pointer-events-none' : 'opacity-30 hover:opacity-60'
        )}
        aria-label="Previous"
      >
        <AppIcon name="chevron-left" className="w-6 h-6 text-gray-600" />
      </button>

      {/* Right arrow */}
      <button
        onClick={goNext}
        className={cn(
          'fixed right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-16 flex items-center justify-center transition-opacity',
          currentSlide === totalSlides - 1 ? 'opacity-0 pointer-events-none' : 'opacity-30 hover:opacity-60',
          showSwipeHint && currentSlide === 0 && 'animate-swipe-hint-right'
        )}
        aria-label="Next"
      >
        <AppIcon name="chevron-right" className="w-6 h-6 text-gray-600" />
      </button>

      {/* Swipe container */}
      <div
        className="h-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className={cn('flex h-full', !isDragging && 'transition-transform duration-300 ease-out')}
          style={{ transform: `translateX(calc(-${currentSlide * 100}% + ${dragOffset}px))` }}
        >
          {/* Slide 1: Day View - exact main.html layout */}
          <div className="min-w-full h-full overflow-y-auto">
            <div className="pt-6 pb-24 px-5">
              {/* Date navigation */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-left" className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">January 15</h2>
                    <p className="text-sm text-gray-500">Wednesday, 2025</p>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-right" className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              {/* Polaroid card */}
              <div className="bg-white rounded-3xl shadow-xl p-5 mb-6 transform rotate-[-1deg]">
                <div className="bg-gray-100 rounded-2xl overflow-hidden mb-4 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/image/9848b97d68-29d8f31e7e5b8dcb9f5d.png"
                    alt="peaceful morning coffee"
                    className="w-full h-[340px] object-cover"
                    draggable={false}
                  />
                  <div className="absolute top-3 right-3 flex gap-2">
                    <span className="text-3xl">☕</span>
                    <span className="text-3xl">✨</span>
                  </div>
                </div>
                <div className="px-2">
                  <p className="text-gray-700 text-center font-medium leading-relaxed mb-3">
                    Started my day with gratitude. The simple joy of morning coffee and sunshine reminded me to appreciate the little things.
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>3:42 PM</span>
                    <div className="flex gap-3">
                      <AppIcon name="pencil" className="w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer" />
                      <AppIcon name="heart" className="w-4 h-4 hover:text-orange-500 transition-colors cursor-pointer" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 2: Week View - exact main.html layout */}
          <div className="min-w-full h-full overflow-y-auto">
            <div className="pt-6 pb-24 px-5">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-left" className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">Week 3</h2>
                    <p className="text-sm text-gray-500">Jan 13 - Jan 19, 2025</p>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-right" className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="space-y-4">
                {/* Monday */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">MON</p>
                      <p className="text-2xl font-bold text-gray-800">13</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/image/df82fafb81-e691c7ae868ff48609ca.png" alt="yoga" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">Morning yoga session brought peace to my mind 🧘‍♀️✨</p>
                </div>
                {/* Tuesday */}
                <div className="bg-white rounded-2xl p-4 shadow-md">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-500 font-medium">TUE</p>
                      <p className="text-2xl font-bold text-gray-800">14</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/image/67c9033525-e71831b512ea2e428637.png" alt="salad" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">Nourishing my body with fresh healthy food 🥗💚</p>
                </div>
                {/* Wednesday - highlighted */}
                <div className="bg-white rounded-2xl p-4 shadow-md border-2 border-orange-400">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-orange-600 font-bold">WED</p>
                      <p className="text-2xl font-bold text-orange-600">15</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/image/9848b97d68-29d8f31e7e5b8dcb9f5d.png" alt="coffee" className="w-full h-full object-cover" draggable={false} />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">Simple joy of morning coffee ☕✨</p>
                </div>
                {/* Thursday - empty */}
                <div className="bg-white/60 rounded-2xl p-4 border-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">THU</p>
                      <p className="text-2xl font-bold text-gray-400">16</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl bg-gray-100 flex items-center justify-center">
                      <AppIcon name="plus" className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">No entry yet</p>
                </div>
                {/* Friday - empty */}
                <div className="bg-white/60 rounded-2xl p-4 border-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">FRI</p>
                      <p className="text-2xl font-bold text-gray-400">17</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl bg-gray-100 flex items-center justify-center">
                      <AppIcon name="plus" className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">No entry yet</p>
                </div>
                {/* Saturday - empty */}
                <div className="bg-white/60 rounded-2xl p-4 border-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">SAT</p>
                      <p className="text-2xl font-bold text-gray-400">18</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl bg-gray-100 flex items-center justify-center">
                      <AppIcon name="plus" className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">No entry yet</p>
                </div>
                {/* Sunday - empty */}
                <div className="bg-white/60 rounded-2xl p-4 border-2 border-dashed border-gray-300">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-center">
                      <p className="text-xs text-gray-400 font-medium">SUN</p>
                      <p className="text-2xl font-bold text-gray-400">19</p>
                    </div>
                    <div className="flex-1 h-[100px] rounded-xl bg-gray-100 flex items-center justify-center">
                      <AppIcon name="plus" className="w-8 h-8 text-gray-300" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-400">No entry yet</p>
                </div>
              </div>
            </div>
          </div>

          {/* Slide 3: Month View - exact main.html layout */}
          <div className="min-w-full h-full overflow-y-auto">
            <div className="pt-6 pb-24 px-5">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-left" className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-800">January 2025</h2>
                  </div>
                  <button className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors">
                    <AppIcon name="chevron-right" className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4">
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                    <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {/* Empty cells before month start (7) */}
                  {[...Array(7)].map((_, i) => <div key={`e1-${i}`} className="aspect-square bg-gray-50 rounded-lg" />)}
                  {/* Day 1-3 empty */}
                  {[1, 2, 3].map(d => (
                    <div key={d} className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                      <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-700 z-10">{d}</span>
                    </div>
                  ))}
                  {/* Day 4 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">4</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/06c4d59883-ce5ce94d6ad46c42ee8e.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 5 empty */}
                  <div className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                    <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-700 z-10">5</span>
                  </div>
                  {/* Day 6 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">6</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/5ec6adb291-19a4f27becd9bf81891a.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 7 empty */}
                  <div className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                    <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-700 z-10">7</span>
                  </div>
                  {/* Day 8 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">8</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/7d5f2711ea-308301cb34fc01259450.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 9 empty */}
                  <div className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                    <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-700 z-10">9</span>
                  </div>
                  {/* Day 10 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">10</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/bbd9a37480-db910cb1c5c32661b40c.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 11 empty */}
                  <div className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                    <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-700 z-10">11</span>
                  </div>
                  {/* Day 12 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">12</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/3fef0312cc-ac35f49b2c70e143e772.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 13 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">13</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/ea32fb5053-f4123dab51535d78b2ac.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 14 with image */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">14</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/011a105c86-64ea07166049e1017e9a.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Day 15 with image - highlighted */}
                  <div className="aspect-square rounded-lg p-0.5 relative overflow-hidden border-2 border-orange-400">
                    <span className="absolute top-1 left-1 text-[10px] font-bold text-white z-10 drop-shadow">15</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/image/9848b97d68-29d8f31e7e5b8dcb9f5d.png" alt="" className="w-full h-full object-cover rounded-lg" draggable={false} />
                  </div>
                  {/* Days 16-31 empty */}
                  {[16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31].map(d => (
                    <div key={d} className="aspect-square bg-gray-50 rounded-lg p-0.5 relative">
                      <span className="absolute top-1 left-1 text-[10px] font-semibold text-gray-400 z-10">{d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Slide 4: Favorites - exact main.html favoritesModal layout */}
          <div className="min-w-full h-full overflow-y-auto">
            <div className="pt-6 pb-24 px-4">
              <div className="flex items-center justify-between mb-6 px-2">
                <h2 className="text-2xl font-bold text-gray-800">Favorite Moments</h2>
                <AppIcon name="heart" className="w-6 h-6 text-orange-500 fill-current" />
              </div>
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-sm text-gray-600">12 saved memories</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {/* Card 1 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[-2deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/06c4d59883-ce5ce94d6ad46c42ee8e.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 4, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Peaceful sunset at the beach 🌅</p>
                  </div>
                </div>
                {/* Card 2 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[2deg] mt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/5ec6adb291-19a4f27becd9bf81891a.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 6, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Cozy reading time ☕📚</p>
                  </div>
                </div>
                {/* Card 3 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[1deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/7d5f2711ea-308301cb34fc01259450.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 8, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Fresh flowers brighten my day 🌸</p>
                  </div>
                </div>
                {/* Card 4 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[-1deg] mt-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/bbd9a37480-db910cb1c5c32661b40c.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 10, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Mountain adventure 🏔️</p>
                  </div>
                </div>
                {/* Card 5 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[-2deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/3fef0312cc-ac35f49b2c70e143e772.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 12, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Homemade comfort food 🍲</p>
                  </div>
                </div>
                {/* Card 6 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[2deg] mt-8">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/ea32fb5053-f4123dab51535d78b2ac.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 13, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Morning yoga session 🧘‍♀️</p>
                  </div>
                </div>
                {/* Card 7 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[1deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/011a105c86-64ea07166049e1017e9a.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 14, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Healthy lunch bowl 🥗</p>
                  </div>
                </div>
                {/* Card 8 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[-1deg] mt-5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/9848b97d68-29d8f31e7e5b8dcb9f5d.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Jan 15, 2025</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Morning coffee ritual ☕</p>
                  </div>
                </div>
                {/* Card 9 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[2deg]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/df82fafb81-e691c7ae868ff48609ca.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Dec 28, 2024</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Sunrise meditation 🌅</p>
                  </div>
                </div>
                {/* Card 10 */}
                <div className="relative bg-white rounded-2xl shadow-md overflow-hidden transform rotate-[-2deg] mt-7">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/image/67c9033525-e71831b512ea2e428637.png" alt="" className="w-full h-48 object-cover" draggable={false} />
                  <div className="absolute top-2 right-2">
                    <AppIcon name="heart" className="w-5 h-5 text-red-500 fill-current drop-shadow-lg" />
                  </div>
                  <div className="p-3 bg-white">
                    <p className="text-xs text-gray-500 mb-1">Dec 30, 2024</p>
                    <p className="text-sm text-gray-700 line-clamp-2">Fresh garden salad 🥬</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page indicator dots - very subtle at bottom */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'w-1.5 h-1.5 rounded-full transition-all',
              currentSlide === i ? 'bg-gray-400 w-3' : 'bg-gray-300'
            )}
          />
        ))}
      </div>
    </div>
  )
}
