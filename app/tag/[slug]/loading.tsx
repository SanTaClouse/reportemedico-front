import SkeletonCard from '@/components/ui/SkeletonCard'

export default function TagLoading() {
  return (
    <div className="max-w-site mx-auto px-4 md:px-6 py-8">
      <div className="mb-8">
        <div className="skeleton h-7 w-24 rounded-full mb-3" />
        <div className="skeleton h-8 w-48 rounded mb-2" />
        <div className="skeleton h-1 w-12 rounded" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} variant="principal" />
        ))}
      </div>
    </div>
  )
}
