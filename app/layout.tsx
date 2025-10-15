import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Playfair_Display, Coiny } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { Providers } from "@/components/providers"
import { TempNav } from "@/components/temp-nav"
import { Toaster } from "@/components/ui/toaster"
import PixelHeartsBg from "@/components/pixel-hearts-bg"

import "./globals.css"

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
})

const coiny = Coiny({
  subsets: ["latin"],
  variable: "--font-bubble",
  weight: "400",
  display: "swap",
})

export const metadata: Metadata = {
  title: "The Wanderer - An Immersive Story",
  description: "An immersive storytelling experience with cinematic visuals",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${playfair.variable} ${coiny.variable} antialiased`}>
        <Providers>
          <div className="relative min-h-screen">
            {/* Subtle animated pixel hearts background overlay */}
            <div className="opacity-[0.08]">
              <PixelHeartsBg />
            </div>
            <TempNav />
            <Suspense fallback={null}>
              {children}
              <Analytics />
            </Suspense>
            {/* Global toast notifications */}
            <Toaster />
          </div>
        </Providers>
      </body>
    </html>
  )
}
