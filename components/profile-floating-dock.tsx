"use client"

import React from "react"
import { Paintbrush, Camera, Trophy } from "lucide-react"

type Props = {
  isOwnPage: boolean
  onEditProfile: () => void
  onOpenContent: () => void
  onOpenLeaderboard: () => void
}

export default function ProfileFloatingDock({ isOwnPage, onEditProfile, onOpenContent, onOpenLeaderboard }: Props) {
  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-auto"
      aria-label="Profile actions dock"
    >
      <div className="flex items-center gap-2 rounded-full border border-pink-300 bg-white/40 backdrop-blur-xl shadow-lg px-3 py-2">
        {isOwnPage && (
          <button
            type="button"
            onClick={onEditProfile}
            className={("inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 bg-pink-100/50 hover:bg-pink-200/80 transition-colors")}
            aria-label="Edit Profile"
            title="Edit Profile"
          >
            <Paintbrush className="w-5 h-5" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenContent}
          className={("inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 bg-pink-100/50 hover:bg-pink-200/80 transition-colors")}
          aria-label="Open Content"
          title="Content"
        >
          <Camera className="w-5 h-5" />
        </button>

        <div className="mx-1 w-px h-6 bg-pink-300/70" aria-hidden="true" />

        <button
          type="button"
          onClick={onOpenLeaderboard}
          className={("inline-flex items-center justify-center rounded-full w-10 h-10 text-pink-700 bg-pink-100/50 hover:bg-pink-200/80 transition-colors")}
          aria-label="Leaderboard"
          title="Leaderboard"
        >
          <Trophy className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}