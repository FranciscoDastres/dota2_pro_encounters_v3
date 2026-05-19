export function LoadingSpinner() {
  return (
    <div
      className="flex flex-col items-center justify-center gap-5 py-20"
      role="status"
      aria-label="Loading results"
    >
      {/* Outer ring */}
      <div className="relative h-14 w-14">
        <div className="absolute inset-0 rounded-full border-4 border-dota-border" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-dota-gold" />
        {/* Inner dot */}
        <div className="absolute inset-3 rounded-full bg-dota-gold/10" />
      </div>

      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">Querying OpenDota…</p>
        <p className="mt-1 text-xs text-gray-600">This may take a few seconds</p>
      </div>
    </div>
  )
}
