'use client'

import { useEffect } from 'react'

/**
 * Muestra la advertencia nativa del navegador al cerrar la pestaña, recargar o
 * salir con cambios sin guardar. `when` debe ser true solo si hay cambios.
 */
export function useUnsavedGuard(when: boolean) {
  useEffect(() => {
    if (!when) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = '' // requerido por algunos navegadores para disparar el prompt
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [when])
}
