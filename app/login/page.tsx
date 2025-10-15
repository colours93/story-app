import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import LoginClient from "./LoginClient"

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) {
    const role = (session.user as any)?.role
    const username = session.user?.name?.toLowerCase()
    const dest = role === 'admin' ? '/admin' : (username ? `/u/${username}` : '/story')
    redirect(dest)
  }

  return <LoginClient />
}