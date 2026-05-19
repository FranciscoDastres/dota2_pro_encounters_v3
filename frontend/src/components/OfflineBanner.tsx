export function OfflineBanner() {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed left-0 right-0 top-0 z-50 flex animate-slide-down items-center justify-center gap-2 bg-dota-red/90 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
    >
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      No internet connection — data may be unavailable
    </div>
  )
}
