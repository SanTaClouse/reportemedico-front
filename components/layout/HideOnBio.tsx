'use client'

import { usePathname } from 'next/navigation'

/**
 * Oculta el chrome del sitio (Navbar / Footer / AdminFab) en la landing /bio
 * (link in bio). Mantiene el resto del sitio intacto — no refactoriza V1.
 * Acepta server components como children (Footer) por el patrón de composición.
 */
export default function HideOnBio({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/bio' || pathname?.startsWith('/bio/')) return null
  return <>{children}</>
}
