"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

type RankEntry = { username: string; value: number }

export default function LeaderboardPage() {
  // Temporary mocked data; replace with API integration later
  const topSpenders: RankEntry[] = [
    { username: 'alice', value: 320 },
    { username: 'bob', value: 250 },
    { username: 'charlie', value: 190 },
  ]
  const topListeners: RankEntry[] = [
    { username: 'zoe', value: 54 },
    { username: 'maya', value: 47 },
    { username: 'liam', value: 42 },
  ]

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 font-bubble">
      <div className="mb-6" />
      <h1 className="text-3xl font-bold text-pink-600 mb-4">Leaderboard</h1>
      <p className="text-pink-700 mb-6">Track your rank among top spenders and listeners.</p>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-white border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-pink-700">Top Spenders</h2>
              <Link href="/membership" className="text-pink-600 hover:text-pink-700">Upgrade Tier</Link>
            </div>
            <ol className="space-y-2">
              {topSpenders.map((e, idx) => (
                <li key={e.username} className="flex items-center justify-between">
                  <span className="text-pink-800">#{idx + 1} @{e.username}</span>
                  <span className="rounded-full bg-pink-100 text-pink-700 px-3 py-1">${e.value}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card className="bg-white border-pink-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-pink-700">Top Listeners</h2>
              <Link href="/hypno" className="text-pink-600 hover:text-pink-700">View Hypno Files</Link>
            </div>
            <ol className="space-y-2">
              {topListeners.map((e, idx) => (
                <li key={e.username} className="flex items-center justify-between">
                  <span className="text-pink-800">#{idx + 1} @{e.username}</span>
                  <span className="rounded-full bg-pink-100 text-pink-700 px-3 py-1">{e.value} plays</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 text-center text-pink-600">
        <p>Data is mocked for now. We will wire this to real stats once hypno files and purchase history are available.</p>
      </div>
    </div>
  )
}