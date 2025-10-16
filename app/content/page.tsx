"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, MessageCircle, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import CardHeartsOverlay from "@/components/card-hearts-overlay"
import FloatingContentDock from "@/components/floating-content-dock"

type Asset = { id: string; post_id: string; media_url: string; media_type: 'image' | 'video'; thumb_url?: string }
type Post = { id: string; user_id: string; title?: string; body?: string; price_cents?: number | null; created_at: string; assets: Asset[]; can_view?: boolean; required_tier_id?: string | null; is_special_card?: boolean }

export default function ContentFeedPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all')
  const [q, setQ] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [postedFrom, setPostedFrom] = useState<string>('')
  const [postedTo, setPostedTo] = useState<string>('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [sort, setSort] = useState<string>('newest')
  // Simple rotation across rounds: 0-1 => every 3rd, 2-3 => every 4th, 4 => every 5th
  const [rotationRound, setRotationRound] = useState<number>(0)
  const [engagement, setEngagement] = useState<Record<string, {
    likedByUser?: boolean
    count?: number
    users?: Array<{ user_id: string; username: string }>
    comments?: Array<{ id: string; user_id: string; username: string; text: string; created_at: string }>
  }>>({})

  // Helper: download asset with fallback to opening in new tab
  async function downloadAsset(url: string) {
    try {
      const res = await fetch(url, { mode: 'cors' })
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      const ext = blob.type.includes('image') ? 'jpg' : (blob.type.includes('video') ? 'mp4' : 'bin')
      a.download = `bambiland-${Date.now()}.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(objectUrl)
    } catch (err) {
      // Fallback if CORS blocks download
      window.open(url, '_blank')
    }
  }
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
  const [purchase, setPurchase] = useState<Record<string, { purchased: boolean }>>({})
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerPostId, setViewerPostId] = useState<string | null>(null)
  const [viewerAssetIndex, setViewerAssetIndex] = useState<number>(0)
  const [gateOpen, setGateOpen] = useState(false)
  const [gatePostId, setGatePostId] = useState<string | null>(null)
  const [gateType, setGateType] = useState<'tier' | 'purchase' | null>(null)

  useEffect(() => {
    const initialType = (searchParams.get('type') || 'all').toLowerCase()
    const initialQ = searchParams.get('q') || ''
    const initialFrom = searchParams.get('from') || ''
    const initialTo = searchParams.get('to') || ''
    const initialMin = searchParams.get('min') || ''
    const initialMax = searchParams.get('max') || ''
    const initialSort = searchParams.get('sort') || 'newest'
    if (initialType === 'image' || initialType === 'video' || initialType === 'all') {
      setTypeFilter(initialType as 'all' | 'image' | 'video')
    }
    setQ(initialQ)
    setPostedFrom(initialFrom)
    setPostedTo(initialTo)
    setMinPrice(initialMin)
    setMaxPrice(initialMax)
    setSort(initialSort)
    void loadPage(1, initialType as 'all' | 'image' | 'video', initialQ)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Initialize rotation round from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const saved = Number(window.localStorage.getItem('feed:rotation_round') || '0') || 0
        setRotationRound(saved % 5)
      }
    } catch {}
  }, [])

  useEffect(() => {
    if (!sentinelRef.current) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loading) {
        void loadPage(page + 1)
      }
    })
    observer.observe(sentinelRef.current)
    return () => observer.disconnect()
  }, [page, hasMore, loading, typeFilter, q])

  async function loadPage(nextPage: number, typeArg?: 'all' | 'image' | 'video', qArg?: string) {
    setLoading(true)
    try {
      const t = typeArg ?? typeFilter
      const qs = qArg ?? q
      const queryParts = [
        `page=${nextPage}`,
        `limit=8`,
        `type=${t}`,
        `q=${encodeURIComponent(qs)}`,
      ]
      if (postedFrom) queryParts.push(`from=${encodeURIComponent(postedFrom)}`)
      if (postedTo) queryParts.push(`to=${encodeURIComponent(postedTo)}`)
      if (minPrice) queryParts.push(`min=${encodeURIComponent(minPrice)}`)
      if (maxPrice) queryParts.push(`max=${encodeURIComponent(maxPrice)}`)
      if (sort) queryParts.push(`sort=${encodeURIComponent(sort)}`)
      const res = await fetch(`/api/feed?${queryParts.join('&')}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load feed')
      // Advance rotation when fresher content is detected on page 1
      if (nextPage === 1 && Array.isArray(data.posts)) {
        try {
          const maxCreatedMs = data.posts.reduce((m: number, p: any) => {
            const t = Number(new Date(p?.created_at || 0).getTime()) || 0
            return t > m ? t : m
          }, 0)
          if (typeof window !== 'undefined') {
            const lastMs = Number(window.localStorage.getItem('feed:last_max_created_at') || '0') || 0
            let round = Number(window.localStorage.getItem('feed:rotation_round') || '0') || 0
            if (maxCreatedMs > lastMs) {
              round = (round + 1) % 5
              window.localStorage.setItem('feed:last_max_created_at', String(maxCreatedMs))
              window.localStorage.setItem('feed:rotation_round', String(round))
              setRotationRound(round)
            } else {
              setRotationRound(round % 5)
            }
          }
        } catch {}
      }
      setPosts((prev) => nextPage === 1 ? data.posts : [...prev, ...data.posts])
      setPage(nextPage)
      setHasMore(Boolean(data.hasMore))
    } catch (e) {
      console.error('Feed load error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function loadLikes(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/likes`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load likes')
      setEngagement((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), likedByUser: data.likedByUser, count: data.count, users: data.users },
      }))
    } catch (e) {
      console.error('Likes load error:', e)
    }
  }

  async function toggleLike(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/likes`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to toggle like')
      // Refresh likes list to update usernames and count
      await loadLikes(postId)
    } catch (e) {
      console.error('Toggle like error:', e)
    }
  }

  async function addToGallery(postId: string) {
    try {
      // Require auth to add to personal gallery
      const userId = (session?.user as any)?.id
      if (!userId) {
        toast({ title: 'Sign in required', description: 'Sign in to add items to your gallery.', variant: 'destructive' })
        return
      }
      // 1) Client-side: persist favorites to localStorage for immediate profile display
      try {
        const username = ((session?.user as any)?.name || '').toLowerCase()
        const key = username ? `gallery:${username}` : ''
        if (key) {
          const post = posts.find((pp) => pp.id === postId)
          const assets = Array.isArray(post?.assets) ? post!.assets : []
          const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
          const existing: Array<{ asset_id: string; post_id: string; media_type: 'image' | 'video'; media_url: string; created_at?: string }> = raw ? JSON.parse(raw) : []
          const now = new Date().toISOString()
          const merged = [...existing]
          for (const a of assets) {
            const already = merged.some((x) => x.asset_id === a.id)
            if (!already) {
              merged.push({ asset_id: a.id, post_id: postId, media_type: a.media_type, media_url: a.media_url, created_at: now })
            }
          }
          window.localStorage.setItem(key, JSON.stringify(merged))
        }
      } catch {}

      // 2) Server: best-effort API call (optional in dev) to persist favorites
      try {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/favorites`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId }),
        })
        // Safely parse JSON only when present to avoid errors
        let data: any = null
        try {
          const ct = res.headers.get('content-type') || ''
          if (ct.includes('application/json')) {
            data = await res.json()
          }
        } catch {}
        // Do not block UX if server fails; localStorage ensures immediate gallery
      } catch {}

      toast({ title: 'Added to Favorites', description: 'Opening your profile gallery…' })
      const username = (session?.user as any)?.name
      if (username) {
        router.push(`/u/${encodeURIComponent(username)}#gallery`)
      }
    } catch (e) {
      console.error('Add to favorites error:', e)
      toast({ title: 'Action failed', description: 'Could not add to favorites right now.', variant: 'destructive' })
    }
  }

  async function loadComments(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load comments')
      setEngagement((prev) => ({
        ...prev,
        [postId]: { ...(prev[postId] || {}), comments: data.comments },
      }))
    } catch (e) {
      console.error('Comments load error:', e)
    }
  }

  async function submitComment(postId: string) {
    try {
      const text = (commentDrafts[postId] || '').trim()
      if (!text) return
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to add comment')
      setCommentDrafts((prev) => ({ ...prev, [postId]: '' }))
      await loadComments(postId)
    } catch (e) {
      console.error('Submit comment error:', e)
    }
  }

  async function loadPurchase(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/purchase`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load purchase state')
      setPurchase((prev) => ({ ...prev, [postId]: { purchased: Boolean(data.purchased) } }))
    } catch (e) {
      console.error('Purchase load error:', e)
    }
  }

  async function doPurchase(postId: string) {
    try {
      const res = await fetch(`/api/posts/${postId}/purchase`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to purchase')
      setPurchase((prev) => ({ ...prev, [postId]: { purchased: true } }))
      setGateOpen(false)
      // Do not auto-maximize after purchase; keep content visible in feed.
    } catch (e) {
      console.error('Purchase error:', e)
    }
  }

  useEffect(() => {
    // Lazy load engagement for new posts
    posts.forEach((p) => {
      const e = engagement[p.id]
      if (!e || e.count === undefined) void loadLikes(p.id)
      if (!e || !e.comments) void loadComments(p.id)
      if ((p.price_cents || 0) > 0 && !purchase[p.id]) void loadPurchase(p.id)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [posts])

  function isLocked(p: Post) {
    const hasPrice = (p.price_cents || 0) > 0
    // Purchase should unlock regardless of membership tier.
    if (hasPrice) {
      return !purchase[p.id]?.purchased
    }
    // No price: respect tier gating.
    return p.can_view === false
  }

  function handleMediaClick(p: Post, assetIdx: number) {
    const locked = isLocked(p)
    if (locked) {
      const hasPrice = (p.price_cents || 0) > 0
      const purchased = !!purchase[p.id]?.purchased
      setGatePostId(p.id)
      setGateType(hasPrice && !purchased ? 'purchase' : 'tier')
      setGateOpen(true)
      setViewerPostId(p.id)
      setViewerAssetIndex(assetIdx)
      return
    }
    setViewerPostId(p.id)
    setViewerAssetIndex(assetIdx)
    setViewerOpen(true)
  }

  function applyFiltersAndReload() {
    // Merge and push the query params to reflect filters in URL
    const params = new URLSearchParams()
    params.set('type', typeFilter)
    if (q) params.set('q', q)
    if (postedFrom) params.set('from', postedFrom)
    if (postedTo) params.set('to', postedTo)
    if (minPrice) params.set('min', minPrice)
    if (maxPrice) params.set('max', maxPrice)
    if (sort) params.set('sort', sort)
    const url = `${pathname}?${params.toString()}`
    router.push(url)
    void loadPage(1, typeFilter, q)
    setFiltersOpen(false)
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 font-bubble relative overflow-hidden">
      {/* Page-level hearts overlay above content, non-interfering */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <CardHeartsOverlay density="high" count={20} minSize={24} maxSize={48} opacity={0.45} />
      </div>
      <div className="mb-3" />
      <div className="space-y-6">
        {posts.map((p, idx) => {
          const useNewStyle = !!p.is_special_card
          const containerClass = useNewStyle
            ? "relative overflow-hidden border-2 border-pink-300 shadow-2xl bg-white/70 backdrop-blur-md"
            : "bg-white border-pink-200 shadow-sm"
          const cornerColor = "bg-pink-300"
          return (
            <Card key={p.id} className={containerClass}>
              {useNewStyle && (
                <>
                  {/* Pixel corner accents */}
                  <span aria-hidden className={`absolute top-0 left-0 w-2 h-2 ${cornerColor}`} />
                  <span aria-hidden className={`absolute top-0 right-0 w-2 h-2 ${cornerColor}`} />
                  <span aria-hidden className={`absolute bottom-0 left-0 w-2 h-2 ${cornerColor}`} />
                  <span aria-hidden className={`absolute bottom-0 right-0 w-2 h-2 ${cornerColor}`} />
                </>
              )}

              {/* RGB split border effect for special cards */}
              {useNewStyle && (
                <>
                  <div aria-hidden className="absolute inset-0 border border-pink-400 opacity-60" />
                  <div aria-hidden className="absolute inset-0 border border-cyan-300 opacity-20 translate-x-[1px]" />
                  <div aria-hidden className="absolute inset-0 border border-red-300 opacity-20 -translate-x-[1px]" />
                </>
              )}

              {/* Glitch accent bars */}
              {useNewStyle && (
                <>
                  <span aria-hidden className="absolute top-4 left-0 w-10 h-[2px] bg-gradient-to-r from-pink-500 to-transparent opacity-50" />
                  <span aria-hidden className="absolute bottom-6 right-0 w-12 h-[2px] bg-gradient-to-l from-pink-500 to-transparent opacity-50" />
                </>
              )}

              <CardContent className="p-0 relative z-10">
                {/* Media gallery - preserve natural aspect ratio */}
                {p.assets.length > 0 && (
                  <div className="grid grid-cols-1 gap-2">
                    {p.assets.map((a, idx) => (
                      <div
                        key={a.id}
                        className="relative bg-pink-100 flex items-center justify-center cursor-pointer"
                        onClick={() => handleMediaClick(p, idx)}
                      >
                        {a.media_type === 'image' ? (
                          <img
                            src={a.media_url}
                            alt={p.title || 'post image'}
                            className={(isLocked(p) ? 'blur-md brightness-75 ' : '') + 'w-full h-auto object-contain max-h-[75vh]'}
                            loading="lazy"
                            onClick={() => handleMediaClick(p, idx)}
                          />
                        ) : (
                          <video
                            src={a.media_url}
                            controls={!isLocked(p)}
                            className={(isLocked(p) ? 'blur-md brightness-75 ' : '') + 'w-full h-auto object-contain max-h-[75vh]'}
                            onClick={() => handleMediaClick(p, idx)}
                          />
                        )}

                        {/* Three-dots menu in the top-right corner of the image */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="absolute top-2 right-2 z-40 inline-flex items-center justify-center rounded-full border border-pink-500 bg-transparent text-pink-600 hover:bg-pink-600 hover:text-white transition-colors w-8 h-8"
                              aria-label="More actions"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            <DropdownMenuItem onClick={() => void addToGallery(p.id)} className="font-bubble text-black cursor-pointer">
                              Add to profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => void downloadAsset(a.media_url)} className="font-bubble text-black cursor-pointer">
                              Download
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {isLocked(p) && (
                          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2">
                            <div className="bg-white/50 backdrop-blur-sm rounded-2xl px-4 py-2 text-pink-600 font-bubble shadow">
                              Click Me
                            </div>
                            {useNewStyle && (
                              <div
                                className="pointer-events-none text-pink-600 text-xl sm:text-2xl font-bold tracking-wide select-none drop-shadow-[0_0_6px_rgba(236,72,153,0.35)] animate-pulse"
                                style={{ animationDuration: '4s', animationTimingFunction: 'ease-in-out' }}
                              >
                                XXXtra Spicy
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

              {/* Toolbar row: Title on left, actions on right with helper text below */}
              <div className="px-4 py-3 flex items-center justify-between">
                {/* Title styled like Bambiland header: font-bubble + 2D box */}
                <h2
                  className="font-bubbleTitle text-xl sm:text-2xl font-bold text-pink-300 truncate"
                >
                  {p.title || 'Untitled'}
                </h2>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="flex items-center gap-2 text-pink-600"
                      onClick={() => void toggleLike(p.id)}
                    >
                      <Heart
                        className={(engagement[p.id]?.likedByUser ? 'fill-pink-600 text-pink-600' : 'text-pink-600') + ' w-5 h-5'}
                      />
                    <span className="text-sm font-medium">
                      {((engagement[p.id]?.count ?? 0) === 1 && engagement[p.id]?.users?.[0]?.username)
                        ? `Liked by ${engagement[p.id]?.users?.[0]?.username}`
                        : `${engagement[p.id]?.count ?? 0} Likes`}
                    </span>
                    </button>
                  </div>
                  {((engagement[p.id]?.count ?? 0) === 0) && (
                    <div className="mt-1 text-xs text-pink-400">Be the first to like this</div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    {p.body && <p className="text-pink-800 text-sm">{p.body}</p>}
                    {(engagement[p.id]?.count ?? 0) > 1 && engagement[p.id]?.users && engagement[p.id]?.users!.length > 0 && (
                      <div className="mt-1 text-xs text-pink-700 truncate">
                        Liked by {engagement[p.id]?.users?.slice(0, 3).map((u) => u.username).join(', ')}
                        {((engagement[p.id]?.users?.length || 0) > 3) ? ` +${(engagement[p.id]?.users?.length || 0) - 3} more` : ''}
                      </div>
                    )}
                  </div>
                  {typeof p.price_cents === 'number' && (
                    <span className="inline-flex items-center justify-center rounded-full bg-pink-300 text-pink-700 px-4 py-2 ring-2 ring-white">
                      ${(p.price_cents/100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Comments section */}
              <div className="px-4 pb-4">
                <div className="space-y-2">
                  {engagement[p.id]?.comments && engagement[p.id]?.comments!.length > 0 ? (
                    engagement[p.id]?.comments?.map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-semibold text-pink-700">{c.username}</span>
                        <span className="text-pink-800"> {c.text}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-pink-500">
                      <MessageCircle className="w-4 h-4 text-pink-600" />
                      <span className="text-sm font-semibold text-pink-700">Comments</span>
                      <span>No comments yet</span>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Input
                    value={commentDrafts[p.id] || ''}
                    onChange={(e) => setCommentDrafts((prev) => ({ ...prev, [p.id]: e.target.value }))}
                    placeholder="Add a comment…"
                    onKeyDown={(e) => { if (e.key === 'Enter') void submitComment(p.id) }}
                    className="font-bubble border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"
                  />
                  <Button variant="secondary" onClick={() => void submitComment(p.id)}>Post</Button>
                </div>
              </div>
              </CardContent>
            </Card>
          )
        })}
        {/* Fullscreen viewer */}
        <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
          <DialogContent className="max-w-3xl" showCloseButton={false}>
            {/* Hidden title for accessibility (required by Radix Dialog) */}
            <DialogTitle className="sr-only">Content Viewer</DialogTitle>
            <div className="relative">
              {/* Custom close button overlay anchored to media corner */}
              <DialogClose
                onClick={() => setViewerOpen(false)}
                className="absolute top-2 right-2 z-50 inline-flex items-center justify-center rounded-full bg-white/60 text-pink-600 border border-pink-200 shadow-sm hover:bg-white/80 transition-colors w-8 h-8"
              >
                <span className="font-bold">×</span>
              </DialogClose>
              {viewerPostId && posts.find((pp) => pp.id === viewerPostId)?.assets[viewerAssetIndex] && (
                (() => {
                  const a = posts.find((pp) => pp.id === viewerPostId)!.assets[viewerAssetIndex]
                  return a.media_type === 'image' ? (
                    <img src={a.media_url} alt="full" className="relative z-0 w-full h-auto object-contain" />
                  ) : (
                    <video src={a.media_url} controls className="relative z-0 w-full h-auto object-contain" />
                  )
                })()
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Gate dialog (membership or purchase) */}
        <Dialog open={gateOpen} onOpenChange={setGateOpen}>
          <DialogContent className="max-w-md text-center font-bubble">
            <DialogHeader className="text-center">
              <DialogTitle className="text-pink-500">
                {gateType === 'purchase' ? 'Purchase to Unlock 🔓' : 'Members Only Content'}
              </DialogTitle>
            </DialogHeader>
            {gateType === 'purchase' && gatePostId && (
              <div className="mt-2">
                {(() => {
                  const post = posts.find((pp) => pp.id === gatePostId)
                  const price = post?.price_cents ? (post.price_cents/100).toFixed(2) : '0.00'
                  return (
                    <Button
                      variant="outline"
                      className="mx-auto inline-flex items-center gap-1 rounded-full border border-pink-300 bg-pink-50 text-pink-600 hover:bg-pink-100 shadow-none px-4 py-2"
                      onClick={() => gatePostId && doPurchase(gatePostId)}
                    >
                      <span>$</span>
                      <span>{price}</span>
                    </Button>
                  )
                })()}
              </div>
            )}
            {gateType === 'tier' && (
              <div className="space-y-3">
                <div className="text-pink-800">Upgrade your membership to view this content.</div>
                <a href="/membership" className="inline-flex items-center justify-center rounded-md bg-pink-500 px-4 py-2 text-white hover:bg-pink-600">Go to Membership</a>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading ? <span className="text-pink-500">Loading…</span> : hasMore ? <Button variant="ghost">Load more</Button> : <span className="text-pink-500">No more content</span>}
        </div>
      </div>

      {/* Floating bottom dock with cute icons */}
      <FloatingContentDock
        activeType={typeFilter}
        onChangeType={(t) => { setTypeFilter(t); void loadPage(1, t, q) }}
        onOpenFilters={() => setFiltersOpen(true)}
      />

      {/* Filters modal */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="max-w-lg font-bubble">
          <DialogHeader>
            <DialogTitle className="text-pink-500">Search & Filters</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-sm text-pink-700">Search keywords</label>
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search content…"
                className="font-bubble border-pink-200 bg-white/60 text-pink-700 placeholder:text-pink-300"
              />
            </div>
            <div>
              <label className="text-sm text-pink-700">Posted from</label>
              <Input type="date" value={postedFrom} onChange={(e) => setPostedFrom(e.target.value)} className="font-bubble border-pink-200 bg-white/60 text-pink-700" />
            </div>
            <div>
              <label className="text-sm text-pink-700">Posted to</label>
              <Input type="date" value={postedTo} onChange={(e) => setPostedTo(e.target.value)} className="font-bubble border-pink-200 bg-white/60 text-pink-700" />
            </div>
            <div>
              <label className="text-sm text-pink-700">Min price ($)</label>
              <Input type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="font-bubble border-pink-200 bg-white/60 text-pink-700" />
            </div>
            <div>
              <label className="text-sm text-pink-700">Max price ($)</label>
              <Input type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="font-bubble border-pink-200 bg-white/60 text-pink-700" />
            </div>
            <div className="col-span-2">
              <label className="text-sm text-pink-700">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full rounded-md border border-pink-200 bg-white/60 text-pink-700 px-3 py-2"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="price_high">Price: high to low</option>
                <option value="price_low">Price: low to high</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Button variant="ghost" onClick={() => { setPostedFrom(''); setPostedTo(''); setMinPrice(''); setMaxPrice(''); setSort('newest'); setQ(''); }}>Reset</Button>
            <Button variant="secondary" onClick={applyFiltersAndReload}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}