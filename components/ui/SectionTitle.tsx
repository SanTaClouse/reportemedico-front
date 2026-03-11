interface SectionTitleProps {
  children: React.ReactNode
  className?: string
}

export default function SectionTitle({ children, className = '' }: SectionTitleProps) {
  return (
    <div className={`flex items-center gap-0 mb-6 ${className}`}>
      {/* Franja navy con título en gold — firma editorial */}
      <div className="bg-[var(--brand-navy)] px-4 py-1.5">
        <h2 className="font-body font-semibold text-xs uppercase tracking-widest text-[var(--brand-gold)]">
          {children}
        </h2>
      </div>
      <div className="flex-1 h-[2px] bg-[var(--brand-navy)]" />
    </div>
  )
}
