import { initAuth0 } from '@auth0/nextjs-auth0'

/**
 * Instancia de Auth0 SOLO para médicos (V2). Montada en /api/auth-medico/* para
 * no chocar con las rutas del admin en /api/auth/* (decisión doc 06 §2).
 *
 * `audience` global: cada login pide un access token para la API de NestJS,
 * que el backend valida con la estrategia 'auth0' (jwks-rsa).
 */
export const auth0 = initAuth0({
  routes: {
    login: '/api/auth-medico/login',
    callback: '/api/auth-medico/callback',
    postLogoutRedirect: '/',
  },
  authorizationParams: {
    audience: process.env.AUTH0_AUDIENCE,
    scope: 'openid profile email',
  },
})
