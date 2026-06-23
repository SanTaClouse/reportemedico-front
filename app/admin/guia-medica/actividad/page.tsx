export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { getEngagement, getDoctorDigestPreview } from '@/lib/api-guia'
import ActividadClient from './ActividadClient'
import DoctorDigestSender from './DoctorDigestSender'

export default async function AdminActividadPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('rm_token')?.value || ''
  const [rows, digestPreview] = await Promise.all([
    getEngagement(token).catch(() => []),
    getDoctorDigestPreview(token).catch(() => null),
  ])
  return (
    <>
      {digestPreview && (
        <div className="px-6 pt-6 max-w-5xl">
          <DoctorDigestSender initialPreview={digestPreview} token={token} />
        </div>
      )}
      <ActividadClient rows={rows} />
    </>
  )
}
