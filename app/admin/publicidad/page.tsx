export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getAdminAds, getAdminAdSlots } from '@/lib/api'
import PublicidadClient from './PublicidadClient'

export default async function AdminPublicidadPage() {
  const cookieStore = cookies()
  const token = cookieStore.get('rm_token')?.value || ''

  const [ads, slots] = await Promise.all([
    getAdminAds(token).catch(() => []),
    getAdminAdSlots(token).catch(() => []),
  ])

  return <PublicidadClient initialAds={ads} initialSlots={slots} token={token} />
}
