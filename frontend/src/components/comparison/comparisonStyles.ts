export function metricTone(metricKey: string, ratio: number, threshold = 0.8): string {
  if (ratio < threshold) return 'border-rose-300/30 bg-rose-400/10 text-rose-100'
  if (metricKey === 'gold_per_min') return 'border-emerald-300/25 bg-emerald-400/10 text-emerald-100'
  if (metricKey === 'last_hits_per_10') return 'border-cyan-300/25 bg-cyan-400/10 text-cyan-100'
  if (
    metricKey === 'assists' ||
    metricKey === 'observer_wards_placed' ||
    metricKey === 'sentry_wards_placed'
  ) {
    return 'border-purple-300/25 bg-purple-400/10 text-purple-100'
  }
  return 'border-white/10 bg-white/[0.03] text-slate-100'
}

export function getRoleTheme(position: number) {
  if (position >= 4) {
    return {
      textClass: 'text-purple-300/70',
      borderClass: 'border-purple-300/20 bg-purple-400/10',
      iconColor: 'text-purple-100',
      shellClass: 'border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)] bg-[#0b0f19]',
      glowColor: '#a855f7',
    }
  }
  return {
    textClass: 'text-cyan-300/70',
    borderClass: 'border-cyan-300/20 bg-cyan-400/10',
    iconColor: 'text-cyan-100',
    shellClass: 'carry-neon-shell bg-[#070b12]',
    glowColor: '#34d399',
  }
}
