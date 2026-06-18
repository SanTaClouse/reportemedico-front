export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getDoctorAdmin } from '@/lib/api-guia'
import FusionarClient from './FusionarClient'

export default async function FusionarPage({
  searchParams,
}: {
  searchParams: { a?: string; b?: string }
}) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const { a, b } = searchParams

  if (!a || !b || a === b) {
    return (
      <div className="p-6 max-w-2xl">
        <Link
          href="/admin/guia-medica/medicos"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-primary mb-4"
        >
          <ArrowLeft size={13} /> Volver a médicos
        </Link>
        <p className="text-sm text-[var(--color-text-muted)]">
          Faltan los dos perfiles a fusionar. Entra a un médico, abre su panel de posibles duplicados y elige “Fusionar”.
        </p>
      </div>
    )
  }

  const [docA, docB] = await Promise.all([
    getDoctorAdmin(a, token).catch(() => null),
    getDoctorAdmin(b, token).catch(() => null),
  ])
  if (!docA || !docB) notFound()

  return <FusionarClient docA={docA} docB={docB} token={token} />
}
