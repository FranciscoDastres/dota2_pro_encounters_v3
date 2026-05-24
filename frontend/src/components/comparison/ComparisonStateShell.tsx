export function ComparisonLoadingShell() {
  return (
    <section className="carry-neon-shell overflow-hidden rounded-lg">
      <div className="border-b border-white/10 bg-white/[0.02] p-4 sm:p-5">
        <div className="mb-4 h-5 w-52 animate-pulse rounded bg-cyan-300/20" />
        <div className="h-28 animate-pulse rounded-xl bg-white/5" />
      </div>
      <div className="p-4 sm:p-5">
        <div className="space-y-2">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-12 animate-pulse rounded bg-white/5" />
          ))}
        </div>
      </div>
    </section>
  )
}

export function ComparisonErrorShell({ error }: { error: string }) {
  return (
    <section className="carry-neon-shell rounded-lg p-4">
      <p className="text-sm text-rose-200">{error}</p>
    </section>
  )
}
