'use client'

import { useState } from 'react'
import type { Tag } from '@/lib/api'
import { submitArticle, checkTagExists, subscribeNewsletter } from '@/lib/api'
import { CheckCircle, Plus, Check, X, Loader2, Clock, Mail } from 'lucide-react'
import ImageUploader from '@/components/ui/ImageUploader'

interface ArticleSubmitFormProps {
  tags: Tag[]
}

export default function ArticleSubmitForm({ tags }: ArticleSubmitFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailSubmitted, setEmailSubmitted] = useState(false)
  const [emailError, setEmailError] = useState('')

  const [form, setForm] = useState({
    title: '',
    authorName: '',
    authorEmail: '',
    authorPhone: '',
    authorInstagram: '',
    featuredImage: '',
    content: '',
    excerpt: '',
    tagIds: [] as string[],
    sources: [] as { title: string; url: string }[],
  })

  const [suggestedSpecialties, setSuggestedSpecialties] = useState<string[]>([])
  const [showNewTagInput, setShowNewTagInput] = useState(false)
  const [newTagInput, setNewTagInput] = useState('')
  const [newTagChecking, setNewTagChecking] = useState(false)
  const [tagFeedback, setTagFeedback] = useState<{ type: 'info' | 'success'; text: string } | null>(null)

  const handleTagToggle = (id: string) => {
    setForm((prev) => ({
      ...prev,
      tagIds: prev.tagIds.includes(id)
        ? prev.tagIds.filter((t) => t !== id)
        : [...prev.tagIds, id],
    }))
  }

  const handleAddNewSpecialty = async () => {
    const raw = newTagInput.trim()
    if (!raw) return

    const normalized = raw.charAt(0).toUpperCase() + raw.slice(1)

    setNewTagChecking(true)
    try {
      const result = await checkTagExists(normalized)
      if (result.exists && result.tag) {
        if (!form.tagIds.includes(result.tag.id)) {
          handleTagToggle(result.tag.id)
        }
        const diffAccent = result.tag.name.toLowerCase() !== normalized.toLowerCase()
        setTagFeedback({
          type: 'info',
          text: diffAccent
            ? `¿Quisiste decir "${result.tag.name}"? Ya existe y fue seleccionada.`
            : `"${result.tag.name}" ya existe y fue seleccionada automáticamente.`,
        })
      } else {
        if (!suggestedSpecialties.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
          setSuggestedSpecialties((prev) => [...prev, normalized])
          setTagFeedback({ type: 'success', text: `"${normalized}" será revisada por nuestro equipo.` })
        }
      }
    } catch {
      if (!suggestedSpecialties.some((s) => s.toLowerCase() === normalized.toLowerCase())) {
        setSuggestedSpecialties((prev) => [...prev, normalized])
      }
    } finally {
      setNewTagChecking(false)
      setShowNewTagInput(false)
      setNewTagInput('')
      setTimeout(() => setTagFeedback(null), 3500)
    }
  }

  const removeSuggestedSpecialty = (name: string) => {
    setSuggestedSpecialties((prev) => prev.filter((s) => s !== name))
  }

  const addSource = () => {
    setForm((prev) => ({
      ...prev,
      sources: [...prev.sources, { title: '', url: '' }],
    }))
  }

  const updateSource = (i: number, field: 'title' | 'url', value: string) => {
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)),
    }))
  }

  const removeSource = (i: number) => {
    setForm((prev) => ({
      ...prev,
      sources: prev.sources.filter((_, idx) => idx !== i),
    }))
  }

  /**
   * Convierte texto plano del textarea a HTML compatible con TipTap.
   * Párrafos separados por línea en blanco → <p>...</p>
   * Saltos de línea simples → <br> dentro del párrafo
   */
  const plainToHtml = (text: string): string =>
    text
      .split(/\n{2,}/)
      .map((block) => block.trim())
      .filter(Boolean)
      .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
      .join('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await submitArticle({
        title: form.title,
        authorName: form.authorName,
        authorEmail: form.authorEmail || undefined,
        authorPhone: form.authorPhone || undefined,
        authorInstagram: form.authorInstagram || undefined,
        featuredImage: form.featuredImage || undefined,
        content: plainToHtml(form.content),
        excerpt: form.excerpt || undefined,
        tagIds: form.tagIds.length > 0 ? form.tagIds : undefined,
        suggestedSpecialties: suggestedSpecialties.length > 0 ? suggestedSpecialties : undefined,
        sources: form.sources.filter((s) => s.title).map((s, i) => ({ ...s, order: i })),
      })
      // Si dejó email, lo damos por avisado en el paso post-envío
      if (form.authorEmail) setEmailInput(form.authorEmail)
      setSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al enviar. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emailInput.trim()) return
    setEmailLoading(true)
    setEmailError('')
    try {
      await subscribeNewsletter(emailInput.trim(), form.authorName || undefined)
      setEmailSubmitted(true)
    } catch {
      setEmailError('No se pudo registrar el email. Intentá de nuevo.')
    } finally {
      setEmailLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="py-12 space-y-8 max-w-md mx-auto">
        {/* Confirmación */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-4">
            <CheckCircle className="text-[var(--color-primary)]" size={36} strokeWidth={1.5} />
          </div>
          <h2 className="font-display font-bold text-2xl text-[var(--color-text-primary)] mb-2">
            ¡Artículo enviado!
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            Tu artículo fue enviado exitosamente. Nuestro equipo editorial lo revisará en los próximos 3-5 días hábiles.
          </p>
        </div>

        {/* Captura de email */}
        <div className="border border-[var(--color-border)] rounded-xl p-6 bg-[var(--color-surface-2)]">
          {emailSubmitted ? (
            <div className="flex items-center gap-3 text-[var(--color-primary)]">
              <Check size={20} strokeWidth={2} />
              <p className="text-sm font-medium">
                Te notificaremos a <span className="font-semibold">{emailInput}</span> cuando tu artículo sea publicado.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Mail size={18} strokeWidth={1.5} className="text-[var(--color-primary)]" />
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  ¿Quieres saber cuándo se publique tu artículo?
                </p>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                Ingresa tu email y te avisamos cuando sea aprobado y publicado.
              </p>
              <form onSubmit={handleEmailSubmit} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="tu@email.com"
                  className="flex-1 px-3 py-2 text-sm border border-[var(--color-border)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="px-4 py-2 bg-[var(--color-primary)] text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-primary-dark,#085f3a)] transition-colors disabled:opacity-60 shrink-0"
                >
                  {emailLoading ? <Loader2 size={15} className="animate-spin" /> : 'Notificarme'}
                </button>
              </form>
              {emailError && <p className="text-xs text-red-500 mt-2">{emailError}</p>}
            </>
          )}
        </div>
      </div>
    )
  }

  const inputClass =
    'w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-navy)]/30 bg-[var(--color-surface)] text-[var(--color-text-primary)]'
  const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Título */}
      <div>
        <label className={labelClass}>Título *</label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
          className={inputClass}
          placeholder="Título claro y descriptivo del artículo"
        />
      </div>

      {/* Autor */}
      <div>
        <label className={labelClass}>Nombre del autor *</label>
        <input
          type="text"
          required
          value={form.authorName}
          onChange={(e) => setForm((p) => ({ ...p, authorName: e.target.value }))}
          className={inputClass}
          placeholder="Dr. Juan Pérez"
        />
      </div>

      {/* Datos de contacto (uso interno del equipo editorial) */}
      <div className="space-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            value={form.authorEmail}
            onChange={(e) => setForm((p) => ({ ...p, authorEmail: e.target.value }))}
            className={inputClass}
            placeholder="tu@email.com"
          />
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Te avisamos a este correo cuando tu artículo sea aprobado y publicado.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Teléfono de contacto</label>
            <input
              type="tel"
              value={form.authorPhone}
              onChange={(e) => setForm((p) => ({ ...p, authorPhone: e.target.value }))}
              className={inputClass}
              placeholder="(809) 000-0000"
            />
          </div>
          <div>
            <label className={labelClass}>Instagram (opcional)</label>
            <input
              type="text"
              value={form.authorInstagram}
              onChange={(e) => setForm((p) => ({ ...p, authorInstagram: e.target.value }))}
              className={inputClass}
              placeholder="@usuario"
            />
          </div>
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          El teléfono y el Instagram son solo para que nuestro equipo editorial pueda contactarte — no se publican.
        </p>
      </div>

      {/* Resumen */}
      <div>
        <label className={labelClass}>Resumen (opcional)</label>
        <textarea
          rows={3}
          value={form.excerpt}
          onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
          className={inputClass}
          placeholder="Breve descripción del artículo..."
        />
      </div>

      {/* Contenido */}
      <div>
        <label className={labelClass}>Contenido *</label>
        <textarea
          required
          rows={12}
          value={form.content}
          onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))}
          className={inputClass}
          placeholder="Escribe aquí el contenido de tu artículo..."
        />
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Separa los párrafos con una línea en blanco (Enter dos veces). El formato se preservará al revisarlo.
        </p>
      </div>

      {/* Especialidades relacionadas */}
      <div>
        <label className={labelClass}>Especialidades relacionadas</label>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleTagToggle(tag.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                form.tagIds.includes(tag.id)
                  ? 'bg-[var(--brand-navy)] text-white border-[var(--brand-navy)]'
                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)]'
              }`}
            >
              {tag.name}
            </button>
          ))}

          {suggestedSpecialties.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-300"
            >
              <Clock size={10} strokeWidth={2} />
              {name}
              <button
                type="button"
                onClick={() => removeSuggestedSpecialty(name)}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label={`Quitar ${name}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}

          {showNewTagInput ? (
            <div className="inline-flex items-center gap-1.5 border border-[var(--brand-navy)] rounded-full px-2.5 py-1 bg-[var(--color-surface)]">
              <input
                type="text"
                autoFocus
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddNewSpecialty()
                  }
                  if (e.key === 'Escape') {
                    setShowNewTagInput(false)
                    setNewTagInput('')
                  }
                }}
                className="text-xs bg-transparent outline-none w-32 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]"
                placeholder="Nueva especialidad..."
              />
              {newTagChecking ? (
                <Loader2 size={12} strokeWidth={2} className="animate-spin text-[var(--color-text-muted)]" />
              ) : (
                <button
                  type="button"
                  onClick={handleAddNewSpecialty}
                  className="text-[var(--brand-navy)] hover:opacity-70 transition-opacity"
                  aria-label="Confirmar especialidad"
                >
                  <Check size={12} strokeWidth={2.5} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowNewTagInput(false); setNewTagInput('') }}
                className="text-[var(--color-text-muted)] hover:opacity-70 transition-opacity"
                aria-label="Cancelar"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowNewTagInput(true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--brand-navy)] hover:text-[var(--brand-navy)] transition-colors"
            >
              <Plus size={12} strokeWidth={2} />
              Otra
            </button>
          )}
        </div>

        {tagFeedback && (
          <p
            className={`text-xs mt-1.5 ${
              tagFeedback.type === 'info'
                ? 'text-[var(--brand-electric)]'
                : 'text-[var(--color-success)]'
            }`}
          >
            {tagFeedback.text}
          </p>
        )}

        {suggestedSpecialties.length > 0 && !tagFeedback && (
          <p className="text-xs text-amber-600 mt-1.5">
            Las especialidades en amarillo no existen aún — serán revisadas por nuestro equipo editorial.
          </p>
        )}
      </div>

      {/* Imagen del artículo */}
      <ImageUploader
        value={form.featuredImage}
        onChange={(url) => setForm((p) => ({ ...p, featuredImage: url }))}
        label="Imagen del artículo (opcional)"
      />

      {/* Fuentes */}
      <div>
        <label className={labelClass}>Fuentes científicas</label>
        <div className="space-y-2 mb-2">
          {form.sources.map((source, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                placeholder="Título de la fuente"
                value={source.title}
                onChange={(e) => updateSource(i, 'title', e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <input
                type="url"
                placeholder="URL (opcional)"
                value={source.url}
                onChange={(e) => updateSource(i, 'url', e.target.value)}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={() => removeSource(i)}
                className="px-2 text-[var(--color-text-muted)] hover:text-[var(--color-breaking)] transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addSource}
          className="text-sm text-[var(--brand-navy)] hover:underline"
        >
          + Agregar fuente
        </button>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-breaking)] bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[var(--brand-gold)] text-[var(--brand-navy)] font-body font-semibold py-3 rounded-lg hover:bg-[var(--brand-gold-light)] transition-colors disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Enviar artículo para revisión'}
        </button>
      </div>
    </form>
  )
}
