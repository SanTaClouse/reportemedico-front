export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { getDoctorAdmin, getSpecialties, getClinics, getInsurances } from '@/lib/api-guia'
import MedicoDetalleClient from './MedicoDetalleClient'

export default async function MedicoDetallePage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [doctor, specialties, clinics, insurances] = await Promise.all([
    getDoctorAdmin(params.id, token).catch(() => null),
    getSpecialties().catch(() => []),
    getClinics().catch(() => []),
    getInsurances().catch(() => []),
  ])

  if (!doctor) notFound()

  return (
    <MedicoDetalleClient
      initialDoctor={doctor}
      specialties={specialties}
      clinics={clinics}
      insurances={insurances}
      token={token}
    />
  )
}
