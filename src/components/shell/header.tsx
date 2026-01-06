'use client'

import { Menu, Plus } from 'lucide-react'

interface HeaderProps {
  onMenuClick: () => void
  onAddClick?: () => void
}

export function Header({ onMenuClick, onAddClick }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-b border-pink-100 z-50">
      <div className="flex items-center justify-between px-5 py-4">
        <button
          onClick={onMenuClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-pink-50 transition-colors"
        >
          <Menu className="w-5 h-5 text-pink-600" />
        </button>
        <h1 className="text-lg font-bold text-gray-800">Praise Journal</h1>
        <button
          onClick={onAddClick}
          className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-pink-50 transition-colors"
        >
          <Plus className="w-5 h-5 text-pink-600" />
        </button>
      </div>
    </header>
  )
}
