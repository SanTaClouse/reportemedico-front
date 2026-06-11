export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getSpecialties, getCities, getClinics, getInsurances } from '@/lib/api-guia'
import CatalogosClient from './CatalogosClient'

export default async function AdminCatalogosPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [specialties, cities, clinics, insurances] = await Promise.all([
    getSpecialties().catch(() => []),
    getCities().catch(() => []),
    getClinics().catch(() => []),
    getInsurances().catch(() => []),
  ])

  return (
    <CatalogosClient
      initialSpecialties={specialties}
      initialCities={cities}
      initialClinics={clinics}
      initialInsurances={insurances}
      token={token}
    />
  )
}
