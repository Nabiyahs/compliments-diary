'use client'

/**
 * Slide 1: Daily Praise Polaroid
 * Design based on daily.html reference - warm amber/yellow theme
 * Visual: Polaroid card with sample content and "참 잘했어요" stamp
 */
export function SlidePraise() {
  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Polaroid Card - matches daily.html #polaroidCard styling */}
      <div className="relative">
        {/* Main Polaroid Frame */}
        <div className="bg-white rounded-3xl shadow-2xl p-5 transform rotate-[-2deg] w-72">
          {/* Photo area with gradient background */}
          <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-yellow-100 rounded-2xl overflow-hidden mb-4 relative h-64">
            {/* Sample image placeholder with decorative content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {/* Soft background pattern */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 left-4 text-4xl">☀️</div>
                <div className="absolute bottom-8 right-6 text-3xl">🌸</div>
              </div>

              {/* Sample content */}
              <div className="relative z-10 text-center px-6">
                <p className="text-gray-700 text-lg leading-relaxed font-medium">
                  오늘 아침에 일찍 일어나서
                  <br />
                  운동을 했다 💪
                </p>
              </div>
            </div>

            {/* Stickers - top right like in daily.html */}
            <div className="absolute top-3 right-3 flex gap-2">
              <span className="text-2xl drop-shadow-md">☕</span>
              <span className="text-2xl drop-shadow-md">✨</span>
            </div>
          </div>

          {/* Caption area */}
          <div className="px-2">
            <p className="text-gray-700 text-center font-medium leading-relaxed mb-3 text-sm">
              작은 성취를 기록하고
              <br />
              나를 칭찬해보세요
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>3:42 PM</span>
              <div className="flex gap-3">
                <span className="text-[#F27430]">♥</span>
              </div>
            </div>
          </div>
        </div>

        {/* "참 잘했어요" Stamp - Korean style approval stamp */}
        <div className="absolute -top-6 -right-6 transform rotate-[12deg] z-20">
          <div className="w-24 h-24 rounded-full border-[3px] border-red-500 flex items-center justify-center bg-white/95 shadow-xl">
            <div className="text-center">
              <p className="text-red-500 font-bold text-xs leading-tight">참</p>
              <p className="text-red-500 font-black text-base leading-tight">잘했어요</p>
            </div>
          </div>
        </div>

        {/* Decorative sparkles */}
        <div className="absolute -left-8 top-1/3 text-3xl opacity-70 animate-pulse">✨</div>
        <div className="absolute -right-10 bottom-1/4 text-2xl opacity-60">⭐</div>
      </div>
    </div>
  )
}
