import { useCallback, useEffect, useState } from 'react'
import { useProEncounters } from './hooks/useProEncounters'
import { useOnlineStatus } from './hooks/useOnlineStatus'
import { useSearchHistory } from './hooks/useSearchHistory'
import { SearchForm } from './components/SearchForm'
import { ErrorMessage } from './components/ErrorMessage'
import { EmptyState } from './components/EmptyState'
import { ProEncounterTable } from './components/ProEncounterTable'
import { PlayerProfile } from './components/PlayerProfile'
import { Footer } from './components/Footer'
import { KofiWidget } from './components/KofiWidget'
import { OfflineBanner } from './components/OfflineBanner'
import { HeroBackground } from './components/HeroBackground'

function App() {
  const { data, status, error, search, reset } = useProEncounters()
  const isOnline = useOnlineStatus()
  const { history, add: addToHistory, remove: removeFromHistory } = useSearchHistory()
  const initialAccountId = new URLSearchParams(window.location.search).get('account') ?? ''
  const [activeAccountId, setActiveAccountId] = useState<number | null>(
    initialAccountId ? Number(initialAccountId) : null
  )

  useEffect(() => {
    if (initialAccountId) addToHistory(initialAccountId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback((accountId: string) => {
    addToHistory(accountId)
    setActiveAccountId(Number(accountId))
    search(accountId)
  }, [addToHistory, search])

  return (
    <div className="min-h-screen bg-dota-dark text-white flex flex-col">
      {!isOnline && <OfflineBanner />}

      {/* ── Hero ─────────────────────────────────────────── */}
      <header className="relative overflow-hidden py-20 px-4 text-center">
        {/* Hero lineup background */}
        <HeroBackground />

        {/* Background glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[640px] -translate-x-1/2 rounded-full bg-dota-gold/8 blur-[100px] animate-glow" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-px w-3/4 -translate-x-1/2 bg-gradient-to-r from-transparent via-dota-border to-transparent" />

        <div className="relative mx-auto max-w-3xl">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-dota-gold/70">
            OpenDota API
          </p>

          <h1 className="mb-5 text-5xl font-bold leading-tight md:text-6xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            <span className="bg-gradient-to-r from-dota-gold to-dota-gold-light bg-clip-text text-transparent">
              Stomp
            </span>
            <span className="text-white">Tracker</span>
          </h1>

          <p className="mx-auto mb-8 max-w-xl text-lg text-gray-400">
            Enter your{' '}
            <strong className="font-semibold text-white">Account ID</strong> and discover
            if you ever shared a match with professional Dota 2 players.
          </p>

          <div className="flex justify-center">
            <SearchForm onSearch={handleSearch} loading={status === 'loading'} initialValue={initialAccountId} />
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-gray-600">
              Don't know your Account ID? Find yourself on{' '}
              <a
                href="https://www.opendota.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 underline-offset-2 hover:text-dota-gold hover:underline transition-colors"
              >
                opendota.com
              </a>
              — it appears in your profile URL.
            </p>

            <button
              onClick={() => handleSearch('107588898')}
              disabled={status === 'loading'}
              className="text-xs text-dota-gold/60 underline-offset-2 hover:text-dota-gold hover:underline transition-colors disabled:pointer-events-none disabled:opacity-40"
            >
              or try with an example account
            </button>

            {history.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-xs text-gray-700">Recent:</span>
                {history.map(id => (
                  <div
                    key={id}
                    className="flex min-h-[32px] min-w-[64px] items-center gap-1.5 rounded-full border border-dota-border px-2.5 py-0.5 text-xs transition-all hover:border-dota-gold/40"
                  >
                    <button
                      onClick={() => handleSearch(id)}
                      disabled={status === 'loading'}
                      className="flex-1 font-mono text-gray-500 transition-colors hover:text-dota-gold disabled:pointer-events-none disabled:opacity-40"
                    >
                      {id}
                    </button>
                    <button
                      onClick={() => removeFromHistory(id)}
                      aria-label={`Remove ${id} from history`}
                      className="flex-shrink-0 text-xs leading-none text-gray-600 transition-colors hover:text-gray-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ── Results ──────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-12">
        {status === 'loading' && (
          <div>
            {activeAccountId != null && <PlayerProfile accountId={activeAccountId} />}
            <ProEncounterTable loading={true} />
          </div>
        )}

        {status === 'error' && error && (
          <ErrorMessage message={error} onRetry={reset} />
        )}

        {status === 'success' && data && (
          <div className="animate-fade-up">
            <PlayerProfile accountId={data.account_id} />

            {data.pros.length === 0
              ? <EmptyState accountId={data.account_id} />
              : <ProEncounterTable data={data} />
            }
          </div>
        )}
      </main>

      <Footer />
      <KofiWidget />
    </div>
  )
}

export default App
