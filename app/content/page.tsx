"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Button } from "@/components/ui/button"

type Asset = { id: string; post_id: string; media_url: string; media_type: 'image' | 'video'; thumb_url?: string }
type Post = { id: string; user_id: string; title?: string; body?: string; price_cents?: number | null; created_at: string; assets: Asset[] }

export default function ContentFeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    // Initial load
    void loadPage(1)
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
  }, [page, hasMore, loading])

  async function loadPage(nextPage: number) {
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?page=${nextPage}&limit=8`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Failed to load feed')
      setPosts((prev) => nextPage === 1 ? data.posts : [...prev, ...data.posts])
      setPage(nextPage)
      setHasMore(Boolean(data.hasMore))
    } catch (e) {
      console.error('Feed load error:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8 font-bubble">
      <div className="mb-6" />
      <h1 className="text-3xl font-bold text-pink-600 mb-6">Your Content Feed</h1>
      <div className="space-y-6">
        {posts.map((p) => (
          <Card key={p.id} className="bg-white border-pink-200 shadow-sm">
            <CardContent className="p-0">
              {/* Media gallery */}
              {p.assets.length > 0 && (
                <div className="grid grid-cols-1 gap-2">
                  {p.assets.map((a) => (
                    <div key={a.id} className="bg-pink-100">
                      <AspectRatio ratio={16/9}>
                        {a.media_type === 'image' ? (
                          <img src={a.media_url} alt={p.title || 'post image'} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <video src={a.media_url} controls className="w-full h-full object-cover" />
                        )}
                      </AspectRatio>
                    </div>
                  ))}
                </div>
              )}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-pink-700">{p.title || 'Untitled'}</h2>
                    {p.body && <p className="text-pink-800 text-sm">{p.body}</p>}
                  </div>
                  {typeof p.price_cents === 'number' && (
                    <span className="inline-flex items-center justify-center rounded-full bg-pink-300 text-pink-700 px-4 py-2 ring-2 ring-white">
                      ${(p.price_cents/100).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        <div ref={sentinelRef} className="h-10 flex items-center justify-center">
          {loading ? <span className="text-pink-500">Loading…</span> : hasMore ? <Button variant="ghost">Load more</Button> : <span className="text-pink-500">No more content</span>}
        </div>
      </div>
    </div>
  )
}