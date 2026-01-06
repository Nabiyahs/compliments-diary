'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import type { StampAsset } from '@/types/database'

interface StampProps {
  asset?: StampAsset | null
  showAnimation?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Classic teacher stamp design - "참 잘했어요" style
export function Stamp({ asset, showAnimation = false, size = 'md', className }: StampProps) {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-20 h-20',
    lg: 'w-28 h-28',
  }

  const fontSizes = {
    sm: { main: 'text-xs', sub: 'text-[6px]', stars: 'text-[5px]' },
    md: { main: 'text-lg', sub: 'text-[9px]', stars: 'text-[7px]' },
    lg: { main: 'text-2xl', sub: 'text-xs', stars: 'text-[10px]' },
  }

  const label = asset?.label || '참 잘했어요'
  const [mainText, subText] = parseLabel(label)

  return (
    <AnimatePresence>
      <motion.div
        initial={showAnimation ? { scale: 1.3, opacity: 0, rotate: -15 } : false}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 20,
        }}
        className={cn(
          'relative flex items-center justify-center rounded-full',
          sizes[size],
          className
        )}
      >
        {/* Stamp Background with ink texture */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-red-600 to-red-700 opacity-90" />

        {/* Outer ring */}
        <div className="absolute inset-[3px] rounded-full border-2 border-red-300/40" />

        {/* Inner content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-white">
          {/* Stars arc at top */}
          <div className={cn('flex gap-0.5 -mb-0.5', fontSizes[size].stars)}>
            {'★★★★★'.split('').map((star, i) => (
              <span
                key={i}
                style={{
                  transform: `rotate(${-30 + i * 15}deg) translateY(${Math.abs(2 - i) * 1}px)`,
                }}
              >
                {star}
              </span>
            ))}
          </div>

          {/* Main text */}
          <span className={cn('font-bold', fontSizes[size].main)}>{mainText}</span>

          {/* Sub text */}
          <span className={cn('font-medium -mt-0.5', fontSizes[size].sub)}>
            {subText}
          </span>
        </div>

        {/* Ink texture overlay */}
        <div
          className="absolute inset-0 rounded-full opacity-20 mix-blend-overlay"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")',
          }}
        />
      </motion.div>
    </AnimatePresence>
  )
}

// Parse label like "참 잘했어요" into ["참", "잘했어요"]
function parseLabel(label: string): [string, string] {
  const parts = label.split(' ')
  if (parts.length >= 2) {
    return [parts[0], parts.slice(1).join(' ')]
  }
  if (label.length > 2) {
    return [label[0], label.slice(1)]
  }
  return [label, '']
}

interface StampPickerProps {
  stamps: StampAsset[]
  selectedId?: number | null
  onSelect: (id: number) => void
  onRemove?: () => void
  loading?: boolean
}

export function StampPicker({
  stamps,
  selectedId,
  onSelect,
  onRemove,
  loading,
}: StampPickerProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Select Stamp</h3>
        {selectedId && onRemove && (
          <button
            onClick={onRemove}
            className="text-xs text-red-500 hover:text-red-600"
            disabled={loading}
          >
            Remove stamp
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {stamps.map((stamp) => (
          <button
            key={stamp.id}
            onClick={() => onSelect(stamp.id)}
            disabled={loading}
            className={cn(
              'p-2 rounded-xl transition-all',
              selectedId === stamp.id
                ? 'bg-red-50 ring-2 ring-red-400'
                : 'bg-gray-50 hover:bg-gray-100'
            )}
          >
            <Stamp asset={stamp} size="sm" />
            <p className="text-[10px] text-gray-500 mt-1 text-center truncate max-w-[48px]">
              {stamp.label}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
