'use client'

import { X } from 'lucide-react'

export default function SeoHelpModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--color-border)]">
          <h2 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
            ¿Cómo mejorar el SEO de tu artículo?
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">

          {/* Tip 1 — Longitud del título */}
          <Tip number={1} label="Longitud del título" title="El título no debe ser muy largo">
            <div className="flex gap-4 mt-2">
              <span className="text-green-600 dark:text-green-400 font-medium">✔ Ideal: 40–60 caracteres</span>
              <span className="text-red-500 font-medium">✗ Más de 60 = Google lo corta</span>
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Este indicador evalúa el <strong>Meta título</strong> si lo escribiste, o el título del artículo si lo dejaste vacío.
            </p>
          </Tip>

          {/* Tip 2 — Keywords en meta */}
          <Tip number={2} label="Keywords en meta" title="Usa palabras que la gente realmente busca">
            <p>Un buen título médico combina:</p>
            <ul className="mt-2 space-y-1 list-none">
              <li>🦟 <strong>Enfermedad o tema</strong> — dengue, diabetes, cáncer</li>
              <li>🔍 <strong>Acción</strong> — síntomas, tratamiento, prevención</li>
              <li>📍 <strong>Lugar</strong> — RD, Santo Domingo, hospitales</li>
            </ul>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              El sistema extrae las palabras clave del artículo y verifica que aparezcan en el título SEO o la descripción SEO.
            </p>
          </Tip>

          {/* Tip 3 — Título vs contenido */}
          <Tip number={3} label="Título vs contenido" title="El título debe reflejar el artículo">
            <p>Si el título habla de dengue pero el artículo desarrolla otro tema, Google lo detecta.</p>
            <p className="mt-2">En vez de un título genérico:</p>
            <Bad>"Avances en políticas sanitarias"</Bad>
            <p className="mt-2">Usa uno que describa el contenido real:</p>
            <Good>"Nuevas medidas de prevención contra el dengue en RD 2025"</Good>
          </Tip>

          {/* Tip 4 — Meta descripción */}
          <Tip number={4} label="Meta descripción" title="La descripción debe explicar el contenido">
            <p>No escribas:</p>
            <Bad>"Todo lo que debes saber"</Bad>
            <p className="mt-2">Mejor:</p>
            <Good>"Síntomas, tratamiento y prevención del dengue en RD para 2025"</Good>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Apunta a 80–155 caracteres. Si lo dejas vacío, se usa el resumen del artículo automáticamente.
            </p>
          </Tip>

          {/* Tip 5 — Frases vagas */}
          <Tip number={5} label="Frases vagas" title="Evita frases que no dicen nada">
            <p>Estas frases aparecen cuando el título es inespecífico:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['"todo lo que"', '"lo que debes saber"', '"importante"', '"gran"', '"avances en"'].map((f) => (
                <span key={f} className="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded text-red-600 dark:text-red-400">
                  {f}
                </span>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              Este indicador solo aparece si el sistema detecta una de estas frases en el título.
            </p>
          </Tip>

          <div className="bg-[var(--color-surface-2)] rounded-xl p-4 border border-[var(--color-border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)] mb-2">
              Regla de oro
            </p>
            <p className="text-[var(--color-text-primary)]">
              Escribe primero para el lector. Luego revisa si Google va a entender de qué trata.
              Si el título lo dice todo en pocas palabras, ya es buen SEO.
            </p>
          </div>
        </div>

        <div className="p-5 border-t border-[var(--color-border)]">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium bg-primary text-white rounded-lg hover:bg-primary-light transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  )
}

function Tip({ number, label, title, children }: { number: number; label: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-start gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
          {number}
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-muted)] leading-none mb-0.5">{label}</p>
          <p className="font-semibold text-[var(--color-text-primary)]">{title}</p>
        </div>
      </div>
      <div className="pl-7">{children}</div>
    </div>
  )
}

function Bad({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-xs">
      {children}
    </div>
  )
}

function Good({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-1 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-xs">
      {children}
    </div>
  )
}
