import type { Metadata, Viewport } from 'next'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: 'Control de acceso — Reporte Médico',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#001450',
}

/** App de pantalla completa para la puerta del evento (sin Navbar/Footer, ver HideOnBio) */
export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-950 text-white">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  )
}
