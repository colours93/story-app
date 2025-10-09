"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ChapterSection } from "@/components/chapter-section"
import { ChapterTransition } from "@/components/chapter-transition"
import { ImageUploadPanel } from "@/components/image-upload-panel"
import { storyChapters } from "@/lib/story-data"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"
import { signOut } from "next-auth/react"

function StoryContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [chapters, setChapters] = useState(storyChapters)
  const [visibleChapters, setVisibleChapters] = useState<number[]>(storyChapters.map(ch => ch.id))
  const observerRef = useRef<IntersectionObserver | null>(null)
  const searchParams = useSearchParams()
  
  // Check if we're in viewer mode
  const isViewerMode = searchParams.get('mode') === 'view' || searchParams.get('viewer') === 'true'
  
  // Check if user is admin
  const isAdmin = session?.user?.role === 'admin'

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/login')
    }
  }, [session, status, router])

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const chapterId = Number.parseInt(entry.target.getAttribute("data-chapter-id") || "0")
          if (entry.isIntersecting) {
            setVisibleChapters((prev) => [...new Set([...prev, chapterId])])
          }
        })
      },
      { threshold: 0.1, rootMargin: "0px 0px -10% 0px" },
    )

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [])

  const handleImageUpdate = (chapterId: number, imageUrls: string[]) => {
    setChapters((prev) =>
      prev.map((chapter) =>
        chapter.id === chapterId ? { ...chapter, images: imageUrls } : chapter,
      ),
    )
  }

  const handleTextUpdate = (chapterId: number, title: string, content: string) => {
    setChapters((prev) => prev.map((chapter) => (chapter.id === chapterId ? { ...chapter, title, content } : chapter)))
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header with user info and logout */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-4">
        <span className="text-sm text-gray-300">
          Welcome, {session.user.name}
        </span>
        {session.user.role === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/admin')}
            className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
          >
            <Settings className="w-4 h-4 mr-2" />
            Admin
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <main className="relative">
        {chapters.map((chapter, index) => (
          <div key={chapter.id}>
            <ChapterSection
              chapter={chapter}
              isVisible={visibleChapters.includes(chapter.id)}
              observerRef={observerRef}
            />
            {chapter.images && chapter.images.length > 0 && (
              <ChapterTransition
                chapter={chapter}
                isVisible={visibleChapters.includes(chapter.id)}
              />
            )}
          </div>
        ))}
      </main>

      {/* Only show upload panel if not in viewer mode AND user is admin */}
      {!isViewerMode && isAdmin && (
        <ImageUploadPanel 
          chapters={chapters} 
          onImageUpdate={handleImageUpdate} 
          onTextUpdate={handleTextUpdate} 
        />
      )}
    </div>
  )
}

export default function StoryPage() {
  return <StoryContent />
}
