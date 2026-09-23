import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'
import { getSession } from '@auth0/nextjs-auth0/edge'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Área del médico (V2): sesión de Auth0, rama independiente del admin ──
  if (pathname.startsWith('/mi-cuenta')) {
    const res = NextResponse.next()
    const session = await getSession(request, res)
    if (!session) {
      const loginUrl = new URL('/api/auth-medico/login', request.url)
      loginUrl.searchParams.set('returnTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return res
  }

  // ── Escáner del evento (docs/v2/11): ADMIN o personal de puerta (SCANNER) ──
  if (pathname.startsWith('/acceso')) {
    const role = await tokenRole(request.cookies.get('rm_token')?.value)
    if (role !== 'ADMIN' && role !== 'SCANNER') {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    return NextResponse.next()
  }

  // ── Admin (V1): cookie rm_token validada con jose. No se toca. ──
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('rm_token')?.value

    // Permitir acceso a la página de login
    if (pathname === '/admin/login') {
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

      // El personal de puerta entra con el mismo login pero solo ve el escáner
      if (payload.role === 'SCANNER') {
        return NextResponse.redirect(new URL('/acceso', request.url))
      }
      if (payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return NextResponse.next()
}

async function tokenRole(token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))
    return typeof payload.role === 'string' ? payload.role : null
  } catch {
    return null
  }
}

export const config = {
  matcher: ['/admin/:path*', '/mi-cuenta/:path*', '/acceso/:path*', '/acceso'],
}
