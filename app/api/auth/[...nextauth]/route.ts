import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        console.log('🔐 Authorization attempt:', { username: credentials?.username })
        
        if (!credentials?.username || !credentials?.password) {
          console.log('❌ Missing credentials')
          return null
        }

        try {
          // Guard: ensure Supabase admin client is available
          if (!supabaseAdmin || typeof (supabaseAdmin as any).from !== 'function') {
            console.error('⚠️ Supabase admin client not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
            return null
          }

          // Query user from Supabase by username or email
          console.log('🔍 Querying user from Supabase...')
          const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .or(`username.eq.${credentials.username},email.eq.${credentials.username}`)
            .single()

          console.log('📊 Supabase query result:', { 
            userFound: !!user, 
            error: error?.message,
            username: user?.username,
            email: user?.email,
            hasPasswordHash: !!user?.password_hash
          })

          if (error || !user) {
            console.log('❌ User not found or error:', error?.message)
            return null
          }

          // Verify password
          console.log('🔑 Comparing passwords...')
          const isValidPassword = await bcrypt.compare(
            credentials.password,
            user.password_hash
          )

          console.log('🔓 Password comparison result:', isValidPassword)

          if (!isValidPassword) {
            console.log('❌ Invalid password')
            return null
          }

          console.log('✅ Authentication successful')
          return {
            id: user.id,
            name: user.username,
            email: user.email,
            role: user.role,
          }
        } catch (error) {
          console.log('💥 Authorization error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.userId = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }: any) {
      if (token) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: '/login'
  },
  session: {
    strategy: 'jwt' as const
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    csrfToken: {
      name: 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }