import type { Session } from '@auth0/nextjs-auth0'
import { auth0 } from '@/lib/auth0'

// Genera /api/auth-medico/login · /callback · /logout · /me (SDK Auth0 v3).
// Namespace separado del admin (/api/auth/*) — ver lib/auth0.ts.

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// En cada login exitoso registramos una sesión del médico (06 §5bis). Si todavía
// no tiene perfil, el backend lo ignora. Nunca rompe el login (best-effort).
async function afterCallback(_req: unknown, session: Session): Promise<Session> {
  try {
    if (session?.accessToken) {
      await fetch(`${API_URL}/engagement/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.accessToken}` },
        body: JSON.stringify({}),
      })
    }
  } catch {
    // el registro de sesión nunca bloquea el login
  }
  return session
}

export const GET = auth0.handleAuth({
  callback: auth0.handleCallback({ afterCallback }),
})
