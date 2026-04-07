import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const token = cookies().get('rm_token')?.value
    if (!token) return NextResponse.json({ isAdmin: false })

    const secret = new TextEncoder().encode(process.env.JWT_SECRET)
    const { payload } = await jwtVerify(token, secret)

    return NextResponse.json({ isAdmin: payload.role === 'ADMIN' })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
