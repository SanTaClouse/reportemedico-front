import type { Metadata } from 'next'
import BajaClient from './BajaClient'

export const metadata: Metadata = {
  title: 'Baja del newsletter — Reporte Médico',
  robots: { index: false, follow: false },
}

export default function NewsletterBajaPage({
  searchParams,
}: {
  searchParams: { s?: string; t?: string }
}) {
  return <BajaClient s={searchParams.s ?? ''} t={searchParams.t ?? ''} />
}
