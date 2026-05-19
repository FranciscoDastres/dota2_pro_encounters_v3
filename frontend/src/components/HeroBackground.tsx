// Hero lineup background using official Valve CDN assets
// Same source used by OpenDota, Dotabuff, and all major Dota 2 fan sites

const CDN = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/heroes'

// Iconic heroes recognizable even to non-players
const HEROES = [
  'crystal_maiden',
  'invoker',
  'juggernaut',
  'nevermore',
  'pudge',
  'lina',
  'earthshaker',
  'windrunner',
] as const

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Hero lineup */}
      <div className="absolute inset-0 flex items-end justify-center">
        {HEROES.map((hero) => (
          <img
            key={hero}
            src={`${CDN}/${hero}_full.png`}
            alt=""
            draggable={false}
            loading="lazy"
            className="h-[90%] w-auto object-contain object-bottom opacity-[0.13] grayscale-[30%]"
          />
        ))}
      </div>

      {/* Top fade — keeps header text readable */}
      <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-dota-dark to-transparent" />

      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-dota-dark to-transparent" />

      {/* Side vignettes */}
      <div className="absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-dota-dark to-transparent" />
      <div className="absolute inset-y-0 right-0 w-1/4 bg-gradient-to-l from-dota-dark to-transparent" />

      {/* Center darkening so the title text pops */}
      <div className="absolute inset-0 bg-dota-dark/55" />
    </div>
  )
}
