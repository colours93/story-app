"use client"

import type React from "react"

import { useEffect, useRef } from "react"
import Image from "next/image"

interface Chapter {
  id: number
  title: string
  content: string
  images: string[]
}

interface ChapterSectionProps {
  chapter: Chapter
  observerRef: React.MutableRefObject<IntersectionObserver | null>
  isVisible: boolean
  isFirst?: boolean
  isLast?: boolean
}

export function ChapterSection({ chapter, observerRef, isVisible, isFirst, isLast }: ChapterSectionProps) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const currentSection = sectionRef.current
    if (currentSection && observerRef.current) {
      observerRef.current.observe(currentSection)
    }

    return () => {
      if (currentSection && observerRef.current) {
        observerRef.current.unobserve(currentSection)
      }
    }
  }, [observerRef])

  return (
    <section
      ref={sectionRef}
      data-chapter-id={chapter.id}
      className="relative min-h-screen flex items-center justify-center py-20 px-4"
    >
      {/* Frozen blurred background - no gradients */}
      <div className="absolute inset-0 z-0">
        <Image
          src={chapter.images[0] || "/placeholder.svg?height=1080&width=1920"}
          alt={chapter.title}
          fill
          className="object-cover blur-3xl opacity-60"
          priority={chapter.id === 1}
        />
      </div>

      <div
        className={`relative z-10 max-w-2xl mx-auto transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Smaller text content directly on background */}
        <div className="p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-serif mb-6 text-black drop-shadow-2xl text-balance font-bold">
            {chapter.title}
          </h2>
          <div className="space-y-4 text-base md:text-lg leading-relaxed text-black font-medium drop-shadow-lg">
            {chapter.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-pretty">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
