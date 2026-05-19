interface EmptyStateProps {
  accountId: number
}

export function EmptyState({ accountId }: EmptyStateProps) {
  return (
    <div className="animate-fade-up mx-auto max-w-md py-16 text-center">
      {/* Icon */}
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-dota-border bg-dota-surface text-3xl">
        🛡️
      </div>

      <h2 className="mb-2 text-xl font-semibold text-white">
        No pro encounters found
      </h2>

      <p className="mb-1 text-gray-400">
        No matches against professional players found for account{' '}
        <span className="font-mono text-dota-gold">#{accountId}</span>.
      </p>

      <p className="text-sm text-gray-600">
        This may be due to a private profile or no public match history.
      </p>
    </div>
  )
}
