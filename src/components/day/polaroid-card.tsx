'use client'

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Camera, Plus, Minus, RotateCw, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadPhoto } from '@/lib/image-upload'
import type { DayCard, StickerState } from '@/types/database'

interface PolaroidCardProps {
  dayCard: DayCard | null
  date: string
  onPhotoChange: (url: string) => Promise<void>
  onCaptionChange: (caption: string) => Promise<void>
  onStickersChange: (stickers: StickerState[]) => Promise<void>
  saving?: boolean
}

const EMOJI_PALETTE = ['✨', '💛', '⭐', '🌟', '💖', '🎉', '🌸', '🍀', '🔥', '💪', '👏', '🙌']

export function PolaroidCard({
  dayCard,
  date,
  onPhotoChange,
  onCaptionChange,
  onStickersChange,
  saving,
}: PolaroidCardProps) {
  const [uploading, setUploading] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState(dayCard?.caption || '')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [selectedSticker, setSelectedSticker] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const photoAreaRef = useRef<HTMLDivElement>(null)

  const stickers = dayCard?.sticker_state || []

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const url = await uploadPhoto(file, date)
      if (url) {
        await onPhotoChange(url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleCaptionBlur = async () => {
    setEditingCaption(false)
    if (captionDraft !== (dayCard?.caption || '')) {
      await onCaptionChange(captionDraft)
    }
  }

  const addSticker = async (emoji: string) => {
    const newSticker: StickerState = {
      emoji,
      x: 0.5,
      y: 0.5,
      scale: 1,
      rotate: 0,
      z: stickers.length + 1,
    }
    await onStickersChange([...stickers, newSticker])
    setShowEmojiPicker(false)
    setSelectedSticker(stickers.length)
  }

  const updateSticker = async (index: number, updates: Partial<StickerState>) => {
    const newStickers = stickers.map((s, i) =>
      i === index ? { ...s, ...updates } : s
    )
    await onStickersChange(newStickers)
  }

  const deleteSticker = async (index: number) => {
    const newStickers = stickers.filter((_, i) => i !== index)
    await onStickersChange(newStickers)
    setSelectedSticker(null)
  }

  const handleStickerDrag = useCallback(
    (index: number, e: React.MouseEvent | React.TouchEvent) => {
      const photoArea = photoAreaRef.current
      if (!photoArea) return

      e.preventDefault()
      const rect = photoArea.getBoundingClientRect()

      const getCoords = (event: MouseEvent | TouchEvent) => {
        if ('touches' in event) {
          return { clientX: event.touches[0].clientX, clientY: event.touches[0].clientY }
        }
        return { clientX: event.clientX, clientY: event.clientY }
      }

      const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = getCoords(moveEvent)
        const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
        const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
        updateSticker(index, { x, y })
      }

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove)
        document.removeEventListener('mouseup', handleUp)
        document.removeEventListener('touchmove', handleMove)
        document.removeEventListener('touchend', handleUp)
      }

      document.addEventListener('mousemove', handleMove)
      document.addEventListener('mouseup', handleUp)
      document.addEventListener('touchmove', handleMove)
      document.addEventListener('touchend', handleUp)
    },
    [stickers]
  )

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Polaroid frame */}
      <motion.div
        initial={{ rotate: -2 }}
        animate={{ rotate: -2 }}
        className="bg-white rounded-sm shadow-lg p-3 pb-14 relative"
        style={{
          boxShadow: '0 4px 20px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02)',
        }}
      >
        {/* Photo area */}
        <div
          ref={photoAreaRef}
          className="relative aspect-square bg-gray-100 rounded-sm overflow-hidden"
        >
          {dayCard?.photo_url ? (
            <>
              <img
                src={dayCard.photo_url}
                alt="Day photo"
                className="w-full h-full object-cover"
              />
              {/* Change photo button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow hover:bg-white transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
                ) : (
                  <Camera className="w-4 h-4 text-gray-600" />
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-500 transition-colors"
            >
              {uploading ? (
                <Loader2 className="w-10 h-10 animate-spin" />
              ) : (
                <>
                  <Camera className="w-10 h-10" />
                  <span className="text-sm">Add photo</span>
                </>
              )}
            </button>
          )}

          {/* Stickers */}
          {stickers.map((sticker, index) => (
            <motion.div
              key={index}
              className={cn(
                'absolute cursor-move select-none',
                selectedSticker === index && 'ring-2 ring-amber-400 ring-offset-2 rounded'
              )}
              style={{
                left: `${sticker.x * 100}%`,
                top: `${sticker.y * 100}%`,
                transform: `translate(-50%, -50%) scale(${sticker.scale}) rotate(${sticker.rotate}deg)`,
                zIndex: sticker.z,
                fontSize: '2rem',
              }}
              onClick={() => setSelectedSticker(index)}
              onMouseDown={(e) => handleStickerDrag(index, e)}
              onTouchStart={(e) => handleStickerDrag(index, e)}
            >
              {sticker.emoji}
            </motion.div>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Caption area */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
          {editingCaption ? (
            <input
              type="text"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value)}
              onBlur={handleCaptionBlur}
              onKeyDown={(e) => e.key === 'Enter' && handleCaptionBlur()}
              autoFocus
              placeholder="Add a caption..."
              className="w-full text-center text-gray-600 text-sm font-handwriting bg-transparent border-b border-gray-200 focus:border-amber-400 outline-none py-1"
              maxLength={100}
            />
          ) : (
            <p
              onClick={() => {
                setCaptionDraft(dayCard?.caption || '')
                setEditingCaption(true)
              }}
              className={cn(
                'text-center text-sm font-handwriting cursor-pointer py-1 min-h-[28px]',
                dayCard?.caption ? 'text-gray-600' : 'text-gray-400'
              )}
            >
              {dayCard?.caption || 'Add a caption...'}
            </p>
          )}
        </div>

        {/* Saving indicator */}
        {saving && (
          <div className="absolute top-2 right-2">
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          </div>
        )}
      </motion.div>

      {/* Sticker controls */}
      <div className="mt-4 space-y-3">
        {/* Selected sticker controls */}
        {selectedSticker !== null && stickers[selectedSticker] && (
          <div className="flex items-center justify-center gap-2 p-2 bg-gray-50 rounded-lg">
            <button
              onClick={() => {
                const s = stickers[selectedSticker]
                updateSticker(selectedSticker, { scale: Math.max(0.5, s.scale - 0.1) })
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="text-xs text-gray-500 w-12 text-center">
              {Math.round(stickers[selectedSticker].scale * 100)}%
            </span>
            <button
              onClick={() => {
                const s = stickers[selectedSticker]
                updateSticker(selectedSticker, { scale: Math.min(2, s.scale + 0.1) })
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => {
                const s = stickers[selectedSticker]
                updateSticker(selectedSticker, { rotate: s.rotate + 15 })
              }}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <div className="w-px h-6 bg-gray-200" />
            <button
              onClick={() => deleteSticker(selectedSticker)}
              className="p-2 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Add sticker button */}
        <div className="relative">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-600 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add sticker
          </button>

          {/* Emoji picker */}
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute bottom-full left-0 right-0 mb-2 p-3 bg-white rounded-xl shadow-lg border border-gray-100"
            >
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_PALETTE.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addSticker(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
