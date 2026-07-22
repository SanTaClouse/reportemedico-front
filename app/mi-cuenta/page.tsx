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

  // 1) Perfil existente (requiere access token). Aislado: si el token no está
  //    listo en el primer callback de Auth0, NO debe tumbar el prefill del lead.
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
  } catch {
    // sin perfil / token aún no disponible: el cliente muestra el onboarding
  }

  // 2) Lead dejado ANTES de Auth0 (cookie del modal de planes). Precarga el
  //    wizard y se vincula al guardar. Independiente del paso anterior y del
  //    access token — por eso el endpoint es público.
  if (!doctor) {
    const leadId = (await cookies()).get('rm_lead')?.value
    if (leadId) leadPrefill = await getLead(leadId).catch(() => null)
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
