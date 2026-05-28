import type { ReactNode } from 'react'

interface ItemHoverCardProps {
  itemName: string
  description: string | null | undefined
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
  metaLines?: string[]
}

export function ItemHoverCard({
  itemName,
  description,
  children,
  align = 'left',
  className = '',
  metaLines = [],
}: ItemHoverCardProps) {
  const details = (description
    ?.split('\n') ?? [])
    .map((line) => line.trim())
    .filter(Boolean)
  const tooltipLines = [...metaLines, ...details]

  return (
    <div
      className={`group/item relative focus:outline-none ${className}`}
      tabIndex={0}
      aria-label={tooltipLines.length ? `${itemName}: ${tooltipLines.join(' ')}` : itemName}
    >
      {children}
      {tooltipLines.length ? (
        <div
          role="tooltip"
          className={[
            'pointer-events-none absolute top-full z-40 mt-2 w-72 max-w-[calc(100vw-2rem)] translate-y-1 rounded-md border border-cyan-300/20 bg-[#07101d]/95 p-3 text-left opacity-0 shadow-2xl shadow-cyan-950/50 ring-1 ring-white/10 backdrop-blur transition duration-150',
            'group-hover/item:translate-y-0 group-hover/item:opacity-100 group-focus/item:translate-y-0 group-focus/item:opacity-100',
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
        >
          <p className="text-xs font-semibold text-white">{itemName}</p>
          {metaLines.length > 0 ? (
            <div className="mt-2 space-y-1 text-[11px] leading-4 text-cyan-100">
              {metaLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          ) : null}
          <div className="mt-2 space-y-1.5 text-[11px] leading-5 text-slate-300">
            {details.slice(0, 4).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
