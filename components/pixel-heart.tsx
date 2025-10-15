import React from "react"

type Palette = {
  border?: string
  fill?: string
  shade?: string
  highlight?: string
}

export function PixelHeart({ size = 80, className = "", palette }: { size?: number; className?: string; palette?: Palette }) {
  const cols = 16
  const rows = 12
  const cell = Math.floor(size / cols)
  const startX = Math.floor((size - cols * cell) / 2)
  const startY = Math.floor((size - rows * cell) / 2)
  const grid: number[][] = [
    [0,0,1,1,2,2,0,0,0,0,2,2,1,1,0,0],
    [0,1,2,2,2,2,1,0,0,1,2,2,2,2,1,0],
    [1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,2,2,2,2,2,2,2,2,2,2,1,0,0],
    [0,0,0,1,2,2,2,2,2,2,2,2,1,0,0,0],
    [0,0,0,0,1,2,2,2,2,2,2,1,0,0,0,0],
    [0,0,0,0,0,1,2,2,2,2,1,0,0,0,0,0],
    [0,0,0,0,0,0,1,2,2,1,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,1,2,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0],
  ]
  const highlights = [
    { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 2, c: 4 },
  ]
  const shades = [
    { r: 1, c: 11 }, { r: 2, c: 12 }, { r: 3, c: 12 }, { r: 4, c: 12 },
    { r: 5, c: 11 }, { r: 6, c: 10 },
  ]
  const colors = {
    border: palette?.border ?? "#000000",
    fill: palette?.fill ?? "#f472b6", // pink-400
    shade: palette?.shade ?? "#db2777", // pink-600
    highlight: palette?.highlight ?? "#fecdd3", // pink-200
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <rect x={0} y={0} width={size} height={size} fill="transparent" />
      {grid.map((row, r) => (
        row.map((val, c) => {
          if (val === 0) return null
          const x = startX + c * cell
          const y = startY + r * cell
          let fill = colors.fill
          if (val === 1) fill = colors.border
          if (val === 3) fill = colors.shade
          if (val === 4) fill = colors.highlight
          const isHighlight = highlights.some(h => h.r === r && h.c === c)
          const isShade = shades.some(s => s.r === r && s.c === c)
          if (isHighlight) fill = colors.highlight
          if (isShade) fill = colors.shade
          return <rect key={`${r}-${c}`} x={x} y={y} width={cell} height={cell} fill={fill} />
        })
      ))}
    </svg>
  )
}