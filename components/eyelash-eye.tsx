import React from 'react'

interface IconProps {
  className?: string
}

export function EyelashEye({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
    >
      {/* Eye outline */}
      <path d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5z" />
      {/* Iris */}
      <circle cx="12" cy="12" r="3" />
      {/* Lashes */}
      <path d="M6 7.5l-1.2-2M9 6.5L8.2 4.5M12 6.2V4M15 6.5l.8-2M18 7.5l1.2-2" />
    </svg>
  )
}

export function EyelashEyeOff({ className }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className={className}
    >
      {/* Eye outline (closed) */}
      <path d="M2 12s3.5-5 10-5 10 5 10 5-3.5 5-10 5-10-5-10-5z" />
      {/* Eyelid line */}
      <path d="M4 12c2-1.6 4.7-2.7 8-2.7 3.3 0 6 1.1 8 2.7" />
      {/* Lashes */}
      <path d="M6 7.5l-1.2-2M9 6.5L8.2 4.5M12 6.2V4M15 6.5l.8-2M18 7.5l1.2-2" />
      {/* Strike-through to indicate hidden */}
      <path d="M4 20L20 4" />
    </svg>
  )
}