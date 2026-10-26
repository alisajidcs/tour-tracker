import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'

type ImageWithFallbackProps = {
  src: string
  alt: string
  className?: string
  imageClassName?: string
  loading?: 'eager' | 'lazy'
}

export function ImageWithFallback({
  src,
  alt,
  className,
  imageClassName,
  loading = 'lazy',
}: ImageWithFallbackProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const failed = failedSrc === src

  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-100 via-stone-100 to-amber-50 text-emerald-900/50',
        className,
      )}
    >
      {failed || !src ? (
        <div
          className="flex flex-col items-center gap-2 p-4 text-center"
          role="img"
          aria-label={`${alt} image unavailable`}
        >
          <ImageOff aria-hidden="true" size={25} />
          <span className="text-xs">Image unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onError={() => setFailedSrc(src)}
          className={cn(
            'absolute inset-0 size-full object-cover',
            imageClassName,
          )}
        />
      )}
    </div>
  )
}
