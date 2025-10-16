"use client"

import React, { useMemo, useState } from "react"
import { PixelHeart } from "@/components/pixel-heart"

type Heart = {
  id: number
  top: number // percent
  left: number // percent
  size: number
  popping: boolean
}

type Props = {
  count?: number
  minSize?: number
  maxSize?: number
  opacity?: number
  className?: string
}

// Clickable hearts overlay that lives inside a card. Only the hearts capture
// pointer events; the overlay itself does not block card interactions.
export default function CardHeartsInteractive({
  count = 6,
  minSize = 18,
  maxSize = 30,
  opacity = 0.6,
  className = "",
}: Props) {
  const initial: Heart[] = useMemo(() => {
    const arr: Heart[] = []
    for (let i = 0; i < count; i++) {
      const size = Math.floor(minSize + Math.random() * Math.max(1, maxSize - minSize))
      const top = Math.floor(10 + Math.random() * 80)
      const left = Math.floor(10 + Math.random() * 80)
      arr.push({ id: i + 1, top, left, size, popping: false })
    }
    return arr
  }, [count, minSize, maxSize])

  const [hearts, setHearts] = useState<Heart[]>(initial)

  const pop = (id: number) => {
    setHearts((prev) => prev.map((h) => (h.id === id ? { ...h, popping: true } : h)))
  }

  const handleEnd = (id: number) => {
    // After pop animation, reposition and reset
    setHearts((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h
        const top = Math.floor(10 + Math.random() * 80)
        const left = Math.floor(10 + Math.random() * 80)
        const size = Math.floor(minSize + Math.random() * Math.max(1, maxSize - minSize))
        return { ...h, top, left, size, popping: false }
      })
    )
  }

  return (
    <div aria-hidden className={`absolute inset-0 pointer-events-none ${className}`}>
      {hearts.map((h) => (
        <button
          key={h.id}
          type="button"
          className={`absolute transition-transform duration-300`}
          onClick={() => pop(h.id)}
          onAnimationEnd={() => handleEnd(h.id)}
          // Only hearts are clickable; rest of overlay remains pass-through
          // so underlying card content is still interactive.
          // eslint-disable-next-line react/forbid-dom-props
          style={{ top: `${h.top}%`, left: `${h.left}%`, opacity, pointerEvents: "auto" }}
        >
          <div className={h.popping ? "heart-pop" : ""}>
            <PixelHeart size={h.size} />
          </div>
        </button>
      ))}
    </div>
  )
}