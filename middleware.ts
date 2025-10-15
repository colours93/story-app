import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Admin routes protection
    if (pathname.startsWith('/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    // API admin routes protection
    if (pathname.startsWith('/api/admin')) {
      if (!token || token.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Note: Story page is no longer blocked at middleware level.
    // Client-side guards on the Story page handle access and display.

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        
        // Allow public routes
        if (pathname === '/' || pathname === '/login' || pathname.startsWith('/api/auth')) {
          return true
        }

        // Require authentication for protected routes
        return !!token
      },
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    // Story routes are intentionally excluded to avoid redirect loops
  ]
}