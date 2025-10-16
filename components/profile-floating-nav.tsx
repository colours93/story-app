"use client"

import Link from "next/link"
import { Home, Search, Compass, Clapperboard, MessageCircle, Heart, Plus, BarChart2, UserCircle, Trophy } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

export default function ProfileFloatingNav({ avatarUrl }: { avatarUrl?: string }) {
  return (
    <div className="fixed left-2 top-1/2 -translate-y-1/2 z-40 hidden md:block">
      <div className="flex flex-col items-center gap-5 rounded-2xl bg-pink-100/20 border border-pink-200/40 backdrop-blur-md p-3 shadow-lg shadow-pink-200/20">
        <Link href="/" aria-label="Home" className="group">
          <Home className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/search" aria-label="Search" className="group">
          <Search className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/explore" aria-label="Explore" className="group">
          <Compass className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/reels" aria-label="Reels" className="group relative">
          <Clapperboard className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/messages" aria-label="Messages" className="group relative">
          <MessageCircle className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
          {/* new messages badge */}
          <span aria-hidden className="absolute -right-2 -top-2 text-[10px] font-bold px-1.5 py-[1px] rounded-full bg-red-500 text-white">9+</span>
        </Link>
        <Link href="/likes" aria-label="Likes" className="group relative">
          <Heart className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
          {/* small notification dot */}
          <span aria-hidden className="absolute -right-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
        </Link>
        <Link href="/create" aria-label="Create" className="group">
          <Plus className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/analytics" aria-label="Analytics" className="group">
          <BarChart2 className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <Link href="/leaderboard" aria-label="Leaderboard" className="group">
          <Trophy className="h-6 w-6 text-pink-600 group-hover:text-pink-700 transition-colors" />
        </Link>
        <div className="mt-1">
          <Avatar className="size-8 ring-2 ring-pink-300/40">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="Profile" />
            ) : (
              <AvatarFallback className="text-pink-600">
                <UserCircle className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>
    </div>
  )
}