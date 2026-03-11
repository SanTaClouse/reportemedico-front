import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('rm_token')?.value

  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Permitir acceso a la página de login
    if (request.nextUrl.pathname === '/admin/login') {
      if (token) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      }
      return NextResponse.next()
    }

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET)
      const { payload } = await jwtVerify(token, secret)

      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}
