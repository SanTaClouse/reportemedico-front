import { cookies } from 'next/headers'
import { auth0 } from '@/lib/auth0'
import { getSpecialties, getClinics, getInsurances, getLead, type Doctor, type Lead } from '@/lib/api-guia'
import MiCuentaClient from './MiCuentaClient'

export const dynamic = 'force-dynamic'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/** Área del médico: onboarding (wizard), edición y estado del perfil (06 §4, §6). */
export default async function MiCuentaPage() {
  const session = await auth0.getSession()
  const user = session?.user

  let doctor: Doctor | null = null
  let claimCandidate: Doctor | null = null
  let leadPrefill: Lead | null = null
  try {
    const { accessToken } = await auth0.getAccessToken()
    const res = await fetch(`${API_URL}/doctors/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: 'no-store',
    })
    if (res.ok) {
      const body = await res.json()
      doctor = body.doctor
      claimCandidate = body.claimCandidate ?? null
    }

    // Lead dejado ANTES de pasar por Auth0 (cookie que puso el modal de planes):
    // precarga el wizard y se vincula al guardar. Solo si aún no hay perfil.
    if (!doctor) {
      const leadId = (await cookies()).get('rm_lead')?.value
      if (leadId && accessToken) leadPrefill = await getLead(leadId, accessToken).catch(() => null)
    }
  } catch {
    // sin perfil / backend no disponible: el cliente muestra el onboarding
  }

  const [specialties, clinics, insurances] = await Promise.all([
    getSpecialties().catch(() => []),
    getClinics().catch(() => []),
    getInsurances().catch(() => []),
  ])

  return (
    <MiCuentaClient
      userName={user?.name ?? null}
      userEmail={user?.email ?? null}
      userPicture={(user?.picture as string) ?? null}
      initialDoctor={doctor}
      claimCandidate={claimCandidate}
      leadPrefill={leadPrefill}
      specialties={specialties}
      clinics={clinics}
      insurances={insurances}
    />
  )
}
