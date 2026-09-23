'use client'

import { usePathname } from 'next/navigation'

/**
 * Oculta el chrome del sitio (Navbar / Footer / AdminFab) en las pantallas que
 * funcionan como app de pantalla completa. Mantiene el resto del sitio intacto
 * — no refactoriza V1. Acepta server components como children (Footer) por el
 * patrón de composición.
 *  - /bio: landing "link in bio"
 *  - /acceso: escáner de la puerta y vista en vivo del evento (docs/v2/11)
 *  - /eventos/<slug>/entrada/<token>: el pase con QR que se muestra en la puerta
 */
export default function HideOnBio({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  if (pathname === '/bio' || pathname?.startsWith('/bio/')) return null
  if (pathname === '/acceso' || pathname?.startsWith('/acceso/')) return null
  if (pathname?.startsWith('/eventos/') && pathname.includes('/entrada/')) return null
  return <>{children}</>
}
