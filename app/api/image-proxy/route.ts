import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return new NextResponse('Missing url parameter', { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return new NextResponse('Invalid URL', { status: 400 })
  }

  // Solo permitir imágenes de Issuu
  if (parsed.hostname !== 'image.isu.pub') {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const response = await fetch(url, {
      headers: {
        Referer: 'https://issuu.com',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    })

    if (!response.ok) {
      return new NextResponse(`Issuu responded with ${response.status}`, {
        status: response.status,
      })
    }

    const contentType = response.headers.get('content-type') ?? 'image/jpeg'
    const buffer = await response.arrayBuffer()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, immutable', // 7 días
      },
    })
  } catch {
    return new NextResponse('Failed to fetch image', { status: 502 })
  }
}
