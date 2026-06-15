import { auth0 } from '@/lib/auth0'

// Genera /api/auth-medico/login · /callback · /logout · /me (SDK Auth0 v3).
// Namespace separado del admin (/api/auth/*) — ver lib/auth0.ts.
export const GET = auth0.handleAuth()
