"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn, getSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { MoreVertical } from "lucide-react"
import { Mail, Lock, User, CheckCircle } from "lucide-react"
import { EyelashEye, EyelashEyeOff } from "@/components/eyelash-eye"
 
import { PixelHeartButton } from "@/components/pixel-heart-button"
import PixelHeartsBg from "@/components/pixel-hearts-bg"
import { PixelHeart } from "@/components/pixel-heart"
 
import { useEffect } from "react"

export default function SignupPage() {
  // galleryImages imported from shared file
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)
 
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  useEffect(() => {
    // Removed photo gallery preload to match the pixel theme.
  }, [])

  const validateForm = () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("All fields are required")
      return false
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return false
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address")
      return false
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long")
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    setIsLoading(true)

    if (!validateForm()) {
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Auto sign in with provided credentials, then redirect by role
        setSuccess("Account created! Signing you in…")
        try {
          const result = await signIn("credentials", {
            username: formData.email, // login accepts username or email
            password: formData.password,
            redirect: false,
          })
          if (result?.error) {
            setSuccess("Account created. Please sign in.")
            router.push("/login")
          } else {
            const session = await getSession()
            if (session) {
              const role = session.user?.role
              const dest = role === 'admin' ? '/admin' : '/story'
              router.push(dest)
              router.refresh()
            } else {
              router.push("/login")
            }
          }
        } catch (e) {
          router.push("/login")
        }
      } else {
        setError(data.error || "Failed to create account")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] relative flex items-center justify-center p-0">
      {/* Floating button removed per new flow */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-pink-100 via-pink-200 to-pink-300" />
      <div className="absolute inset-0 -z-10 backdrop-blur-[4px]" />
      {/* Gradient + animated pixel hearts backdrop */}
      <PixelHeartsBg />
      <Card className="w-full max-w-md relative z-10 border border-white/30 shadow-2xl bg-white/40 backdrop-blur-md">
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
          {/* Title row like Sign In, but for Sign Up */}
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="text-3xl font-bubble text-pink-600">Sign Up</div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username" className="font-bubble text-pink-700">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-5 w-5 text-pink-400" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="@goodgirlbambi"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="font-bubble text-pink-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-pink-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mindlessfuckdoll@gmail.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-bubble text-pink-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-pink-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Shhh it's a secret..."
                  value={formData.password}
                  onChange={handleInputChange}
                  className={"pl-11 pr-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-pink-400 hover:text-pink-600 transition-colors"
                >
                  {showPassword ? <EyelashEyeOff className="h-5 w-5" /> : <EyelashEye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="font-bubble text-pink-700">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-pink-400" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Shhh it's a secret..."
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={"pl-11 pr-11 h-12 border-pink-200 focus:border-pink-400 focus:ring-pink-400 bg-white/60 backdrop-blur-sm text-pink-600 placeholder:text-pink-300"}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-pink-400 hover:text-pink-600 transition-colors"
                >
                  {showConfirmPassword ? <EyelashEyeOff className="h-5 w-5" /> : <EyelashEye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <div className="flex justify-center">
              <PixelHeartButton
                type="submit"
                disabled={isLoading}
                size={130}
                label={isLoading ? "Signing up..." : "Sign Up"}
              />
            </div>
          </form>
          {/* Tiny bottom link to sign in */}
          <div className="mt-3 text-center">
            <Link
              href="/login"
              className="text-xs font-bubble text-pink-700 underline decoration-dotted hover:decoration-solid hover:text-pink-900"
            >
              Sign in?
            </Link>
          </div>
          
        </CardContent>
      </Card>
    </div>
  )
}