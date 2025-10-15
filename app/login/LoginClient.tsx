"use client"

import { useState, useEffect } from "react"
import { signIn, getSession, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Lock } from "lucide-react"
import { EyelashEye, EyelashEyeOff } from "@/components/eyelash-eye"
import { PixelHeartButton } from "@/components/pixel-heart-button"
import { PixelHeart } from "@/components/pixel-heart"
import PixelHeartsBg from "@/components/pixel-hearts-bg"
 

export default function LoginClient() {
  const { data: session, status } = useSession()
  const [usernameOrEmail, setUsernameOrEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const result = await signIn("credentials", {
        username: usernameOrEmail, // Can be either username or email
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid username/email or password")
      } else {
        // Check if sign in was successful
        const session = await getSession()
        if (session) {
          const role = session.user?.role
          const username = session.user?.name?.toLowerCase()
          const dest = role === 'admin' ? '/admin' : (username ? `/u/${username}` : '/story')
          router.push(dest)
          router.refresh()
        } else {
          setError("Login failed. Please try again.")
        }
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Removed photo gallery preload to match pixel theme.
  }, [])

  // Server-side login page already redirects authenticated users; avoid client-side redirects to prevent loops.

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-0">
      {/* Floating button removed per new flow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pink-100 via-pink-200 to-pink-300" />
      <div className="absolute inset-0 -z-10 backdrop-blur-[4px]" />
      {/* Gradient + animated pixel hearts backdrop */}
      <PixelHeartsBg />
      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-white/30 shadow-2xl bg-white/40 backdrop-blur-md">
          <CardHeader className="text-center pb-6">
            {/* Bambiland with one small heart on left and two on right */}
            <div className="text-5xl sm:text-6xl leading-tight font-bubble font-bold mb-1">
              <div className="flex items-center justify-center gap-2">
                <PixelHeart size={36} className="-translate-y-[6px]" />
                <span className="text-pink-400 drop-shadow-[0_0_8px_rgba(255,255,255,0.55)]">
                  Bambiland
                </span>
                <div className="flex items-center gap-1">
                  <PixelHeart size={40} className="-translate-y-[10px]" />
                  <PixelHeart size={24} className="-translate-y-[6px] rotate-[15deg]" />
                </div>
              </div>
            </div>
            <div className="text-sm font-bubble text-black mb-2">XoXo</div>
            
          </CardHeader>
          <CardContent className="px-8 pb-8">
            {/* Sign In with hearts beside the text */}
            <div className="flex items-center justify-center gap-3 mb-2">
              <PixelHeart size={40} />
              <div className="text-3xl font-bubble text-pink-600">Sign In</div>
              <PixelHeart size={40} />
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="font-bubble text-pink-700">
                  Username or Email
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-pink-300" />
                  <Input
                    id="usernameOrEmail"
                    type="text"
                    placeholder="@suchagoodgirlbambi"
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    className="pl-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="font-bubble text-pink-700">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-pink-300" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Shhh it's a secret..."
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={"pl-11 pr-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-pink-300 hover:text-pink-500 transition-colors"
                  >
                    {showPassword ? <EyelashEyeOff className="h-5 w-5" /> : <EyelashEye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-center">
                <PixelHeartButton
                  type="submit"
                  disabled={isLoading}
                  size={130}
                  label={isLoading ? "Signing in..." : "Sign In"}
                />
              </div>
            </form>
            {/* Tiny bottom link to sign up */}
            <div className="mt-3 text-center">
              <Link
                href="/signup"
                className="text-xs font-bubble text-pink-700 underline decoration-dotted hover:decoration-solid hover:text-pink-900"
              >
                Sign up?
              </Link>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  )
}