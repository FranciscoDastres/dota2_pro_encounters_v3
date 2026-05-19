interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div
      role="alert"
      className="animate-fade-up mx-auto max-w-md rounded-xl border border-dota-red/30 bg-dota-red/5 px-6 py-8 text-center"
    >
      {/* Icon */}
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-dota-red/40 bg-dota-red/10 text-xl">
        ⚠
      </div>

      <p className="mb-1 font-semibold text-white">Something went wrong</p>
      <p className="text-sm text-gray-400">{message}</p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 rounded-lg border border-dota-border px-5 py-2 text-sm text-gray-300 transition-all hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-dota-border cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  )
}
