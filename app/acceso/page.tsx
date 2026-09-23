import { redirect } from 'next/navigation'
import { CURRENT_EVENT_SLUG } from '@/lib/api-eventos'

export default function AccesoIndex() {
  redirect(`/acceso/${CURRENT_EVENT_SLUG}`)
}
