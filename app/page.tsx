"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ChapterSection } from "@/components/chapter-section"
import { ChapterTransition } from "@/components/chapter-transition"
import { ImageUploadPanel } from "@/components/image-upload-panel"
import { storyChapters } from "@/lib/story-data"

export default function StoryPage() {
  const [chapters, setChapters] = useState(storyChapters)
  const [visibleChapters, setVisibleChapters] = useState<number[]>(storyChapters.map(ch => ch.id))
  const observerRef = useRef<IntersectionObserver | null>(null)
  const searchParams = useSearchParams()
  
  // Check if we're in viewer mode
  const isViewerMode = searchParams.get('mode') === 'view' || searchParams.get('viewer') === 'true'

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

  const handleTextUpdate = (chapterId: number, title: string, content: string) => {
    setChapters((prev) => prev.map((chapter) => (chapter.id === chapterId ? { ...chapter, title, content } : chapter)))
  }

  const handleImageUpdate = (chapterId: number, imageUrls: string[]) => {
    setChapters((prev) =>
      prev.map((chapter) => (chapter.id === chapterId ? { ...chapter, images: imageUrls } : chapter)),
    )
  }

  return (
    <main className="relative">
      {chapters.map((chapter, index) => (
        <div key={chapter.id}>
          <ChapterSection
            chapter={chapter}
            observerRef={observerRef}
            isVisible={visibleChapters.includes(chapter.id)}
            isFirst={index === 0}
            isLast={index === chapters.length - 1}
          />
          {chapter.images && chapter.images.length > 0 && (
            <ChapterTransition 
              chapter={chapter} 
              isVisible={visibleChapters.includes(chapter.id)} 
            />
          )}
        </div>
      ))}

      <section className="relative h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-serif text-gray-900">The End</h2>
          <p className="text-gray-600">...or is it just the beginning?</p>
        </div>
      </section>

      {!isViewerMode && (
        <ImageUploadPanel chapters={chapters} onImageUpdate={handleImageUpdate} onTextUpdate={handleTextUpdate} />
      )}
    </main>
  )
}
