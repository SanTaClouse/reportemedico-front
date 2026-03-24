import SkeletonCard from '@/components/ui/SkeletonCard'

export default function Loading() {
  return (
    <div>
      {/* Hero skeleton */}
      <div className="skeleton w-full h-[520px] md:h-[600px]" />

      <div className="max-w-site mx-auto px-4 md:px-6 py-10 space-y-14">
        {/* Featured grid skeleton */}
        <div>
          <div className="skeleton h-7 w-36 mb-6 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-6">
            <div className="md:row-span-2 h-full">
              <SkeletonCard variant="lead" />
            </div>
            <SkeletonCard variant="principal" />
            <SkeletonCard variant="principal" />
          </div>
        </div>

        {/* Latest news skeleton */}
        <div>
          <div className="skeleton h-7 w-44 mb-6 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} variant="compacta" />
            ))}
          </div>
        </div>

        {/* Medical articles skeleton */}
        <div>
          <div className="skeleton h-7 w-48 mb-6 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SkeletonCard variant="principal" />
            <SkeletonCard variant="principal" />
            <SkeletonCard variant="principal" />
          </div>
        </div>
      </div>
    </div>
  )
}
