export default function MedicalArticleLoading() {
  return (
    <div className="max-w-article mx-auto px-4 py-8">
      {/* Tags */}
      <div className="flex gap-2 mb-4">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>

      {/* Título */}
      <div className="skeleton h-10 w-full rounded mb-2" />
      <div className="skeleton h-10 w-3/4 rounded mb-6" />

      {/* Autor y meta */}
      <div className="flex items-center gap-3 mb-6">
        <div className="skeleton w-10 h-10 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-24 rounded" />
        </div>
      </div>

      {/* Imagen */}
      <div className="skeleton aspect-video w-full rounded-xl mb-8" />

      {/* Contenido */}
      <div className="space-y-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="skeleton h-4 rounded"
            style={{ width: i % 4 === 3 ? '60%' : '100%' }}
          />
        ))}
      </div>
    </div>
  )
}
