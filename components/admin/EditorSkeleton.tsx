export function EditorSkeleton() {
  return (
    <div
      className="border rounded-lg overflow-hidden animate-pulse"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {/* Barra de herramientas */}
      <div
        className="flex gap-1 p-2 border-b"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface-2)',
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded"
            style={{ background: 'var(--color-border)' }}
          />
        ))}
      </div>

      {/* Área de contenido */}
      <div className="p-4 min-h-[400px]" style={{ background: 'var(--color-surface)' }}>
        <div className="h-4 rounded mb-3 w-3/4" style={{ background: 'var(--color-border)' }} />
        <div className="h-4 rounded mb-3 w-full" style={{ background: 'var(--color-border)' }} />
        <div className="h-4 rounded mb-3 w-5/6" style={{ background: 'var(--color-border)' }} />
        <div className="h-4 rounded mb-6 w-2/3" style={{ background: 'var(--color-border)' }} />
        <div className="h-4 rounded mb-3 w-full" style={{ background: 'var(--color-border)' }} />
        <div className="h-4 rounded w-4/5" style={{ background: 'var(--color-border)' }} />
      </div>
    </div>
  )
}
