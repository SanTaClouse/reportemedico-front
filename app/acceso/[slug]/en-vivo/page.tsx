export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import LiveView from '@/components/eventos/LiveView'

export default function EnVivoPage({ params }: { params: { slug: string } }) {
  const token = cookies().get('rm_token')?.value || ''
  return <LiveView slug={params.slug} token={token} />
}
