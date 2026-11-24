export function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center w-full py-16">
      <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin text-accent" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

export function InlineSpinner() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" className="animate-spin" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3"/>
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}
