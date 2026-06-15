'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import DoctorForm from '@/components/admin/guia/DoctorForm'
import { createDoctor, type DoctorInput, type Specialty, type Clinic, type Insurance } from '@/lib/api-guia'

interface Props {
  specialties: Specialty[]
  clinics: Clinic[]
  insurances: Insurance[]
  token: string
}

export default function NuevoMedicoClient({ specialties, clinics, insurances, token }: Props) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (data: DoctorInput) => {
    setBusy(true)
    const toastId = toast.loading('Creando perfil...')
    try {
      const doctor = await createDoctor(data, token)
      toast.success(`Perfil de ${doctor.title ?? ''} ${doctor.firstName} ${doctor.lastName} creado`, { id: toastId })
      router.push(`/admin/guia-medica/medicos/${doctor.id}`)
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
      setBusy(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <Link
        href="/admin/guia-medica/medicos"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary mb-3"
      >
        <ArrowLeft size={13} /> Volver a médicos
      </Link>
      <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)] mb-1">Nuevo médico</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        El perfil se crea como <strong>borrador</strong>. Desde su ficha lo publicas, le activas el plan y generas el link de invitación para que el médico reclame su cuenta.
      </p>
      <DoctorForm
        specialties={specialties}
        clinics={clinics}
        insurances={insurances}
        submitLabel="Crear perfil"
        busy={busy}
        token={token}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
