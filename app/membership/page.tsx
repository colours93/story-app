"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PixelHeartButton } from "@/components/pixel-heart-button"
import { PixelHeart } from "@/components/pixel-heart"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

type Tier = { id: string; name: string; rank: number; monthly_price_cents: number; description?: string }

export default function MembershipPage() {
  const { toast } = useToast()
  const router = useRouter()
  const { data: session } = useSession()
  const [tiers, setTiers] = useState<Tier[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [counts, setCounts] = useState<{ free: number; silver: number; gold: number } | null>(null)
  const [viewTier, setViewTier] = useState<string>("")

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/membership/tiers')
        const data = await res.json()
        setTiers(data?.tiers || [])
      } catch (e) {
        console.error('Failed to load tiers', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const res = await fetch('/api/membership/counts')
        const data = await res.json()
        if (res.ok && data?.counts) setCounts(data.counts)
      } catch (e) {
        console.error('Failed to load counts', e)
      }
    }
    loadCounts()
  }, [])

  async function chooseTier(tierId: string) {
    setSubscribing(tierId)
    try {
      const res = await fetch('/api/membership/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier_id: tierId })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to subscribe')
      toast({ title: 'Membership updated', description: 'Enjoy your new content access!' })
      router.replace('/content')
    } catch (e:any) {
      toast({ title: 'Subscribe failed', description: e.message || 'Could not set membership', variant: 'destructive' })
    } finally {
      setSubscribing(null)
    }
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 font-bubble">
      <div className="mb-4" />
      <h1 className="text-3xl font-bold text-pink-600 mb-3">Choose Your Membership</h1>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="text-pink-700">
          {counts ? (
            <span>
              Members — Free: <strong>{counts.free}</strong>, Silver: <strong>{counts.silver}</strong>, Gold: <strong>{counts.gold}</strong>
            </span>
          ) : (
            <span className="text-pink-500">Loading member counts…</span>
          )}
        </div>
        {session?.user?.role === 'admin' && (
          <div className="flex items-center gap-2">
            <label className="text-pink-700 text-sm">View tier feed:</label>
            <select
              className="border border-pink-300 rounded px-2 py-1 text-pink-700 bg-white"
              value={viewTier}
              onChange={(e) => setViewTier(e.target.value)}
            >
              <option value="">—</option>
              <option value="free">Free</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
            </select>
            <Button
              variant="secondary"
              disabled={!viewTier}
              onClick={() => router.push(`/content?viewTier=${encodeURIComponent(viewTier)}`)}
            >
              Open Feed
            </Button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="text-pink-500">Loading tiers…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((t) => {
            const isFree = t.name?.toLowerCase() === "free"
            if (isFree) {
              return (
                <Card key={t.id} className="relative overflow-hidden bg-white">
                  <CardContent className="py-6">
                    {/* GLITCH/STATIC style: chromatic aberration + scattered pixels */}
                    <div className="relative m-2 p-4 bg-pink-50">
                      {/* RGB split border effect */}
                      <div aria-hidden className="absolute inset-0 border-2 border-pink-400 opacity-70" />
                      <div aria-hidden className="absolute inset-0 border-2 border-cyan-400 opacity-40 translate-x-[2px]" />
                      <div aria-hidden className="absolute inset-0 border-2 border-red-400 opacity-40 -translate-x-[2px]" />
                      
                      {/* Scattered pixel noise on edges */}
                      <span aria-hidden className="absolute top-2 left-2 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute top-4 left-6 w-1 h-1 bg-pink-500" />
                      <span aria-hidden className="absolute top-1 right-8 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute top-5 right-3 w-1 h-1 bg-pink-500" />
                      <span aria-hidden className="absolute bottom-3 left-4 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute bottom-1 left-10 w-1 h-1 bg-pink-500" />
                      <span aria-hidden className="absolute bottom-2 right-5 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute bottom-6 right-2 w-1 h-1 bg-pink-500" />
                      
                      {/* Glitch accent bars */}
                      <span aria-hidden className="absolute top-8 left-0 w-12 h-[2px] bg-gradient-to-r from-pink-500 to-transparent opacity-60" />
                      <span aria-hidden className="absolute bottom-12 right-0 w-16 h-[2px] bg-gradient-to-l from-pink-500 to-transparent opacity-60" />

                      <div className="space-y-2 text-center relative z-10">
                        <h2 className="text-2xl font-bold text-black flex items-center justify-center gap-2">
                          {t.name}
                          <span className="flex items-center gap-1">
                            <PixelHeart size={24} className="-translate-y-[4px]" />
                            <PixelHeart size={16} className="-translate-y-[4px] rotate-[12deg]" />
                          </span>
                        </h2>
                        <p className="text-pink-800">Rank {t.rank}</p>
                        <p className="text-pink-900 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                        {t.description && <p className="text-pink-800 text-sm">{t.description}</p>}
                        <div className="pt-4">
                          <PixelHeartButton
                            size={72}
                            label="Select"
                            labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                            shadow={true}
                            disabled={subscribing === t.id}
                            onClick={() => chooseTier(t.id)}
                            palette={{ border: "#000000", fill: "#f472b6", shade: "#be185d", highlight: "#fecdd3" }}
                            hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#fecdd3" }}
                            activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#fecdd3" }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }
            // Silver variation: hologram/scanlines style
            if (t.name?.toLowerCase() === "silver") {
              return (
                <Card key={t.id} className="relative overflow-hidden bg-white">
                  <CardContent className="py-6">
                    <div className="relative m-2 p-4 bg-gradient-to-br from-slate-50 to-cyan-50">
                      {/* Holographic iridescent border */}
                      <div aria-hidden className="absolute inset-0 border-2 border-slate-400" />
                      <div aria-hidden className="absolute inset-0 border border-cyan-300 opacity-60" style={{ borderStyle: 'dashed', borderWidth: '1px' }} />
                      
                      {/* Horizontal scan lines */}
                      <span aria-hidden className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 2px, #06b6d4 2px 4px, transparent 4px 6px)' }} />
                      <span aria-hidden className="absolute top-[20%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                      <span aria-hidden className="absolute top-[40%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-40" />
                      <span aria-hidden className="absolute top-[60%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
                      <span aria-hidden className="absolute top-[80%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-slate-400 to-transparent opacity-40" />
                      <span aria-hidden className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0 2px, #64748b 2px 4px, transparent 4px 6px)' }} />
                      
                      {/* Corner tech accents */}
                      <span aria-hidden className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-cyan-500" />
                      <span aria-hidden className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-cyan-500" />
                      <span aria-hidden className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-slate-500" />
                      <span aria-hidden className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-slate-500" />

                      <div className="space-y-2 text-center relative z-10">
                        <h2 className="text-2xl font-bold text-slate-900">{t.name}</h2>
                        <p className="text-slate-700">Rank {t.rank}</p>
                        <p className="text-slate-800 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                        {t.description && <p className="text-slate-700 text-sm">{t.description}</p>}
                        <div className="pt-4">
                          <PixelHeartButton
                            size={68}
                            label="Select"
                            labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                            shadow={true}
                            disabled={subscribing === t.id}
                            onClick={() => chooseTier(t.id)}
                            palette={{ border: "#334155", fill: "#94a3b8", shade: "#64748b", highlight: "#e2e8f0" }}
                            hoverPalette={{ border: "#334155", fill: "#a1aecb", shade: "#72859c", highlight: "#eef2f7" }}
                            activePalette={{ border: "#1f2937", fill: "#7c8aa3", shade: "#4b5563", highlight: "#e2e8f0" }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            // Gold variation: radial burst/crown jewel style
            if (t.name?.toLowerCase() === "gold") {
              return (
                <Card key={t.id} className="relative overflow-hidden bg-white">
                  <CardContent className="py-6">
                    <div className="relative m-2 p-4 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
                      {/* Main ornate border */}
                      <div aria-hidden className="absolute inset-0 border-[3px] border-amber-500" />
                      <div aria-hidden className="absolute inset-[2px] border border-yellow-300 opacity-70" />
                      
                      {/* Radial corner bursts - diagonal rays */}
                      <span aria-hidden className="absolute top-0 left-0 w-8 h-[2px] bg-gradient-to-r from-amber-400 to-transparent origin-left rotate-45 -translate-y-1" />
                      <span aria-hidden className="absolute top-0 left-0 w-6 h-[1px] bg-gradient-to-r from-yellow-300 to-transparent origin-left rotate-[30deg]" />
                      <span aria-hidden className="absolute top-0 left-0 h-8 w-[2px] bg-gradient-to-b from-amber-400 to-transparent origin-top -rotate-45 -translate-x-1" />
                      <span aria-hidden className="absolute top-0 left-0 h-6 w-[1px] bg-gradient-to-b from-yellow-300 to-transparent origin-top -rotate-[30deg]" />
                      
                      <span aria-hidden className="absolute top-0 right-0 w-8 h-[2px] bg-gradient-to-l from-amber-400 to-transparent origin-right -rotate-45 -translate-y-1" />
                      <span aria-hidden className="absolute top-0 right-0 w-6 h-[1px] bg-gradient-to-l from-yellow-300 to-transparent origin-right -rotate-[30deg]" />
                      <span aria-hidden className="absolute top-0 right-0 h-8 w-[2px] bg-gradient-to-b from-amber-400 to-transparent origin-top rotate-45 translate-x-1" />
                      <span aria-hidden className="absolute top-0 right-0 h-6 w-[1px] bg-gradient-to-b from-yellow-300 to-transparent origin-top rotate-[30deg]" />
                      
                      <span aria-hidden className="absolute bottom-0 left-0 w-8 h-[2px] bg-gradient-to-r from-amber-500 to-transparent origin-left -rotate-45 translate-y-1" />
                      <span aria-hidden className="absolute bottom-0 left-0 w-6 h-[1px] bg-gradient-to-r from-orange-400 to-transparent origin-left -rotate-[30deg]" />
                      <span aria-hidden className="absolute bottom-0 left-0 h-8 w-[2px] bg-gradient-to-t from-amber-500 to-transparent origin-bottom rotate-45 -translate-x-1" />
                      <span aria-hidden className="absolute bottom-0 left-0 h-6 w-[1px] bg-gradient-to-t from-orange-400 to-transparent origin-bottom rotate-[30deg]" />
                      
                      <span aria-hidden className="absolute bottom-0 right-0 w-8 h-[2px] bg-gradient-to-l from-amber-500 to-transparent origin-right rotate-45 translate-y-1" />
                      <span aria-hidden className="absolute bottom-0 right-0 w-6 h-[1px] bg-gradient-to-l from-orange-400 to-transparent origin-right rotate-[30deg]" />
                      <span aria-hidden className="absolute bottom-0 right-0 h-8 w-[2px] bg-gradient-to-t from-amber-500 to-transparent origin-bottom -rotate-45 translate-x-1" />
                      <span aria-hidden className="absolute bottom-0 right-0 h-6 w-[1px] bg-gradient-to-t from-orange-400 to-transparent origin-bottom -rotate-[30deg]" />
                      
                      {/* Crown jewel corners */}
                      <span aria-hidden className="absolute top-1 left-1 w-2 h-2 bg-yellow-400 rotate-45" />
                      <span aria-hidden className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rotate-45" />
                      <span aria-hidden className="absolute bottom-1 left-1 w-2 h-2 bg-orange-500 rotate-45" />
                      <span aria-hidden className="absolute bottom-1 right-1 w-2 h-2 bg-orange-500 rotate-45" />

                      <div className="space-y-2 text-center relative z-10">
                        <h2 className="text-2xl font-bold text-amber-900">{t.name}</h2>
                        <p className="text-amber-700">Rank {t.rank}</p>
                        <p className="text-amber-800 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                        {t.description && <p className="text-amber-700 text-sm">{t.description}</p>}
                        <div className="pt-4">
                          <PixelHeartButton
                            size={70}
                            label="Select"
                            labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                            shadow={true}
                            disabled={subscribing === t.id}
                            onClick={() => chooseTier(t.id)}
                            palette={{ border: "#78350f", fill: "#f59e0b", shade: "#b45309", highlight: "#fde68a" }}
                            hoverPalette={{ border: "#78350f", fill: "#fbbf24", shade: "#d97706", highlight: "#fef3c7" }}
                            activePalette={{ border: "#6b3e0b", fill: "#d97706", shade: "#92400e", highlight: "#fde68a" }}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            // Fallback (unchanged)
            return (
              <Card key={t.id} className="bg-pink-50 border-pink-200">
                <CardContent className="py-6">
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-bold text-pink-700">{t.name}</h2>
                    <p className="text-pink-600">Rank {t.rank}</p>
                    <p className="text-pink-800">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                    {t.description && <p className="text-pink-700 text-sm">{t.description}</p>}
                    <div className="pt-4">
                      <Button onClick={() => chooseTier(t.id)} disabled={subscribing === t.id}>Select</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}