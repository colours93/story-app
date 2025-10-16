"use client"

import React from "react"
import { Heart, Image as ImageIcon, Video, Sparkles } from "lucide-react"

type Props = {
  activeType: 'all' | 'image' | 'video'
  onChangeType: (t: 'all' | 'image' | 'video') => void
  onOpenFilters: () => void
}

export default function FloatingContentDock({ activeType, onChangeType, onOpenFilters }: Props) {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      aria-label="Content filter dock"
    >
      <div className="flex items-center gap-2 rounded-full border border-pink-300 bg-white/40 backdrop-blur-xl shadow-lg px-3 py-2">
        <button
          type="button"
          onClick={() => onChangeType('all')}
          className={(activeType === 'all' ? 'bg-pink-200/70 ' : 'bg-pink-100/50 ') +
            'inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 hover:bg-pink-200/80 transition-colors'}
          aria-label="Show all content"
          title="All"
        >
          <Heart className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onChangeType('video')}
          className={(activeType === 'video' ? 'bg-pink-200/70 ' : 'bg-pink-100/50 ') +
            'inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 hover:bg-pink-200/80 transition-colors'}
          aria-label="Show videos only"
          title="Videos"
        >
          <Video className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onChangeType('image')}
          className={(activeType === 'image' ? 'bg-pink-200/70 ' : 'bg-pink-100/50 ') +
            'inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 hover:bg-pink-200/80 transition-colors'}
          aria-label="Show pictures only"
          title="Pictures"
        >
          <ImageIcon className="w-5 h-5" />
        </button>

        <div className="mx-1 w-px h-6 bg-pink-300/70" aria-hidden="true" />

        <button
          type="button"
          onClick={onOpenFilters}
          className={'inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 bg-pink-100/50 hover:bg-pink-200/80 transition-colors'}
          aria-label="Open advanced filters"
          title="Filters"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}