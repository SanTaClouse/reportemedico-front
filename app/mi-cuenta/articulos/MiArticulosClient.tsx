'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Send, FileText, Plus, X } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploader from '@/components/ui/ImageUploader'
import type { Tag } from '@/lib/api'

interface MyArticle {
  id: string
  title: string
  slug: string
  status: 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'ARCHIVED'
  type: 'NEWS' | 'MEDICAL_ARTICLE'
  createdAt: string
  publishedAt: string | null
}

interface Props {
  initialArticles: MyArticle[]
  hasProfile: boolean
  tags: Tag[]
}

const STATUS_LABEL: Record<MyArticle['status'], { text: string; cls: string }> = {
  DRAFT: { text: 'Borrador', cls: 'bg-gray-100 text-gray-600' },
  PENDING: { text: 'En revisión', cls: 'bg-amber-100 text-amber-700' },
  PUBLISHED: { text: 'Publicado', cls: 'bg-emerald-100 text-emerald-700' },
  ARCHIVED: { text: 'Archivado', cls: 'bg-gray-100 text-gray-500' },
}

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary,#001450)]/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'

const plainToHtml = (text: string): string =>
  text.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean).map((b) => `<p>${b.replace(/\n/g, '<br>')}</p>`).join('')

export default function MiArticulosClient({ initialArticles, hasProfile, tags }: Props) {
  const [articles, setArticles] = useState(initialArticles)
  const [form, setForm] = useState({ title: '', excerpt: '', content: '', featuredImage: '' })
  const [tagIds, setTagIds] = useState<string[]>([])
  const [sources, setSources] = useState<{ title: string; url: string }[]>([])
  const [sending, setSending] = useState(false)

  const toggleTag = (id: string) =>
    setTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.title.trim().length < 10) return toast.error('El título debe tener al menos 10 caracteres')
    if (!form.content.trim()) return toast.error('Escribe el contenido del artículo')
    setSending(true)
    const toastId = toast.loading('Enviando tu artículo...')
    try {
      const res = await fetch('/api/mi-cuenta/articulo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title.trim(),
          excerpt: form.excerpt.trim() || undefined,
          content: plainToHtml(form.content),
          featuredImage: form.featuredImage || undefined,
          tagIds: tagIds.length ? tagIds : undefined,
          sources: sources.filter((s) => s.title).map((s, i) => ({ ...s, order: i })),
        }),
      })
      const body = await res.json()
      if (!res.ok) throw new Error(body.message || 'No se pudo enviar el artículo')
      setArticles((prev) => [{ ...body }, ...prev])
      setForm({ title: '', excerpt: '', content: '', featuredImage: '' })
      setTagIds([])
      setSources([])
      toast.success('¡Artículo enviado! Te avisaremos cuando se publique.', { id: toastId })
    } catch (err) {
      toast.error((err as Error).message, { id: toastId })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-10">
      <Link href="/mi-cuenta" className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-primary,#001450)] mb-3">
        <ArrowLeft size={13} /> Volver a mi cuenta
      </Link>
      <h1 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-1">Enviar un artículo</h1>
      <p className="text-sm text-[var(--color-text-muted)] mb-6">
        Tus datos de autor (nombre, foto) se toman de tu perfil — solo escribe el contenido.
      </p>

      {!hasProfile ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-8">
          Primero completa tu perfil de médico para poder enviar artículos.{' '}
          <Link href="/mi-cuenta" className="font-semibold underline">Ir a mi perfil</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] p-5 space-y-4 mb-10">
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Título *</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Título claro y descriptivo" />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Resumen (opcional)</label>
            <textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} rows={2} className={inputClass} />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Contenido *</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={10} className={inputClass} placeholder="Escribe aquí tu artículo. Separa los párrafos con una línea en blanco." />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Temas relacionados</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    tagIds.includes(tag.id)
                      ? 'bg-[var(--color-primary,#001450)] text-white border-[var(--color-primary,#001450)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary,#001450)]/40'
                  }`}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </div>

          <ImageUploader value={form.featuredImage} onChange={(url) => setForm({ ...form, featuredImage: url })} label="Imagen del artículo (opcional)" />

          {/* Fuentes */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Fuentes científicas (opcional)</label>
            <div className="space-y-2 mb-2">
              {sources.map((s, i) => (
                <div key={i} className="flex gap-2">
                  <input value={s.title} onChange={(e) => setSources((p) => p.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} className={`${inputClass} flex-1`} placeholder="Título de la fuente" />
                  <input value={s.url} onChange={(e) => setSources((p) => p.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} className={`${inputClass} flex-1`} placeholder="URL (opcional)" />
                  <button type="button" onClick={() => setSources((p) => p.filter((_, j) => j !== i))} className="p-2 text-[var(--color-text-muted)] hover:text-red-600"><X size={14} /></button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setSources((p) => [...p, { title: '', url: '' }])} className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary,#001450)] hover:underline">
              <Plus size={12} /> Agregar fuente
            </button>
          </div>

          <button type="submit" disabled={sending} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--color-accent,#F0B414)] text-[var(--color-primary,#001450)] rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Enviar para revisión
          </button>
        </form>
      )}

      {/* Mis publicaciones */}
      <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)] mb-3">Mis publicaciones</h2>
      {articles.length === 0 ? (
        <div className="text-center py-10 text-sm text-[var(--color-text-muted)]">
          <FileText size={28} className="mx-auto mb-2 opacity-40" strokeWidth={1.5} />
          Todavía no enviaste ningún artículo.
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-border)] bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          {articles.map((a) => (
            <li key={a.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{a.title}</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">{new Date(a.createdAt).toLocaleDateString('es-DO')}</p>
              </div>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_LABEL[a.status].cls}`}>{STATUS_LABEL[a.status].text}</span>
              {a.status === 'PUBLISHED' && (
                <a href={`/articulos/${a.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs font-medium text-[var(--color-primary,#001450)] hover:underline shrink-0">Ver</a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
