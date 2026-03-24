'use client'

// Timezone canónica de la aplicación (República Dominicana, UTC-4, sin horario de verano)
const APP_TZ = 'America/Santo_Domingo'

/** Convierte un ISO UTC a string para <input type="datetime-local"> en hora RD */
function toRDInput(iso: string): string {
  return new Date(iso).toLocaleString('sv', { timeZone: APP_TZ }).slice(0, 16).replace(' ', 'T')
}

/** Convierte el valor de <input type="datetime-local"> (interpretado como hora RD) a ISO UTC */
function rdInputToISO(local: string): string {
  if (!local) return ''
  const [date, time] = local.split('T')
  const [y, mo, d] = date.split('-').map(Number)
  const [h, min] = time.split(':').map(Number)
  // Santo Domingo es siempre UTC-4 (sin DST)
  return new Date(Date.UTC(y, mo - 1, d, h + 4, min)).toISOString()
}

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { createArticle, updateArticle, setArticleStatus, getTagsAdmin, createTag, checkTagExists, RELEVANCE_LIMITS, RELEVANCE_LABELS, type Tag } from '@/lib/api'
import { ArrowLeft, RefreshCw, Bold, Italic, Link2, List, HelpCircle, Check, X, Maximize2, Minimize2 } from 'lucide-react'
import { toast } from 'sonner'
import ImageUploader from '@/components/ui/ImageUploader'
import { analyzeSeo, scoreColor, scoreBg } from '@/lib/seo-analyzer'
import SeoHelpModal from '@/components/admin/SeoHelpModal'

interface ArticleEditorProps {
  token: string
  tags: Tag[]
  mode: 'create' | 'edit'
  articleType?: 'NEWS' | 'MEDICAL_ARTICLE'
  articleId?: string
  initialData?: any
  relevanceCounts?: Record<number, number>
}

const AUTOSAVE_INTERVAL = 15_000 // 15 seg — solo cuando hay cambios sin guardar

export default function ArticleEditor({
  token,
  tags,
  mode,
  articleType = 'NEWS',
  articleId,
  initialData,
  relevanceCounts = {},
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
    relevance: initialData?.relevance || 4,
    featuredImage: initialData?.featuredImage || '',
    tagIds: initialData?.tags?.map((t: any) => t.tag.id) || [],
    metaTitle: initialData?.seoMetadata?.metaTitle || '',
    metaDescription: initialData?.seoMetadata?.metaDescription || '',
    sources: initialData?.sources?.map(({ title, url, order }: { title: string; url?: string; order?: number }) => ({ title, url, order })) || [],
    publishedAt: toRDInput(initialData?.publishedAt ?? new Date().toISOString()),
  })

  const [savedStatus, setSavedStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [loading, setLoading] = useState(false)
  const [currentId, setCurrentId] = useState(articleId)
  const [showSeoModal, setShowSeoModal] = useState(false)
  const [availableTags, setAvailableTags] = useState<Tag[]>(tags)
  const [focusMode, setFocusMode] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [newTagLoading, setNewTagLoading] = useState(false)
  const [showLinkInput, setShowLinkInput] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const linkInputRef = useRef<HTMLInputElement>(null)

  const isDirtyRef = useRef(false)
  const [isDirty, setIsDirty] = useState(false)
  // Snapshot del form en el primer render para detectar cambios reales (evita falsos dirty al abrir)
  const initialFormSnapshot = useRef<string | null>(null)

  // localStorage key único por artículo/modo
  const lsKey = `rm_draft_${mode === 'edit' ? articleId ?? 'edit' : 'new'}`

  const [editorText, setEditorText] = useState('')

  const editor = useEditor({
    immediatelyRender: false,
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

  useEffect(() => {
    if (!editor) return
    // transaction.docChanged es true solo cuando el contenido realmente cambió (no en re-renders de React)
    const handler = ({ transaction }: { transaction: any }) => {
      setEditorText(editor.getText())
      if (transaction?.docChanged) { isDirtyRef.current = true; setIsDirty(true) }
    }
    editor.on('update', handler)
    return () => { editor.off('update', handler) }
  }, [editor]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tags frescos al montar (evita cache de 1h de getTags)
  useEffect(() => {
    getTagsAdmin(token).then(setAvailableTags).catch(() => { })
  }, [token])

  // ESC para salir del modo focus + sincronizar con fullscreen nativo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFocusMode(false)
        if (document.fullscreenElement) document.exitFullscreen().catch(() => { })
      }
    }
    const onFsChange = () => {
      if (!document.fullscreenElement) setFocusMode(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('fullscreenchange', onFsChange)
    }
  }, [])

  const toggleFocusMode = () => {
    const next = !focusMode
    setFocusMode(next)
    if (next) {
      document.documentElement.requestFullscreen?.().catch(() => { })
    } else {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { })
    }
  }

  // isDirty + localStorage backup por cambios en el form — sin API call
  useEffect(() => {
    const snapshot = JSON.stringify(form)
    // Capturar snapshot inicial en el primer render (robusto ante React strict mode)
    if (initialFormSnapshot.current === null) { initialFormSnapshot.current = snapshot; return }
    // No marcar dirty si el form volvió a su estado inicial (p.ej., undo total)
    if (snapshot === initialFormSnapshot.current) return
    isDirtyRef.current = true
    setIsDirty(true)
    try {
      localStorage.setItem(lsKey, JSON.stringify({
        form,
        content: editor?.getHTML() ?? '',
        savedAt: Date.now(),
      }))
    } catch { /* quota exceeded, no-op */ }
  }, [form]) // eslint-disable-line react-hooks/exhaustive-deps

  const seoAnalysis = useMemo(() => analyzeSeo({
    title: form.title,
    excerpt: form.excerpt,
    content: editorText,
    metaTitle: form.metaTitle,
    metaDescription: form.metaDescription,
  }), [form.title, form.excerpt, form.metaTitle, form.metaDescription, editorText])

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
    ...(mode === 'create' && !currentId ? { type: articleType } : {}),
    publishedAt: form.publishedAt ? rdInputToISO(form.publishedAt) : undefined,
    tagIds: form.tagIds,
    sources: form.sources.filter((s: any) => !!s.title),
    ...((form.metaTitle || form.metaDescription) ? {
      seoMetadata: {
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      }
    } : {}),
  }), [form, editor, articleType, mode])

  // silent=true: autosave silencioso (sin toast, sin bloquear botones)
  const save = useCallback(async (publish = false, silent = false) => {
    if (!form.title) { if (!silent) toast.warning('Escribe un título antes de guardar'); return }
    if (!silent) setLoading(true)
    setSavedStatus('saving')

    const payload = { ...getPayload(), status: publish ? 'PUBLISHED' : form.status }
    const toastId = silent ? undefined : toast.loading(publish ? 'Publicando...' : 'Guardando borrador...')

    try {
      if (mode === 'create' && !currentId) {
        const result = await createArticle(payload, token)
        setCurrentId((result as any).id)
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { type: _t, ...updatePayload } = payload as any
        await updateArticle(currentId!, updatePayload, token)
      }
      setSavedStatus('saved')
      savedAtRef.current = new Date()
      isDirtyRef.current = false
      setIsDirty(false)
      try { localStorage.removeItem(lsKey) } catch { /* no-op */ }
      // Invalida también las páginas de tag afectadas y el artículo en sí
      const tagPaths = form.tagIds
        .map((id: string) => availableTags.find((t) => t.id === id)?.slug)
        .filter(Boolean)
        .map((slug: string) => `/tag/${slug}`)
      const articlePath = form.slug
        ? [`/${articleType === 'NEWS' ? 'noticias' : 'articulos'}/${form.slug}`]
        : []
      fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: [...tagPaths, ...articlePath] }),
      }).catch(() => { })
      // Invalida el cache del cliente para que /admin/contenido muestre el artículo al navegar
      router.refresh()
      if (publish) {
        toast.success('Artículo publicado', { id: toastId })
        router.push('/admin/contenido')
      } else if (!silent) {
        toast.success('Borrador guardado', { id: toastId, duration: 2000 })
      }
    } catch (err: any) {
      if (!silent) {
        toast.error(`Error al guardar: ${err.message}`, { id: toastId })
      } else {
        toast.warning('Autosave falló — guardá manualmente antes de salir', { duration: 5000 })
      }
      setSavedStatus('idle')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [form, editor, currentId, mode, token, router, getPayload])

  // Autosave — ref para que el interval/visibilitychange no recreen el closure
  const saveRef = useRef(save)
  useEffect(() => { saveRef.current = save }, [save])

  // API autosave cada 60s — solo si hay cambios pendientes
  useEffect(() => {
    const id = setInterval(() => {
      if (isDirtyRef.current && form.title && (mode === 'edit' || currentId)) {
        saveRef.current(false, true) // silent
      }
    }, AUTOSAVE_INTERVAL)
    return () => clearInterval(id)
  }, [form.title, mode, currentId])

  // Guardar en API al cambiar de pestaña (si hay cambios)
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'hidden' && isDirtyRef.current && form.title && (mode === 'edit' || currentId)) {
        saveRef.current(false, true) // silent
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [form.title, mode, currentId])

  // Alerta del browser al intentar cerrar/navegar fuera con cambios sin guardar
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  const applyLink = () => {
    if (!editor) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (linkUrl) (editor.commands as any).setLink({ href: linkUrl })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    else (editor.commands as any).unsetLink()
    setShowLinkInput(false)
    setLinkUrl('')
  }

  const handleBack = () => {
    if (isDirtyRef.current && !window.confirm('Hay cambios sin guardar. ¿Salir de todas formas?')) return
    router.refresh()
    router.push('/admin/contenido')
  }

  const toggleTag = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t: string) => t !== id)
        : [...prev.tagIds, id],
    }))
  }

  const handleAddTag = async () => {
    const name = newTagName.trim()
    if (!name || name.length < 2) return
    setNewTagLoading(true)
    try {
      const { exists, tag: existing } = await checkTagExists(name)
      if (exists && existing) {
        // Tag ya existe — solo seleccionarla
        if (!availableTags.find((t) => t.id === existing.id)) {
          setAvailableTags((prev) => [...prev, existing])
        }
        setForm((prev) => ({
          ...prev,
          tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
        }))
        toast.info(`Tag "${existing.name}" ya existía y fue seleccionada`)
      } else {
        // Tag nueva — crearla y seleccionarla
        const created = await createTag(name, token)
        setAvailableTags((prev) => [...prev, created])
        setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, created.id] }))
        toast.success(`Tag "${created.name}" creada y seleccionada`)
      }
      setNewTagName('')
    } catch {
      toast.error('No se pudo crear el tag')
    } finally {
      setNewTagLoading(false)
    }
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
    <div className={focusMode
      ? 'fixed inset-0 z-[100] bg-[var(--color-surface-2)] overflow-hidden'
      : 'grid grid-cols-1 lg:grid-cols-3 gap-6'
    }>
      {/* MAIN — 2/3 */}
      <div className={focusMode ? 'h-full overflow-y-auto' : 'lg:col-span-2 space-y-4'}>
        <div className={focusMode ? 'max-w-3xl mx-auto px-8 py-12 space-y-4' : 'space-y-4'}>
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
          <div className="border-b border-[var(--color-border)] pb-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
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
            {mode === 'edit' && initialData?.slug && form.slug !== initialData.slug && (
              <p className="text-[11px] text-amber-600 flex items-start gap-1.5 leading-snug">
                <span className="shrink-0 mt-px">⚠️</span>
                La URL cambió. Quien tenga el enlace anterior
                <span className="font-mono">/{initialData.slug}</span>
                verá un error 404. Considerá si realmente necesitás cambiarla.
              </p>
            )}
          </div>

          {/* Resumen / Excerpt */}
          <textarea
            rows={2}
            placeholder="Resumen del artículo (aparece en las cards y como meta descripción si no se define una)"
            value={form.excerpt}
            onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
            className="w-full text-base text-[var(--color-text-secondary)] border-none focus:outline-none placeholder:text-[var(--color-text-muted)] bg-transparent resize-none border-b border-[var(--color-border)] pb-3"
          />

          {/* Estado de guardado — visible mientras se edita */}
          {(isDirty || savedStatus === 'saving' || savedStatus === 'saved') && (
            <div className="flex justify-end">
              {savedStatus === 'saving' && (
                <span className="text-[11px] text-[var(--color-text-muted)] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
                  Guardando...
                </span>
              )}
              {savedStatus === 'saved' && !isDirty && (
                <span className="text-[11px] text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Guardado
                </span>
              )}
              {isDirty && savedStatus !== 'saving' && (
                <span className="text-[11px] text-amber-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                  Cambios sin guardar
                </span>
              )}
            </div>
          )}

          {/* TipTap toolbar */}
          {editor && (
            <div className="flex items-center gap-1 rounded-lg p-1.5 flex-wrap border border-[var(--color-border)]">
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive('heading', { level: 2 })}
                label="H2"
                tooltip="Subtítulo de sección (H2)"
              />
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleHeading({ level: 3 }).run()}
                active={editor.isActive('heading', { level: 3 })}
                label="H3"
                tooltip="Subtítulo secundario (H3)"
              />
              <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleBold().run()}
                active={editor.isActive('bold')}
                icon={<Bold size={14} />}
                tooltip="Negrita (Ctrl+B)"
              />
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleItalic().run()}
                active={editor.isActive('italic')}
                icon={<Italic size={14} />}
                tooltip="Cursiva (Ctrl+I)"
              />
              <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
              <ToolbarButton
                onClick={() => {
                  if (editor.isActive('link')) {
                    (editor.chain() as any).focus().unsetLink().run()
                  } else {
                    setLinkUrl(editor.getAttributes('link').href || '')
                    setShowLinkInput(true)
                    setTimeout(() => linkInputRef.current?.focus(), 50)
                  }
                }}
                active={editor.isActive('link')}
                icon={<Link2 size={14} />}
                tooltip={editor.isActive('link') ? 'Quitar link' : 'Insertar link (seleccionar texto primero)'}
              />
              {showLinkInput && (
                <div className="flex items-center gap-1 ml-2">
                  <input
                    ref={linkInputRef}
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLinkInput(false) }}
                    placeholder="https://..."
                    className="text-xs px-2 py-1 border border-[var(--color-border)] rounded bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-primary/30 w-44"
                  />
                  <button type="button" onClick={applyLink} className="text-primary hover:text-primary-light"><Check size={14} /></button>
                  <button type="button" onClick={() => setShowLinkInput(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"><X size={14} /></button>
                </div>
              )}
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleBulletList().run()}
                active={editor.isActive('bulletList')}
                icon={<List size={14} />}
                tooltip="Lista con viñetas"
              />
              <ToolbarButton
                onClick={() => (editor.chain() as any).focus().toggleBlockquote().run()}
                active={editor.isActive('blockquote')}
                label='"'
                tooltip="Cita destacada"
              />
              <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
              {/* Botón focus con tooltip manual por ser custom */}
              <div className="relative group/tb">
                <button
                  type="button"
                  onClick={toggleFocusMode}
                  className="p-1.5 rounded text-[var(--color-text-muted)] hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  {focusMode ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                </button>
                <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
                opacity-0 group-hover/tb:opacity-100 transition-opacity duration-150">
                  <div className="bg-gray-900 text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
                    {focusMode ? 'Salir del modo foco (Esc)' : 'Modo foco — pantalla completa'}
                  </div>
                  <div className="mx-auto w-0 h-0 border-l-4 border-r-4 border-t-4
                  border-l-transparent border-r-transparent border-t-gray-900" />
                </div>
              </div>

              {/* Guardar rápido — siempre visible en toolbar */}
              <div className="w-px h-5 bg-[var(--color-border)] mx-1" />
              <button
                type="button"
                onClick={() => save(false)}
                disabled={loading}
                className={`px-3 py-1 text-xs rounded font-medium border transition-colors disabled:opacity-40 ${
                  isDirty
                    ? 'border-primary text-primary hover:bg-primary/10'
                    : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)]'
                }`}
              >
                {loading ? '...' : 'Guardar'}
              </button>
            </div>
          )}

          {/* Editor content */}
          <div className="border border-[var(--color-border)] rounded-xl p-4 min-h-[500px]">
            <EditorContent editor={editor} />
          </div>

          {/* Guía de uso del editor */}
          <details className="text-xs rounded-lg border border-[var(--color-border)] overflow-hidden">
            <summary className="px-4 py-2.5 cursor-pointer select-none font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] transition-colors list-none flex items-center gap-2">
              <HelpCircle size={13} strokeWidth={1.5} />
              ¿Cómo usar el editor?
            </summary>
            <div className="px-4 pb-4 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 bg-[var(--color-surface-2)]">
              <div>
                <p className="font-semibold text-[var(--color-text-primary)] mb-1.5">Botones disponibles</p>
                <ul className="space-y-1 text-[var(--color-text-secondary)]">
                  <li><span className="font-bold text-[var(--color-text-primary)]">H2</span> — Subtítulo de sección</li>
                  <li><span className="font-bold text-[var(--color-text-primary)]">H3</span> — Subtítulo secundario</li>
                  <li><kbd className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1">Ctrl+B</kbd> Negrita &nbsp;·&nbsp; <kbd className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded px-1">Ctrl+I</kbd> Cursiva</li>
                  <li>🔗 Link — seleccioná el texto primero</li>
                  <li>≡ Lista con viñetas</li>
                  <li>" Cita destacada (blockquote)</li>
                  <li>⤢ Modo foco — pantalla completa</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-[var(--color-text-primary)] mb-1.5">SEO y buenas prácticas</p>
                <ul className="space-y-1 text-[var(--color-text-secondary)]">
                  <li>✅ Usa <strong>H2 y H3</strong> para organizar secciones</li>
                  <li>✅ Incluí palabras clave en los subtítulos</li>
                  <li>✅ Párrafos cortos (3-4 líneas máximo)</li>
                  <li>✅ El resumen (excerpt) aparece en Google</li>
                  <li>⚠️ Evitá pegar texto directo desde Word</li>
                </ul>
              </div>
            </div>
          </details>

          {/* SEO — debajo del editor */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[var(--color-border)]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
                  SEO <span className="normal-case font-normal">(opcional)</span>
                </h3>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Lo que Google muestra en los resultados de búsqueda. Puede diferir del título y resumen que ven los lectores.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {form.title && (
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${scoreBg(seoAnalysis.score)}`} />
                    <span className={`text-xs font-bold ${scoreColor(seoAnalysis.score)}`}>
                      {seoAnalysis.score}/100
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setShowSeoModal(true)}
                  className="text-[var(--color-text-muted)] hover:text-primary transition-colors"
                  title="¿Cómo mejorar el SEO?"
                >
                  <HelpCircle size={14} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Señales */}
              {form.title && (
                <div className="space-y-1.5">
                  {seoAnalysis.signals.map((signal) => (
                    <div key={signal.label} className="flex items-start gap-2">
                      <span className="mt-0.5 shrink-0 text-xs">
                        {signal.status === 'ok' ? '🟢' : signal.status === 'warn' ? '🟡' : '🔴'}
                      </span>
                      <div>
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">{signal.label}: </span>
                        <span className="text-xs text-[var(--color-text-muted)]">{signal.hint}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Campos opcionales */}
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
                    placeholder={form.title || 'Se usará el título del artículo'}
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
                    rows={2}
                    value={form.metaDescription}
                    onChange={(e) => setForm((p) => ({ ...p, metaDescription: e.target.value }))}
                    className={inputClass}
                    maxLength={170}
                    placeholder={form.excerpt || 'Se usará el resumen del artículo'}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SIDEBAR — 1/3 */}
      {!focusMode && <div className="space-y-5 pb-20">
        {/* Imagen principal */}
        <SidebarCard title="Imagen Principal">
          <ImageUploader
            value={form.featuredImage}
            onChange={(url) => setForm((p) => ({ ...p, featuredImage: url }))}
            token={token}
            label=""
          />
        </SidebarCard>

        {/* Publicación */}
        <SidebarCard title="Publicación">
          <div className="space-y-3">
            <div>
              <label className={labelClass}>Fecha de publicación <span className="text-[var(--color-text-muted)] font-normal">(hora RD, UTC-4)</span></label>
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
                {([1, 2, 3, 4, 5] as const).map((level) => {
                  const limit = RELEVANCE_LIMITS[level]
                  const count = relevanceCounts[level] ?? 0
                  // Si el artículo ya ocupa este nivel, no se activarán avisos al guardar aquí
                  const isArticleOwnLevel = mode === 'edit' && initialData?.relevance === level
                  const pct = limit === Infinity || isArticleOwnLevel ? 0 : count / limit
                  const suffix = limit === Infinity ? '' : ` — ${count}/${limit}`
                  return (
                    <option key={level} value={level}>
                      {level} — {RELEVANCE_LABELS[level]}{suffix}{pct >= 1 ? ' ⚠ lleno' : pct >= 0.75 ? ' ·casi lleno' : ''}
                    </option>
                  )
                })}
              </select>
              {/* Aviso visual debajo del select */}
              {(() => {
                const level = form.relevance as number
                const limit = RELEVANCE_LIMITS[level]
                if (!limit || limit === Infinity) return null
                const count = relevanceCounts[level] ?? 0
                // Si el artículo ya ocupa este nivel, guardarlo aquí no desplazará a nadie
                if (mode === 'edit' && initialData?.relevance === level) return null
                const pct = count / limit
                if (pct < 0.75) return null
                const isFull = count >= limit
                return (
                  <p className={`text-xs mt-1 font-medium ${isFull ? 'text-red-500' : 'text-amber-500'}`}>
                    {isFull
                      ? `⚠ Nivel lleno (${count}/${limit}). Al guardar, el más antiguo bajará al siguiente nivel.`
                      : `Casi lleno: ${count}/${limit} artículos en este nivel.`}
                  </p>
                )
              })()}
            </div>
          </div>
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
          <div className="flex flex-wrap gap-1.5 mb-3">
            {availableTags.map((tag) => (
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
          <div className="flex gap-1.5 pt-2 border-t border-[var(--color-border)]">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
              placeholder="Nuevo tag..."
              maxLength={40}
              className="flex-1 px-2.5 py-1 text-xs border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] focus:outline-none focus:ring-1 focus:ring-primary/30 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
            />
            <button
              type="button"
              onClick={handleAddTag}
              disabled={newTagLoading || newTagName.trim().length < 2}
              className="px-2.5 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-40"
            >
              {newTagLoading ? '...' : '+ Agregar'}
            </button>
          </div>
        </SidebarCard>

        {showSeoModal && <SeoHelpModal onClose={() => setShowSeoModal(false)} />}

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
      </div>}

      {/* Sticky bottom actions — oculto en focus mode */}
      <div className={`${focusMode ? 'hidden' : 'lg:col-span-3'} sticky bottom-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] flex items-center justify-between px-4 py-3 z-10`}>
        <button
          onClick={handleBack}
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
  tooltip,
}: {
  onClick: () => void
  active: boolean
  label?: string
  icon?: React.ReactNode
  tooltip?: string
}) {
  return (
    <div className="relative group/tb">
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
      {tooltip && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50
          opacity-0 group-hover/tb:opacity-100 transition-opacity duration-150">
          <div className="bg-gray-900 text-white text-[11px] px-2 py-1 rounded whitespace-nowrap">
            {tooltip}
          </div>
          <div className="mx-auto w-0 h-0 border-l-4 border-r-4 border-t-4
            border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  )
}
