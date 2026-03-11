'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

async function getToken() {
  const store = await cookies()
  return store.get('rm_token')?.value ?? ''
}

export async function approveSpecialtyAction(articleId: string, name: string) {
  const token = await getToken()
  const res = await fetch(`${API}/articles/${articleId}/approve-specialty`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Error al aprobar la especialidad')
  revalidatePath('/admin/articulos-pendientes')
  return res.json()
}

export async function rejectSpecialtyAction(articleId: string, name: string) {
  const token = await getToken()
  const res = await fetch(`${API}/articles/${articleId}/reject-specialty`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  })
  if (!res.ok) throw new Error('Error al rechazar la especialidad')
  revalidatePath('/admin/articulos-pendientes')
  return res.json()
}
