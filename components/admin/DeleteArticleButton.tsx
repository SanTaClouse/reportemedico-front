'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { deleteArticle } from '@/lib/api'

interface Props {
  articleId: string
  token: string
}

export default function DeleteArticleButton({ articleId, token }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleDelete = () => {
    toast.warning('¿Eliminar este artículo?', {
      description: 'Esta acción no se puede deshacer.',
      action: {
        label: 'Eliminar',
        onClick: async () => {
          setLoading(true)
          const toastId = toast.loading('Eliminando artículo...')
          try {
            await deleteArticle(articleId, token)
            fetch('/api/revalidate', { method: 'POST' })
            toast.success('Artículo eliminado', { id: toastId })
            router.refresh()
          } catch {
            toast.error('Error al eliminar el artículo', { id: toastId })
          } finally {
            setLoading(false)
          }
        },
      },
      cancel: { label: 'Cancelar', onClick: () => {} },
      duration: 8000,
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-[var(--color-text-muted)] hover:text-red-500 transition-colors disabled:opacity-30"
      title="Eliminar"
    >
      {loading ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} strokeWidth={1.5} />}
    </button>
  )
}
