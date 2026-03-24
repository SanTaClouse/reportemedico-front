import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import AdminFabButton from './AdminFabButton'

async function isAdmin(): Promise<boolean> {
  try {
    const token = cookies().get('rm_token')?.value
    if (!token) return false
    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    await jwtVerify(token, secret)
    return true
  } catch {
    return false
  }
}

export default async function AdminFab() {
  if (!(await isAdmin())) return null
  return <AdminFabButton />
}
