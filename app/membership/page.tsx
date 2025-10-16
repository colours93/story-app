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

  // Bambi Sleep themed display labels while keeping backend keys intact
  const TIER_LABELS: Record<string, string> = {
    free: "Resisting",
    silver: "Sinking",
    gold: "Mindless",
  }
  const displayLabel = (name?: string) => {
    const key = (name || "").toLowerCase()
    return TIER_LABELS[key] || (name ?? "")
  }

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
              Members — {TIER_LABELS.free}: <strong>{counts.free}</strong>, {TIER_LABELS.silver}: <strong>{counts.silver}</strong>, {TIER_LABELS.gold}: <strong>{counts.gold}</strong>
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
              <option value="free">{TIER_LABELS.free}</option>
              <option value="silver">{TIER_LABELS.silver}</option>
              <option value="gold">{TIER_LABELS.gold}</option>
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
                <Card key={t.id} className="relative border-2 border-pink-200 shadow-2xl bg-white/70 backdrop-blur-md">
                  <CardContent className="py-6">
                    {/* Pixel corner accents */}
                    <span aria-hidden className="absolute top-0 left-0 w-2 h-2 bg-pink-300" />
                    <span aria-hidden className="absolute top-0 right-0 w-2 h-2 bg-pink-300" />
                    <span aria-hidden className="absolute bottom-0 left-0 w-2 h-2 bg-pink-300" />
                    <span aria-hidden className="absolute bottom-0 right-0 w-2 h-2 bg-pink-300" />
                    {/* Subtle glitch accent bars */}
                    <span aria-hidden className="absolute top-4 left-0 w-8 h-[2px] bg-gradient-to-r from-pink-400 to-transparent opacity-40" />
                    <span aria-hidden className="absolute bottom-6 right-0 w-10 h-[2px] bg-gradient-to-l from-pink-400 to-transparent opacity-40" />
                    
                    <div className="space-y-2 text-center relative z-10">
                      <h2 className="text-2xl font-bold text-pink-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)] flex items-center justify-center gap-2">
                        {displayLabel(t.name)}
                        <PixelHeart size={18} className="-translate-y-[2px]" />
                      </h2>
                      <p className="text-pink-600">Rank {t.rank}</p>
                      <p className="text-pink-700 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                      {t.description && <p className="text-pink-600 text-sm">{t.description}</p>}
                      <div className="pt-4">
                        <PixelHeartButton
                          size={64}
                          label="Select"
                          labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                          shadow={true}
                          disabled={subscribing === t.id}
                          onClick={() => chooseTier(t.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }
            // Sinking variation → transitioning deeper into trance
            if (t.name?.toLowerCase() === "silver") {
              return (
                <Card key={t.id} className="relative border-2 border-pink-300 shadow-2xl bg-pink-100/70 backdrop-blur-md">
                  <CardContent className="py-6">
                    {/* Pixel corner accents */}
                    <span aria-hidden className="absolute top-0 left-0 w-2 h-2 bg-pink-400" />
                    <span aria-hidden className="absolute top-0 right-0 w-2 h-2 bg-pink-400" />
                    <span aria-hidden className="absolute bottom-0 left-0 w-2 h-2 bg-pink-400" />
                    <span aria-hidden className="absolute bottom-0 right-0 w-2 h-2 bg-pink-400" />
                    {/* RGB split border effect */}
                    <div aria-hidden className="absolute inset-0 border border-pink-400 opacity-60" />
                    <div aria-hidden className="absolute inset-0 border border-cyan-300 opacity-20 translate-x-[1px]" />
                    <div aria-hidden className="absolute inset-0 border border-red-300 opacity-20 -translate-x-[1px]" />
                    {/* Glitch accent bars */}
                    <span aria-hidden className="absolute top-4 left-0 w-10 h-[2px] bg-gradient-to-r from-pink-500 to-transparent opacity-50" />
                    <span aria-hidden className="absolute bottom-6 right-0 w-12 h-[2px] bg-gradient-to-l from-pink-500 to-transparent opacity-50" />
                    {t.rank === 2 && (
                      <div className="absolute -top-2 right-2 border-2 border-pink-500 bg-pink-300/90 backdrop-blur-sm text-pink-900 text-[10px] px-2 py-1 font-bold">Most Popular</div>
                    )}
                    
                    <div className="space-y-2 text-center relative z-10">
                      <h2 className="text-2xl font-bold text-pink-500 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]">{displayLabel(t.name)}</h2>
                      <p className="text-pink-700">Rank {t.rank}</p>
                      <p className="text-pink-800 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                      {t.description && <p className="text-pink-700 text-sm">{t.description}</p>}
                      <div className="pt-4">
                        <PixelHeartButton
                          size={64}
                          label="Select"
                          labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                          shadow={true}
                          disabled={subscribing === t.id}
                          onClick={() => chooseTier(t.id)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            }

            // Mindless variation → deep trance, fully immersed
            if (t.name?.toLowerCase() === "gold") {
              return (
                <Card key={t.id} className="relative border-2 border-pink-400 shadow-2xl bg-pink-200/80 backdrop-blur-md">
                  <CardContent className="py-6">
                    {/* Pixel corner accents */}
                    <span aria-hidden className="absolute top-0 left-0 w-2 h-2 bg-pink-500" />
                    <span aria-hidden className="absolute top-0 right-0 w-2 h-2 bg-pink-500" />
                    <span aria-hidden className="absolute bottom-0 left-0 w-2 h-2 bg-pink-500" />
                    <span aria-hidden className="absolute bottom-0 right-0 w-2 h-2 bg-pink-500" />
                    {/* Stronger RGB split border effect */}
                    <div aria-hidden className="absolute inset-0 border border-pink-500 opacity-70" />
                    <div aria-hidden className="absolute inset-0 border border-cyan-400 opacity-30 translate-x-[2px]" />
                    <div aria-hidden className="absolute inset-0 border border-red-400 opacity-30 -translate-x-[2px]" />
                    {/* Scattered pixel noise */}
                    <span aria-hidden className="absolute top-2 left-2 w-1 h-1 bg-pink-600" />
                    <span aria-hidden className="absolute top-3 left-5 w-1 h-1 bg-pink-500" />
                    <span aria-hidden className="absolute top-2 right-4 w-1 h-1 bg-pink-600" />
                    <span aria-hidden className="absolute bottom-2 left-3 w-1 h-1 bg-pink-600" />
                    <span aria-hidden className="absolute bottom-2 right-2 w-1 h-1 bg-pink-500" />
                    {/* Glitch accent bars */}
                    <span aria-hidden className="absolute top-5 left-0 w-12 h-[2px] bg-gradient-to-r from-pink-600 to-transparent opacity-60" />
                    <span aria-hidden className="absolute bottom-8 right-0 w-14 h-[2px] bg-gradient-to-l from-pink-600 to-transparent opacity-60" />
                    
                    <div className="space-y-2 text-center relative z-10">
                      <h2 className="text-2xl font-bold text-pink-600 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]">{displayLabel(t.name)}</h2>
                      <p className="text-pink-800">Rank {t.rank}</p>
                      <p className="text-pink-900 font-medium">${(t.monthly_price_cents/100).toFixed(2)}/month</p>
                      {t.description && <p className="text-pink-800 text-sm">{t.description}</p>}
                      <div className="pt-4">
                        <PixelHeartButton
                          size={64}
                          label="Select"
                          labelClassName="text-white drop-shadow-[0_1px_0_rgba(0,0,0,0.85)]"
                          shadow={true}
                          disabled={subscribing === t.id}
                          onClick={() => chooseTier(t.id)}
                        />
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