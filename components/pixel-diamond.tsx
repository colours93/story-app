import React from "react"

type Palette = {
  border?: string
  fill?: string
  shade?: string
  highlight?: string
}

export function PixelDiamond({ size = 80, className = "", palette }: { size?: number; className?: string; palette?: Palette }) {
  const cols = 12
  const rows = 12
  const cell = Math.floor(size / cols)
  const startX = Math.floor((size - cols * cell) / 2)
  const startY = Math.floor((size - rows * cell) / 2)
  const grid: number[][] = [
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,0,1,2,2,1,0,0,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,1,2,2,2,2,2,2,1,0,0],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [1,2,2,2,2,2,2,2,2,2,2,1],
    [0,1,2,2,2,2,2,2,2,2,1,0],
    [0,0,1,2,2,2,2,2,2,1,0,0],
    [0,0,0,1,2,2,2,2,1,0,0,0],
    [0,0,0,0,1,2,2,1,0,0,0,0],
    [0,0,0,0,0,1,1,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0],
  ]
  const highlights = [
    { r: 2, c: 4 }, { r: 1, c: 5 }, { r: 3, c: 5 }
  ]
  const shades = [
    { r: 8, c: 7 }, { r: 9, c: 6 }, { r: 7, c: 8 }
  ]
  const colors = {
    border: palette?.border ?? "#000000",
    fill: palette?.fill ?? "#f9a8d4", // pink-300
    shade: palette?.shade ?? "#f472b6", // pink-400
    highlight: palette?.highlight ?? "#fce7f3", // pink-100
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