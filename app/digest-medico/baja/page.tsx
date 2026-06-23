import type { Metadata } from 'next'
import BajaMedicoClient from './BajaMedicoClient'

export const metadata: Metadata = {
  title: 'Dejar de recibir novedades — Reporte Médico',
  robots: { index: false, follow: false },
}

export default function DigestMedicoBajaPage({
  searchParams,
}: {
  searchParams: { d?: string; t?: string }
}) {
  return <BajaMedicoClient d={searchParams.d ?? ''} t={searchParams.t ?? ''} />
}
