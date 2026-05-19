import { useState, type FormEvent } from 'react'

interface SearchFormProps {
  onSearch: (accountId: string) => void
  loading: boolean
  initialValue?: string
}

export function SearchForm({ onSearch, loading, initialValue = '' }: SearchFormProps) {
  const [value, setValue] = useState(initialValue)
  const [validationError, setValidationError] = useState('')

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = value.trim()

    if (!trimmed) {
      setValidationError('Enter your Account ID')
      return
    }
    if (!/^\d+$/.test(trimmed)) {
      setValidationError('Account ID must contain numbers only')
      return
    }

    setValidationError('')
    onSearch(trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg" noValidate>
      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="account-id" className="sr-only">
            Dota 2 Account ID
          </label>
          <input
            id="account-id"
            type="text"
            inputMode="numeric"
            maxLength={10}
            placeholder="Account ID (e.g., 123456789)"
            value={value}
            onChange={(e) => {
              setValue(e.target.value)
              if (validationError) setValidationError('')
            }}
            disabled={loading}
            aria-describedby={validationError ? 'account-id-error' : undefined}
            aria-invalid={Boolean(validationError)}
            className={[
              'w-full rounded-lg border bg-dota-surface px-4 py-3 text-white',
              'placeholder-gray-600 outline-none transition-all duration-200',
              'focus:border-dota-gold focus:ring-2 focus:ring-dota-gold/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              validationError ? 'border-red-500' : 'border-dota-border',
            ].join(' ')}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={[
            'rounded-lg px-7 py-3 font-semibold transition-all duration-200',
            'bg-dota-red text-white hover:bg-dota-red-dark',
            'focus:outline-none focus:ring-2 focus:ring-dota-red/50',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'active:scale-95 cursor-pointer whitespace-nowrap',
          ].join(' ')}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Searching…
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {validationError && (
        <p id="account-id-error" role="alert" className="mt-2 text-sm text-red-400">
          {validationError}
        </p>
      )}
    </form>
  )
}
