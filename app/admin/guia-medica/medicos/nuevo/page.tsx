export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getSpecialties, getClinics, getCities, getInsurances } from '@/lib/api-guia'
import NuevoMedicoClient from './NuevoMedicoClient'

export default async function NuevoMedicoPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [specialties, clinics, cities, insurances] = await Promise.all([
    getSpecialties().catch(() => []),
    getClinics().catch(() => []),
    getCities().catch(() => []),
    getInsurances().catch(() => []),
  ])

  return (
    <NuevoMedicoClient
      specialties={specialties}
      clinics={clinics}
      cities={cities}
      insurances={insurances}
      token={token}
    />
  )
}
