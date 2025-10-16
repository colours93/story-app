"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { PixelHeartButton } from "@/components/pixel-heart-button"
import { PixelHeart } from "@/components/pixel-heart"
import { PixelDiamond } from "@/components/pixel-diamond"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Heart, Settings, LogOut, Shield } from "lucide-react"

export function TempNav() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const router = useRouter()
  const username = session?.user?.name?.toLowerCase() || null
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/signup')

  // Hide the entire navbar on the landing page
  // Also hide on auth pages (login/signup)
  if (pathname === '/' || isAuthPage) {
    return null
  }

  // Admin users see full navigation, regular users see minimal navigation
  const adminNavItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/media", label: "Media" },
  ]

  const publicNavItems: Array<{ href: string; label: string }> = [
    { href: "/content", label: "Content" },
    { href: "/membership", label: "Membership" },
  ]

  const isLogin = pathname?.startsWith('/login')
  const isSignup = pathname?.startsWith('/signup')
  const isProfilePage = pathname?.startsWith('/u/')
  // Hide nav items on auth pages and on content/membership pages (remove the two pixel buttons there)
  const isContentPage = pathname?.startsWith('/content')
  const isMembershipPage = pathname?.startsWith('/membership')
  const shouldHideNavItems = isAuthPage || isContentPage || isMembershipPage
  const navItems = shouldHideNavItems ? [] : (
    session?.user?.role === 'admin' ? adminNavItems : (isProfilePage ? [] : publicNavItems)
  )

  return (
    <nav className={`sticky top-0 z-40 bg-white/70 backdrop-blur-md border-b border-pink-200 shadow-sm font-bubble`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-14`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className={`text-2xl font-bold text-pink-500 hover:text-pink-600 transition-colors`}>
                <span className="font-bubble">Bambiland</span>
              </Link>
            </div>
            {/* Navigation links */}
            <div className="hidden md:block">
              <div className="ml-4 lg:ml-8 flex items-center space-x-2 lg:space-x-3">
                {navItems.map((item) => {
                  const baseClasses = `relative inline-flex items-center px-4 py-2 rounded-none text-sm font-medium font-bubble border-2 border-[#7a1747] bg-white text-black shadow-[3px_3px_0_0_#7a1747]`
                  const activeClasses = pathname === item.href ? `bg-pink-300` : `bg-pink-200`
                  const isAdminMedia = session?.user?.role === 'admin' && item.href === '/admin/media'
                  const isIconOnly = session?.user?.role !== 'admin' && (item.href === '/content' || item.href === '/membership')

                  if (isAdminMedia) {
                    return (
                      <DropdownMenu key="admin-media-dropdown">
                        <DropdownMenuTrigger asChild>
                          <button className={`${baseClasses} ${activeClasses}`}>
                            Media
                            <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                            <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                            <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                            <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-56" forceMount>
                          <DropdownMenuItem asChild>
                            <Link href="/membership">
                              <span>Member tiers</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/admin/media">
                              <span>Create content</span>
                            </Link>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )
                  }

                  if (isIconOnly) {
                    const iconClasses = `relative inline-flex items-center justify-center w-10 h-10 rounded-none font-bubble border-2 border-[#7a1747] text-black shadow-[3px_3px_0_0_#7a1747] ${activeClasses}`
                    const isMembership = item.href === '/membership'
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={iconClasses}
                        aria-label={isMembership ? 'Membership' : 'Content'}
                        title={isMembership ? 'Membership' : 'Content'}
                      >
                        {isMembership ? (
                          <PixelHeart size={20} palette={{ border: '#7a1747', fill: '#f9a8d4', shade: '#f472b6', highlight: '#fce7f3' }} />
                        ) : (
                          <PixelDiamond size={20} palette={{ border: '#7a1747', fill: '#f9a8d4', shade: '#f472b6', highlight: '#fce7f3' }} />
                        )}
                        <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                      </Link>
                    )
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${baseClasses} ${activeClasses}`}
                    >
                      {item.label}
                      <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right side - User menu or Login */}
          <div className="flex items-center gap-3">
            {status === 'loading' ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : session ? (
              <>
                {/* Consolidated pixel menu button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div>
                      <PixelHeartButton
                        size={48}
                        label="!"
                        shadow={false}
                        palette={{ border: "#7a1747", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
                        hoverPalette={{ border: "#7a1747", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
                        activePalette={{ border: "#7a1747", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-52 p-0 overflow-hidden" align="end" forceMount>
                    {/* Glitch/static style header matching Free tier */}
                    <div className="relative p-2.5 bg-pink-50">
                      {/* RGB split border effect */}
                      <div aria-hidden className="absolute inset-0 border-2 border-pink-400 opacity-70" />
                      <div aria-hidden className="absolute inset-0 border-2 border-cyan-400 opacity-40 translate-x-[2px]" />
                      <div aria-hidden className="absolute inset-0 border-2 border-red-400 opacity-40 -translate-x-[2px]" />
                      
                      {/* Scattered pixel noise on edges */}
                      <span aria-hidden className="absolute top-1 left-1 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute top-2 left-4 w-1 h-1 bg-pink-500" />
                      <span aria-hidden className="absolute top-1 right-3 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute bottom-1 left-2 w-1 h-1 bg-pink-600" />
                      <span aria-hidden className="absolute bottom-1 right-1 w-1 h-1 bg-pink-500" />
                      
                      {/* Glitch accent bars */}
                      <span aria-hidden className="absolute top-4 left-0 w-8 h-[2px] bg-gradient-to-r from-pink-500 to-transparent opacity-60" />
                      <span aria-hidden className="absolute bottom-6 right-0 w-10 h-[2px] bg-gradient-to-l from-pink-500 to-transparent opacity-60" />
                      
                      <div className="relative z-10 flex flex-col space-y-0.5 leading-none">
                        <p className="font-bold text-xs text-black font-bubble">
                          {session.user?.name || session.user?.email}
                        </p>
                        {session.user?.email && (
                          <p className="text-[11px] text-pink-800 font-bubble">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="py-0.5">
                      {username && (
                        <>
                          <DropdownMenuItem asChild className="px-3 py-1.5 font-bubble text-sm hover:bg-pink-50 cursor-pointer">
                            <Link href={`/u/${username}`} className="flex items-center">
                              <Heart className="mr-2 h-[14px] w-[14px]" />
                              <span>View Profile</span>
                            </Link>
                          </DropdownMenuItem>
                          <div className="h-px bg-pink-200 my-0.5" />
                        </>
                      )}
                      {/* Membership tiers available to all signed-in users */}
                      <DropdownMenuItem asChild className="px-3 py-1.5 font-bubble text-sm hover:bg-pink-50 cursor-pointer">
                        <Link href="/membership" className="flex items-center">
                          <Heart className="mr-2 h-[14px] w-[14px]" />
                          <span>Membership Tiers</span>
                        </Link>
                      </DropdownMenuItem>
                      {session.user?.role === 'admin' && (
                        <>
                          <DropdownMenuItem asChild className="px-3 py-1.5 font-bubble text-sm hover:bg-pink-50 cursor-pointer">
                            <Link href="/admin" className="flex items-center">
                              <Shield className="mr-2 h-[14px] w-[14px]" />
                              <span>Admin Panel</span>
                            </Link>
                          </DropdownMenuItem>
                          <div className="h-px bg-pink-200 my-0.5" />
                        </>
                      )}
                      <DropdownMenuItem asChild className="px-3 py-1.5 font-bubble text-sm hover:bg-pink-50 cursor-pointer">
                        <Link href="/settings" className="flex items-center">
                          <Settings className="mr-2 h-[14px] w-[14px]" />
                          <span>Settings</span>
                        </Link>
                      </DropdownMenuItem>
                      <div className="h-px bg-pink-200 my-0.5" />
                      <DropdownMenuItem
                        className="px-3 py-1.5 font-bubble text-sm cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                        onSelect={async () => {
                          const origin = typeof window !== 'undefined' ? window.location.origin : ''
                          try {
                            await signOut({ redirect: false })
                          } finally {
                            const dest = origin ? `${origin}/` : '/'
                            try { router.replace(dest) } catch {}
                            if (typeof window !== 'undefined') {
                              window.location.assign(dest)
                            }
                          }
                        }}
                      >
                        <LogOut className="mr-2 h-[14px] w-[14px]" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login" className="block">
                  <button className={`relative px-3 py-1.5 border-2 border-[#7a1747] font-bubble text-sm font-bold transition-colors ${isLogin ? 'bg-pink-300 text-black' : 'bg-pink-100 text-black hover:bg-pink-200 active:bg-pink-300'}`}>
                    <span aria-hidden className="absolute top-0 left-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute top-0 right-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute bottom-0 left-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute bottom-0 right-0 w-1 h-1 bg-[#7a1747]" />
                    <span className="relative z-10">Sign In</span>
                  </button>
                </Link>
                <Link href="/signup" className="block">
                  <button className={`relative px-3 py-1.5 border-2 border-[#7a1747] font-bubble text-sm font-bold transition-colors ${isSignup ? 'bg-pink-300 text-black' : 'bg-pink-100 text-black hover:bg-pink-200 active:bg-pink-300'}`}>
                    <span aria-hidden className="absolute top-0 left-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute top-0 right-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute bottom-0 left-0 w-1 h-1 bg-[#7a1747]" />
                    <span aria-hidden className="absolute bottom-0 right-0 w-1 h-1 bg-[#7a1747]" />
                    <span className="relative z-10">Sign Up</span>
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const baseClasses = `relative block px-4 py-2 rounded-none text-sm font-medium font-bubble border-2 border-[#7a1747] bg-white text-black shadow-[3px_3px_0_0_#7a1747]`
              const activeClasses = pathname === item.href ? `bg-pink-300` : `bg-pink-200`
              const isAdminMedia = session?.user?.role === 'admin' && item.href === '/admin/media'
              const isIconOnly = session?.user?.role !== 'admin' && (item.href === '/content' || item.href === '/membership')

              if (isAdminMedia) {
                return (
                  <DropdownMenu key="admin-media-dropdown-mobile">
                    <DropdownMenuTrigger asChild>
                      <button className={`${baseClasses} ${activeClasses}`}>
                        Media
                        <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                        <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56" forceMount>
                      <DropdownMenuItem asChild>
                        <Link href="/membership">
                          <span>Member tiers</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/admin/media">
                          <span>Create content</span>
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )
              }

              if (isIconOnly) {
                const iconClasses = `relative inline-flex items-center justify-center w-10 h-10 rounded-none font-bubble border-2 border-[#7a1747] text-black shadow-[3px_3px_0_0_#7a1747] ${activeClasses}`
                const isMembership = item.href === '/membership'
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={iconClasses}
                    aria-label={isMembership ? 'Membership' : 'Content'}
                    title={isMembership ? 'Membership' : 'Content'}
                  >
                    {isMembership ? (
                      <PixelHeart size={20} palette={{ border: '#7a1747', fill: '#f9a8d4', shade: '#f472b6', highlight: '#fce7f3' }} />
                    ) : (
                      <PixelDiamond size={20} palette={{ border: '#7a1747', fill: '#f9a8d4', shade: '#f472b6', highlight: '#fce7f3' }} />
                    )}
                    <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                    <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                    <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                    <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${baseClasses} ${activeClasses}`}
                    >
                      {item.label}
                      <span aria-hidden className="absolute -top-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -top-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -bottom-1 -left-1 w-2 h-2 bg-[#7a1747]" />
                      <span aria-hidden className="absolute -bottom-1 -right-1 w-2 h-2 bg-[#7a1747]" />
                    </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}