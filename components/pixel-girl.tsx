import React from "react"

type Palette = {
  border?: string
  hair?: string
  skin?: string
  dress?: string
  highlight?: string
}

export function PixelGirl({ size = 64, className = "", palette }: { size?: number; className?: string; palette?: Palette }) {
  const cols = 16
  const rows = 16
  const cell = Math.floor(size / cols)
  const startX = Math.floor((size - cols * cell) / 2)
  const startY = Math.floor((size - rows * cell) / 2)

  // 0 empty, 1 border, 2 skin, 3 dress, 4 hair, 5 highlight
  const g: number[][] = [
    [0,0,0,0,1,4,4,5,5,4,4,1,0,0,0,0],
    [0,0,0,1,4,4,4,4,4,4,4,4,1,0,0,0],
    [0,0,1,4,4,4,2,2,2,2,4,4,4,1,0,0],
    [0,1,4,4,4,2,2,5,2,2,2,4,4,4,1,0],
    [0,1,4,4,2,2,2,2,2,2,2,2,4,4,1,0],
    [0,1,1,1,1,1,2,2,2,2,1,1,1,1,1,0],
    [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
    [0,0,0,3,3,3,3,3,3,3,3,3,3,0,0,0],
    [0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0],
    [0,0,0,0,3,3,3,3,3,3,3,3,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ]

  const colors = {
    border: palette?.border ?? "#000000",
    hair: palette?.hair ?? "#ec4899", // pink-500
    skin: palette?.skin ?? "#fde2e4", // soft peach
    dress: palette?.dress ?? "#f472b6", // pink-400
    highlight: palette?.highlight ?? "#fecdd3", // pink-200
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className} aria-hidden>
      <rect x={0} y={0} width={size} height={size} fill="transparent" />
      {g.map((row, r) => (
        row.map((val, c) => {
          if (val === 0) return null
          const x = startX + c * cell
          const y = startY + r * cell
          let fill = colors.dress
          if (val === 1) fill = colors.border
          if (val === 2) fill = colors.skin
          if (val === 3) fill = colors.dress
          if (val === 4) fill = colors.hair
          if (val === 5) fill = colors.highlight
          return <rect key={`${r}-${c}`} x={x} y={y} width={cell} height={cell} fill={fill} />
        })
      ))}
    </svg>
  )
}