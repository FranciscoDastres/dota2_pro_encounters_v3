import { useState } from 'react'

interface Props {
  src: string | null | undefined
  alt: string
  fallback: string
  fallbackSrcs?: string[]
  className?: string
  imgClassName?: string
}

export function IconFrame({
  src,
  alt,
  fallback,
  fallbackSrcs = [],
  className = '',
  imgClassName = '',
}: Props) {
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(() => new Set())
  const sources = [src, ...fallbackSrcs]
    .filter((source): source is string => Boolean(source))
    .filter((source, index, allSources) => allSources.indexOf(source) === index)
  const currentSrc = sources.find((source) => !failedSrcs.has(source)) ?? null

  return (
    <div className={className}>
      {currentSrc ? (
        <img
          src={currentSrc}
          alt={alt}
          className={imgClassName}
          onError={() => setFailedSrcs((current) => new Set(current).add(currentSrc))}
          loading="eager"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-md border border-white/10 bg-black/35 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-300">
          {fallback}
        </div>
      )}
    </div>
  )
}
