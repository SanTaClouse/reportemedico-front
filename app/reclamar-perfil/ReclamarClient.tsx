'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'

export default function ReclamarClient({ token }: { token: string }) {
  const router = useRouter()
  const [claiming, setClaiming] = useState(false)
  const [done, setDone] = useState(false)

  const handleClaim = async () => {
    setClaiming(true)
    const toastId = toast.loading('Reclamando tu perfil...')
    try {
      const res = await fetch('/api/mi-cuenta/claim-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'No se pudo reclamar el perfil')
      setDone(true)
      toast.success('¡Perfil reclamado! Ya puedes gestionarlo.', { id: toastId })
      setTimeout(() => router.push('/mi-cuenta'), 1200)
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
      setClaiming(false)
    }
  }

  if (done) {
    return (
      <div>
        <Check size={32} className="mx-auto text-emerald-500 mb-3" />
        <p className="font-semibold text-[var(--color-text-primary)]">¡Listo!</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Te llevamos a tu cuenta...</p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-semibold text-[var(--color-text-primary)] mb-1">Reclama tu perfil</p>
      <p className="text-sm text-[var(--color-text-muted)] mb-5">
        Este link te asocia el perfil que el equipo de Reporte Médico creó para ti. Al reclamarlo
        vas a poder editarlo y enviar artículos desde tu cuenta.
      </p>
      <button
        onClick={handleClaim}
        disabled={claiming}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {claiming ? <Loader2 size={16} className="animate-spin" /> : null}
        Reclamar mi perfil
      </button>
    </div>
  )
}
