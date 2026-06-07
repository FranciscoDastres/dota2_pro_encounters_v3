export function BenchmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 7v6c0 5 3.4 8.7 8 9 4.6-.3 8-4 8-9V7l-8-5Z" />
      <path d="M8 11h8" />
      <path d="M9.5 14.5 11 16l3.5-4" />
    </svg>
  )
}

export function GpmIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 19V5" />
      <path d="M5 19h14" />
      <path d="M8 15l3-4 3 2 4-6" />
    </svg>
  )
}

export function LastHitsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16" />
      <path d="M7 18V9" />
      <path d="M12 18V6" />
      <path d="M17 18v-7" />
    </svg>
  )
}

export function DamageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 3 14h7l-1 8 12-14h-7l-1-6Z" />
    </svg>
  )
}

export function TowerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 21h10" />
      <path d="M9 21V9l3-4 3 4v12" />
      <path d="M9 13h6" />
    </svg>
  )
}

export function AssistsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

export function WardsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  )
}

export function BootIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 4v9l4 2 1 3h8a2 2 0 0 0 0-4h-2l-1-2V4H6Z" />
    </svg>
  )
}

export function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 3h6v6" />
      <path d="m10 14 11-11" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  )
}

export function TimingIcon({ status }: { status: 'on_time' | 'late' | 'missing' | 'snapshot' }) {
  if (status === 'on_time') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    )
  }

  if (status === 'late') {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 8v5l4 2" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 8.5 7 7" />
      <path d="m15.5 8.5-7 7" />
    </svg>
  )
}

export function MetricIcon({ metricKey }: { metricKey: string }) {
  switch (metricKey) {
    case 'gold_per_min':
      return <GpmIcon />
    case 'xp_per_min':
      return <BenchmarkIcon />
    case 'last_hits_per_10':
      return <LastHitsIcon />
    case 'hero_damage':
      return <DamageIcon />
    case 'tower_damage':
      return <TowerIcon />
    case 'assists':
      return <AssistsIcon />
    case 'observer_wards_placed':
    case 'sentry_wards_placed':
      return <WardsIcon />
    default:
      return <BenchmarkIcon />
  }
}
