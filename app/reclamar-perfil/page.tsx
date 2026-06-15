import type { Metadata } from 'next'
import Link from 'next/link'
import { Stethoscope, AlertTriangle } from 'lucide-react'
import { auth0 } from '@/lib/auth0'
import ReclamarClient from './ReclamarClient'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reclamar mi perfil — Guía Médica',
  robots: { index: false, follow: false },
}

interface Props {
  searchParams: { token?: string }
}

export default async function ReclamarPerfilPage({ searchParams }: Props) {
  const token = searchParams.token
  const session = await auth0.getSession()

  if (!token) {
    return (
      <Shell>
        <AlertTriangle size={28} className="mx-auto text-amber-500 mb-3" strokeWidth={1.5} />
        <p className="font-semibold text-[var(--color-text-primary)]">Link incompleto</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          El link de invitación no es válido. Pide uno nuevo al equipo de Reporte Médico.
        </p>
      </Shell>
    )
  }

  // Sin sesión: pedir login y volver a esta página con el token
  if (!session) {
    const returnTo = `/reclamar-perfil?token=${encodeURIComponent(token)}`
    const loginUrl = `/api/auth-medico/login?returnTo=${encodeURIComponent(returnTo)}`
    return (
      <Shell>
        <p className="font-semibold text-[var(--color-text-primary)] mb-1">Reclama tu perfil</p>
        <p className="text-sm text-[var(--color-text-muted)] mb-5">
          Inicia sesión (con Google o email) para tomar control de tu perfil en la Guía Médica.
        </p>
        <Link
          href={loginUrl}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
        >
          Iniciar sesión y reclamar
        </Link>
      </Shell>
    )
  }

  return (
    <Shell>
      <ReclamarClient token={token} />
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary,#001450)] flex items-center justify-center mx-auto mb-5">
        <Stethoscope size={26} className="text-[var(--color-accent,#F0B414)]" strokeWidth={1.5} />
      </div>
      {children}
    </div>
  )
}
