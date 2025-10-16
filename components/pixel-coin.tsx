import React from "react"

type Palette = {
  border?: string
  fill?: string
  shade?: string
  highlight?: string
}

// Pixelated coin with subtle highlight and a simple $ mark
export function PixelCoin({ size = 80, className = "", palette }: { size?: number; className?: string; palette?: Palette }) {
  const cols = 12
  const rows = 12
  const cell = Math.floor(size / cols)
  const startX = Math.floor((size - cols * cell) / 2)
  const startY = Math.floor((size - rows * cell) / 2)
  const cx = (cols - 1) / 2
  const cy = (rows - 1) / 2
  const radius = 4.5

  const colors = {
    border: palette?.border ?? "#000000",
    fill: palette?.fill ?? "#fde68a", // amber-300
    shade: palette?.shade ?? "#f59e0b", // amber-500
    highlight: palette?.highlight ?? "#fffbeb", // amber-50
  }

  // Coordinates for a simple pixel $ mark inside the coin
  const dollarPixels = new Set<string>()
  for (let r = 3; r <= 8; r++) dollarPixels.add(`${r}-6`) // vertical
  dollarPixels.add("4-5"); dollarPixels.add("4-7") // top bars
  dollarPixels.add("7-5"); dollarPixels.add("7-7") // bottom bars

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <rect x={0} y={0} width={size} height={size} fill="transparent" />
      {Array.from({ length: rows }).map((_, r) => (
        Array.from({ length: cols }).map((__, c) => {
          const dx = c - cx
          const dy = r - cy
          const dist = Math.sqrt(dx * dx + dy * dy)
          let val = 0
          if (dist <= radius) {
            val = 2 // interior fill
          }
          if (dist > radius - 0.6 && dist <= radius + 0.4) {
            val = 1 // border ring
          }
          if (val === 0) return null

          let fill = colors.fill
          if (val === 1) fill = colors.border

          // Highlight top-right interior, shade bottom-left interior
          const isInterior = val === 2
          if (isInterior && r <= cy - 1 && c >= cx + 1) fill = colors.highlight
          if (isInterior && r >= cy + 1 && c <= cx - 1) fill = colors.shade

          const key = `${r}-${c}`
          if (dollarPixels.has(key)) fill = colors.border

          const x = startX + c * cell
          const y = startY + r * cell
          return <rect key={key} x={x} y={y} width={cell} height={cell} fill={fill} />
        })
      ))}
    </svg>
  )
}