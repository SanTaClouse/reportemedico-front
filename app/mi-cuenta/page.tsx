import Link from 'next/link'
import { BadgeCheck, AlertTriangle, LogOut } from 'lucide-react'
import { auth0 } from '@/lib/auth0'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * Área del médico — milestone de F5: confirma login Auth0 end-to-end y que el
 * backend valida el access token. El perfil/wizard se construye sobre esto.
 */
export default async function MiCuentaPage() {
  const session = await auth0.getSession()
  const user = session?.user

  // Ping autenticado al backend con el access token (prueba la validación 'auth0')
  let backend: { ok: boolean; detail: string } = { ok: false, detail: 'sin verificar' }
  try {
    const { accessToken } = await auth0.getAccessToken()
    const res = await fetch(`${API_URL}/doctor-auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const data = await res.json()
      backend = { ok: true, detail: `sub ${String(data.sub).slice(0, 18)}…` }
    } else {
      backend = { ok: false, detail: `el backend respondió ${res.status}` }
    }
  } catch (e) {
    backend = { ok: false, detail: (e as Error).message }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)]">Mi cuenta</h1>
        <a
          href="/api/auth-medico/logout"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
        >
          <LogOut size={15} /> Cerrar sesión
        </a>
      </div>

      <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-6 flex items-center gap-4">
        {user?.picture ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.picture} alt={user?.name ?? 'Médico'} className="w-14 h-14 rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary,#001450)] flex items-center justify-center text-white font-display font-bold text-lg">
            {(user?.name?.[0] ?? user?.email?.[0] ?? 'M').toUpperCase()}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-[var(--color-text-primary)]">{user?.name ?? 'Médico'}</p>
          <p className="text-sm text-[var(--color-text-muted)] truncate">{user?.email}</p>
          {user?.email_verified ? (
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 mt-1">
              <BadgeCheck size={13} /> Email verificado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 mt-1">
              <AlertTriangle size={13} /> Email sin verificar
            </span>
          )}
        </div>
      </div>

      {/* Diagnóstico del milestone — provisional, se reemplaza por el perfil */}
      <div
        className={`mt-4 rounded-xl border p-4 text-sm ${
          backend.ok
            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
            : 'border-amber-200 bg-amber-50 text-amber-800'
        }`}
      >
        {backend.ok ? (
          <>✅ Login y validación de token correctos — el backend te reconoce ({backend.detail}).</>
        ) : (
          <>⚠️ El login funciona, pero el backend aún no valida el token: {backend.detail}.</>
        )}
      </div>

      <p className="text-sm text-[var(--color-text-muted)] mt-6">
        Próximamente aquí vas a completar tu perfil profesional y enviar artículos sin recargar tus datos.{' '}
        <Link href="/registro-medicos" className="text-[var(--color-primary)] hover:underline">
          Ver beneficios
        </Link>
      </p>
    </div>
  )
}
