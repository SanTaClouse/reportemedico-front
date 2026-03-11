'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { setArticleStatus } from '@/lib/api'

const OPTIONS = [
  { value: 'DRAFT', label: 'Borrador', color: 'text-gray-500' },
  { value: 'PENDING', label: 'Pendiente', color: 'text-yellow-600' },
  { value: 'PUBLISHED', label: 'Publicado', color: 'text-green-600' },
  { value: 'ARCHIVED', label: 'Archivado', color: 'text-red-500' },
]

interface Props {
  articleId: string
  currentStatus: string
  token: string
}

export default function InlineStatusSelect({ articleId, currentStatus, token }: Props) {
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setStatus(currentStatus)
  }, [currentStatus])

  const current = OPTIONS.find((o) => o.value === status)

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value
    const prev = status
    setStatus(newStatus)
    setLoading(true)
    const label = OPTIONS.find((o) => o.value === newStatus)?.label ?? newStatus
    const toastId = toast.loading('Actualizando estado...')
    try {
      await setArticleStatus(articleId, newStatus, token)
      fetch('/api/revalidate', { method: 'POST' })
      toast.success(`Estado → ${label}`, { id: toastId })
    } catch (err: any) {
      setStatus(prev)
      toast.error(err.message || 'Error al cambiar el estado', { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={loading}
      className={`text-xs font-medium border-none bg-transparent focus:outline-none cursor-pointer disabled:opacity-50 ${current?.color}`}
    >
      {OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}
