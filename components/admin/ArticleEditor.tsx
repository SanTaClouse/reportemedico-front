'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { createArticle, updateArticle, setArticleStatus, type Tag } from '@/lib/api'
import { ArrowLeft, RefreshCw, Bold, Italic, Link2, List, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploader from '@/components/ui/ImageUploader'

interface ArticleEditorProps {
  token: string
  tags: Tag[]
  mode: 'create' | 'edit'
  articleType?: 'NEWS' | 'MEDICAL_ARTICLE'
  articleId?: string
  initialData?: any
}

const AUTOSAVE_INTERVAL = 60000 // 60 seg

export default function ArticleEditor({
  token,
  tags,
  mode,
  articleType = 'NEWS',
  articleId,
  initialData,
}: ArticleEditorProps) {
  const router = useRouter()
  const autosaveRef = useRef<NodeJS.Timeout | null>(null)
  const savedAtRef = useRef<Date | null>(null)

  const [form, setForm] = useState({
    title: initialData?.title || '',
    slug: initialData?.slug || '',
    excerpt: initialData?.excerpt || '',
    authorName: initialData?.authorName || 'Reporte Médico',
    status: initialData?.status || 'DRAFT',
    relevance: initialData?.relevance || 3,
    featuredImage: initialData?.featuredImage || '',
    tagIds: initialData?.tags?.map((t: any) => t.tag.id) || [],
    metaTitle: initialData?.seoMetadata?.metaTitle || '',
    metaDescription: initialData?.seoMetadata?.metaDescription || '',
    sources: initialData?.sources || [],
    publishedAt: initialData?.publishedAt || '',
  })

  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState(articleId)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: initialData?.content || '',
    editorProps: {
      attributes: {
        class: 'article-body min-h-[400px] focus:outline-none',
      },
    },
  })

  // Auto-generate slug
  const generateSlug = useCallback((title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }, [])

  const handleTitleChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      title: value,
      slug: mode === 'create' ? generateSlug(value) : prev.slug,
    }))
  }

  const getPayload = useCallback(() => ({
    title: form.title,
    slug: form.slug,
    excerpt: form.excerpt || undefined,
    content: editor?.getHTML() || '',
    authorName: form.authorName,
    status: form.status,
    relevance: Number(form.relevance),
    featuredImage: form.featuredImage || undefined,
    type: articleType,
    publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : undefined,
  }), [form, editor, articleType])

  const save = useCallback(async (publish = false) => {
    if (!form.title) { toast.warning('Escribe un título antes de guardar'); return }
    setLoading(true)
    setSavedStatus('saving')

    const payload = { ...getPayload(), status: publish ? 'PUBLISHED' : form.status }
    const toastId = toast.loading(publish ? 'Publicando...' : 'Guardando borrador...')

    try {
      if (mode === 'create' && !currentId) {
        const result = await createArticle(payload, token)
        setCurrentId((result as any).id)
      } else {
        await updateArticle(currentId!, payload, token)
      }
      setSavedStatus('saved')
      savedAtRef.current = new Date()
      fetch('/api/revalidate', { method: 'POST' })
      if (publish) {
        toast.success('Artículo publicado', { id: toastId })
        router.push('/admin/contenido')
      } else {
        toast.success('Borrador guardado', { id: toastId, duration: 2000 })
      }
    } catch (err: any) {
      toast.error(`Error al guardar: ${err.message}`, { id: toastId })
      setSavedStatus('idle')
    } finally {
      setLoading(false)
    }
  }, [form, editor, currentId, mode, token, router, getPayload])

  // Autosave
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      if (form.title && (mode === 'edit' || currentId)) {
        save(false)
      }
    }, AUTOSAVE_INTERVAL)
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current)
    }
  }, [form.title, save, mode, currentId])

  const toggleTag = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t: string) => t !== id)
        : [...prev.tagIds, id],
    }))
  }

  const addSource = () =>
    setForm((prev) => ({ ...prev, sources: [...prev.sources, { title: '', url: '' }] }))

  const updateSource = (i: number, field: 'title' | 'url', value: string) =>
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.map((s: any, idx: number) => (idx === i ? { ...s, [field]: value } : s)),
    }))

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-1.5'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* MAIN — 2/3 */}
      <div className="lg:col-span-2 space-y-4">
        {/* Título */}
        <div>
          <input
            type="text"
            placeholder="Escribe un título claro y atractivo"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full text-2xl font-display font-bold border-none focus:outline-none placeholder:text-[var(--color-text-muted)] bg-transparent text-[var(--color-text-primary)]"
          />
        </div>

        {/* Slug */}
        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)] pb-3">
          <span className="shrink-0">reportemedico.com/noticias/</span>
          <input
            type="text"
            value={form.slug}
            onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
            className="flex-1 border-none bg-transparent focus:outline-none text-[var(--color-text-secondary)]"
          />
          <button
            onClick={() => setForm((p) => ({ ...p, slug: generateSlug(p.title) }))}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            title="Regenerar slug"
          >
            <RefreshCw size={13} />
          </button>
        </div>

        {/* TipTap toolbar */}
        {editor && (
          <div className="flex items-center gap-1 border border-[var(--color-border)] rounded-lg p-1.5 flex-wrap">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              active={editor.isActive('heading', { level: 2 })}
              label="H2"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              active={editor.isActive('heading', { level: 3 })}
              label="H3"
            />
            <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              active={editor.isActive('bold')}
              icon={<Bold size={14} />}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              active={editor.isActive('italic')}
              icon={<Italic size={14} />}
            />
            <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
            <ToolbarButton
              onClick={() => {
                const url = window.prompt('URL del enlace:')
                if (url) editor.chain().focus().setLink({ href: url }).run()
              }}
              active={editor.isActive('link')}
              icon={<Link2 size={14} />}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              active={editor.isActive('bulletList')}
              icon={<List size={14} />}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              active={editor.isActive('blockquote')}
              label='"'
            />
          </div>
        )}

        {/* Editor content */}
        <div className="border border-[var(--color-border)] rounded-xl p-4 min-h-[400px]">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* SIDEBAR — 1/3 */}
      <div className="space-y-5">
        {/* Estado guardado */}
        {savedStatus !== 'idle' && (
          <p className="text-xs text-[var(--color-text-muted)] text-center">
            {savedStatus === 'saving' ? 'Guardando...' : '✓ Guardado'}
          </p>
        )}

        {/* Publicación */}
        <SidebarCard title="Publicación">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Estado</label>
              <select
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                className={inputClass}
              >
                <option value="DRAFT">Borrador</option>
                <option value="PUBLISHED">Publicado</option>
                <option value="ARCHIVED">Archivado</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Fecha de publicación</label>
              <input
                type="datetime-local"
                value={form.publishedAt ? form.publishedAt.slice(0, 16) : ''}
                onChange={(e) => setForm((p) => ({ ...p, publishedAt: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Relevancia</label>
              <select
                value={form.relevance}
                onChange={(e) => setForm((p) => ({ ...p, relevance: Number(e.target.value) }))}
                className={inputClass}
              >
                <option value={1}>1 — Hero principal</option>
                <option value={2}>2 — Card grande</option>
                <option value={3}>3 — Card compacta</option>
              </select>
            </div>
          </div>
        </SidebarCard>

        {/* Imagen principal */}
        <SidebarCard title="Imagen Principal">
          <ImageUploader
            value={form.featuredImage}
            onChange={(url) => setForm((p) => ({ ...p, featuredImage: url }))}
            token={token}
            label=""
          />
        </SidebarCard>

        {/* Autor */}
        <SidebarCard title="Autor">
          <input
            type="text"
            value={form.authorName}
            onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
            className={inputClass}
          />
        </SidebarCard>

        {/* Tags */}
        <SidebarCard title="Tags">
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleTag(tag.id)}
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors ${form.tagIds.includes(tag.id)
                  ? 'bg-primary text-white border-primary'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-primary hover:text-primary'
                  }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        </SidebarCard>

        {/* SEO */}
        <SidebarCard title="SEO">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>
                Meta título
                <span className={`ml-1 ${form.metaTitle.length > 60 ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}>
                  {form.metaTitle.length}/60
                </span>
              </label>
              <input
                type="text"
                value={form.metaTitle}
                onChange={(e) => setForm((p) => ({ ...p, metaTitle: e.target.value }))}
                className={inputClass}
                maxLength={70}
              />
            </div>
            <div>
              <label className={labelClass}>
                Meta descripción
                <span className={`ml-1 ${form.metaDescription.length > 155 ? 'text-red-500' : 'text-[var(--color-text-muted)]'}`}>
                  {form.metaDescription.length}/155
                </span>
              </label>
              <textarea
                rows={3}
                value={form.metaDescription}
                onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                className={inputClass}
                maxLength={170}
              />
            </div>
          </div>
        </SidebarCard>

        {/* Fuentes */}
        <SidebarCard title="Fuentes científicas">
          <div className="space-y-2 mb-2">
            {form.sources.map((source: any, i: number) => (
              <div key={i} className="space-y-1">
                <input
                  placeholder="Título"
                  value={source.title}
                  onChange={(e) => updateSource(i, 'title', e.target.value)}
                  className={inputClass}
                />
                <input
                  placeholder="URL (opcional)"
                  value={source.url}
                  onChange={(e) => updateSource(i, 'url', e.target.value)}
                  className={inputClass}
                />
              </div>
            ))}
          </div>
          <button onClick={addSource} className="text-xs text-[var(--color-primary)] hover:underline">
            + Agregar fuente
          </button>
        </SidebarCard>
      </div>

      {/* Sticky bottom actions */}
      <div className="lg:col-span-3 sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-4 py-3 z-10">
        <button
          onClick={() => router.push('/admin/contenido')}
          className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
        >
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => save(false)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium border border-[var(--color-border)] rounded-lg text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => save(true)}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            Publicar →
          </button>
        </div>
      </div>
    </div>
  )
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-3 pb-2 border-b border-[var(--color-border)]">
        {title}
      </h3>
      {children}
    </div>
  )
}

function ToolbarButton({
  onClick,
  active,
  label,
  icon,
}: {
  onClick: () => void
  active: boolean
  label?: string
  icon?: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-colors ${active
        ? 'bg-primary text-white'
        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)]'
        }`}
    >
      {icon || label}
    </button>
  )
}
