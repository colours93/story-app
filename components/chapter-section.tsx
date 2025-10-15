"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"

interface Chapter {
  id: number
  title: string
  content: string
  images: string[]
  videoUrl?: string
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
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // Determine glow style: dark for chapters 2, 5, 6; white otherwise
  const isDarkGlowChapter = [2, 5, 6].includes(chapter.id)
  const pinkGlowClass = isDarkGlowChapter
    ? "drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
    : "drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]"

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

  const goToNext = () => {
    if (chapter.images && currentImageIndex < chapter.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1)
    }
  }

  const goToPrevious = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1)
    }
  }

  const handlePreviewClick = () => {
    setIsFullscreen(true)
  }

  const handleFullscreenImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const imageWidth = rect.width
    const edgeZone = imageWidth * 0.3
    if (clickX < edgeZone && currentImageIndex > 0) {
      goToPrevious()
    } else if (clickX > imageWidth - edgeZone && chapter.images && currentImageIndex < chapter.images.length - 1) {
      goToNext()
    }
  }

  return (
    <section
      ref={sectionRef}
      data-chapter-id={chapter.id}
      className={`relative ${isFirst ? 'pt-6 pb-10' : 'py-12'} px-4 overflow-hidden`}
    >
      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Content directly on background */}
        <div className="p-6 md:p-8">
          <div className="mb-6">
            {/* Main chapter title: black with subtle pink stroke */}
            <h2
              className={`text-2xl md:text-4xl font-bubble mb-2 text-black ${pinkGlowClass} text-balance text-center font-bold`}
              style={{ WebkitTextStroke: "0.2px #f472b6" }}
            >
              {(() => {
                // Define exact chapter titles mapping
                const chapterTitles: { [key: number]: string } = {
                  1: "Chapter 1: Dawn's Molten Crave",
                  2: "Chapter 2: Counter's Wicked Heat",
                  3: "Chapter 3: Boutique's Naughty Spark", 
                  4: "Chapter 4: Café's Sinful Blaze",
                  5: "Chapter 5: Netflix's Daze",
                  6: "Chapter 6: Filthy Pharmacy",
                  7: "Chapter 7: Fleeting Heat",
                  8: "Chapter 8: Shower's Sinful Pulse",
                  9: "Chapter 9: Girls' Night Frenzy",
                  10: "Chapter 10: Frenzy's Filthy Peak"
                };
                
                // Return the exact title for this chapter
                return chapterTitles[chapter.id] || `Chapter ${chapter.id}`;
              })()}
            </h2>
            {/* Descriptive text under chapter title: dark pink, body font, bold */}
            <p
              className={`text-sm md:text-base font-bold text-pink-700 ${pinkGlowClass} text-balance text-center`}
            >
              {(() => {
                // Define exact chapter titles mapping to find where descriptive text starts
                const chapterTitles: { [key: number]: string } = {
                  1: "Chapter One: Dawn's Molten Crave",
                  2: "Chapter Two: Counter's Wicked Heat",
                  3: "Chapter Three: Boutique's Naughty Spark", 
                  4: "Chapter Four: Café's Sinful Blaze",
                  5: "Chapter Five: Netflix's Daze",
                  6: "Chapter Six:  Filthy Pharmacy", // Note: extra space in original
                  7: "Chapter Seven: Fleeting Heat",
                  8: "Chapter Eight: Shower's Sinful Pulse",
                  9: "Chapter Nine: Girls' Night Frenzy",
                  10: "Chapter Ten: Frenzy's Filthy Peak"
                };
                
                // Fallback short descriptors if the original title has no trailing text
                const fallbackDescriptors: { [key: number]: string } = {
                  1: "The Tisza River burned pink under Szeged’s dawn",
                  2: "Heat builds beneath the counter’s wicked tease",
                  3: "Silk and lace catch a naughty spark",
                  4: "Steam and sugar swirl into sinful blaze",
                  5: "Netflix’s glow blurs into a hazy, daring daze",
                  6: "Neon aisles hum with filthy promise",
                  7: "Moments slip like warm breath on glass",
                  8: "Water drums against skin in a pulsing rhythm",
                  9: "Girls’ night winds into electric frenzy",
                  10: "All paths converge toward a filthy peak"
                };

                const originalTitle = chapterTitles[chapter.id];
                if (originalTitle && chapter.title.startsWith(originalTitle)) {
                  // Extract everything after the original title
                  const extracted = chapter.title.substring(originalTitle.length).trim();
                  const finalText = extracted && extracted.length > 0 ? extracted : (fallbackDescriptors[chapter.id] || '');
                  return (finalText || '...') + '...';
                }
                
                // Fallback: try to find where descriptive text starts
                const titleEnd = chapter.title.indexOf(' The ');
                if (titleEnd > 0) {
                  return chapter.title.substring(titleEnd + 1) + '...';
                }
                
                // If nothing found, use fallback
                return (fallbackDescriptors[chapter.id] || '...') + '...';
              })()}
            </p>
          </div>
          <div className="space-y-3 text-[14px] md:text-[16px] leading-relaxed text-black font-medium">
            {chapter.content.split("\n\n").map((paragraph, index) => (
              <p key={index} className="text-pretty">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Single image preview under content; click to expand fullscreen */}
          {chapter.images && chapter.images.length > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="relative cursor-pointer" onClick={handlePreviewClick}>
                <Image
                  src={chapter.images[0]}
                  alt={`${chapter.title} preview`}
                  width={800}
                  height={500}
                  className="rounded-2xl shadow-2xl object-cover"
                  priority={chapter.id === 1}
                />
                {chapter.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white text-sm opacity-90">
                    1 / {chapter.images.length}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Optional chapter video at the bottom (mp4) */}
          {chapter.videoUrl && (
            <div className="mt-8 flex justify-center">
              <video
                src={chapter.videoUrl}
                controls
                playsInline
                className="rounded-2xl shadow-2xl w-full max-w-[900px]"
                poster={chapter.images?.[0]}
              />
            </div>
          )}
        </div>
      </div>
      {/* Fullscreen lightbox */}
      {isFullscreen && chapter.images && chapter.images.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xl" onClick={() => setIsFullscreen(false)} />
          <div className="relative z-10 max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <div className="relative cursor-pointer" onClick={handleFullscreenImageClick}>
              <Image
                src={chapter.images[currentImageIndex]}
                alt={`${chapter.title} - Image ${currentImageIndex + 1}`}
                width={1200}
                height={900}
                className="object-contain max-w-[95vw] max-h-[95vh] rounded-lg shadow-2xl"
                priority
              />
            </div>
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-8 right-8 p-3 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-200 backdrop-blur-sm"
            >
              ✕
            </button>
            {chapter.images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-sm opacity-90">
                {currentImageIndex + 1} / {chapter.images.length}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
