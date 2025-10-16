import React, { useMemo } from "react"
import { PixelHeart } from "@/components/pixel-heart"

type Props = {
  density?: "low" | "medium" | "high"
  count?: number
  minSize?: number
  maxSize?: number
  opacity?: number
  className?: string
}

// A small, self-contained floating hearts overlay that stays inside its parent.
// Usage: wrap the target card with `relative overflow-hidden` and place this as a child.
export default function CardHeartsOverlay({
  density = "medium",
  count,
  minSize = 22,
  maxSize = 42,
  opacity = 0.55,
  className = "",
}: Props) {
  const n = count ?? (density === "low" ? 6 : density === "high" ? 16 : 10)
  const hearts = useMemo(() => {
    const arr: { top: string; left: string; size: number; speed: string }[] = []
    for (let i = 0; i < n; i++) {
      const size = Math.floor(minSize + Math.random() * Math.max(1, maxSize - minSize))
      const topPct = Math.floor(8 + Math.random() * 84)
      const leftPct = Math.floor(8 + Math.random() * 84)
      const r = Math.random()
      const speed = r < 0.33 ? "heart-float-fast" : r < 0.66 ? "heart-float-slow" : ""
      arr.push({ top: `${topPct}%`, left: `${leftPct}%`, size, speed })
    }
    return arr
  }, [n, minSize, maxSize])

  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      {hearts.map((h, i) => (
        <div key={i} className="absolute" style={{ top: h.top, left: h.left, opacity }}>
          <div className={`heart-float-diagonal ${h.speed}`}>
            <PixelHeart size={h.size} />
          </div>
        </div>
      ))}
    </div>
  )
}