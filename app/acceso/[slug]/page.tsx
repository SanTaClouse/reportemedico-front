export const dynamic = 'force-dynamic'

import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { decodeJwt } from 'jose'
import Scanner from '@/components/eventos/Scanner'
import { getAccessEvent } from '@/lib/api-eventos'

export default async function AccesoPage({ params }: { params: { slug: string } }) {
  const token = cookies().get('rm_token')?.value || ''
  // El middleware ya verificó la firma; acá solo se lee quién es para mostrarlo
  const claims = token ? decodeJwt(token) : {}
  const event = await getAccessEvent(params.slug, token).catch(() => null)
  if (!event) notFound()

  return (
    <Scanner
      event={event}
      token={token}
      userName={typeof claims.name === 'string' ? claims.name : null}
      isAdmin={claims.role === 'ADMIN'}
    />
  )
}
