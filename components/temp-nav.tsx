"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { PixelHeartButton } from "@/components/pixel-heart-button"
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
  // Hide nav items on auth pages
  const shouldHideNavItems = isAuthPage
  const navItems = shouldHideNavItems ? [] : (session?.user?.role === 'admin' ? adminNavItems : publicNavItems)

  return (
    <nav className={`bg-pink-400 border-b border-pink-500 shadow-sm font-bubble`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-center justify-between h-20`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link href="/" className={`text-3xl font-bold text-pink-300 hover:text-pink-600 transition-colors`}>
                <span className="font-bubble">Bambiland</span>
              </Link>
            </div>
            {/* Navigation links */}
            <div className="hidden md:block">
              <div className="ml-6 lg:ml-10 flex items-center space-x-2 lg:space-x-4">
                {navItems.map((item) => {
                  const baseClasses = `px-3 py-2 rounded-md text-lg font-medium font-bubble transition-colors`
                  const activeClasses = pathname === item.href ? `bg-pink-500 text-white` : `text-white hover:text-pink-100 hover:bg-pink-500`
                  const isAdminMedia = session?.user?.role === 'admin' && item.href === '/admin/media'

                  if (isAdminMedia) {
                    return (
                      <DropdownMenu key="admin-media-dropdown">
                        <DropdownMenuTrigger asChild>
                          <button className={`${baseClasses} ${activeClasses}`}>
                            Media
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

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`${baseClasses} ${activeClasses}`}
                    >
                      {item.label}
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
                        size={56}
                        label="Menu"
                        shadow={false}
                        palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
                        hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
                        activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
                      />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2 bg-pink-50">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium text-sm text-pink-900">
                          {session.user?.name || session.user?.email}
                        </p>
                        {session.user?.email && (
                          <p className="text-xs text-pink-600">
                            {session.user.email}
                          </p>
                        )}
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {username && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href={`/u/${username}`} className="flex items-center">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>View Profile</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/u/${username}?edit=bio`} className="flex items-center">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Edit Bio</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    {session.user?.role === 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center">
                            <Shield className="mr-2 h-4 w-4" />
                            <span>Admin Panel</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/settings" className="flex items-center">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50"
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
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <Link href="/login" className="block">
                  <PixelHeartButton
                    size={56}
                    label="Sign In"
                    shadow={false}
                    selected={Boolean(isLogin)}
                    palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
                    hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
                    activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
                  />
                </Link>
                <Link href="/signup" className="block">
                  <PixelHeartButton
                    size={56}
                    label="Sign Up"
                    shadow={false}
                    selected={Boolean(isSignup)}
                    palette={{ border: "#000000", fill: "#f9a8d4", shade: "#f472b6", highlight: "#fce7f3" }}
                    hoverPalette={{ border: "#000000", fill: "#db2777", shade: "#be185d", highlight: "#f9a8d4" }}
                    activePalette={{ border: "#000000", fill: "#be185d", shade: "#9d174d", highlight: "#db2777" }}
                  />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navItems.map((item) => {
              const baseClasses = `block px-3 py-2 rounded-md text-lg font-medium font-bubble transition-colors`
              const activeClasses = pathname === item.href ? `bg-pink-500 text-white` : `text-white hover:text-pink-100 hover:bg-pink-500`
              const isAdminMedia = session?.user?.role === 'admin' && item.href === '/admin/media'

              if (isAdminMedia) {
                return (
                  <DropdownMenu key="admin-media-dropdown-mobile">
                    <DropdownMenuTrigger asChild>
                      <button className={`${baseClasses} ${activeClasses}`}>
                        Media
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

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${baseClasses} ${activeClasses}`}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}