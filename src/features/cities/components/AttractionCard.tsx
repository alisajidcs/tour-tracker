import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import type { Database } from '@/types/database'
import { googleMapsSearchUrl } from '@/features/cities/maps'
import { rememberChecklistPosition } from '@/features/cities/guideNavigation'

type Attraction = Database['public']['Tables']['attractions']['Row']

type AttractionCardProps = {
  attraction: Attraction
  visited: boolean
  cityName?: string
  disabled?: boolean
  error?: string
  onRetry?: () => void
  onVisitedChange: (visited: boolean) => void
}

export function AttractionCard({
  attraction,
  visited,
  cityName = '',
  disabled = false,
  error,
  onRetry,
  onVisitedChange,
}: AttractionCardProps) {
  const location = useLocation()
  const placeUrl = `/cities/${attraction.city_id}/places/${attraction.id}`
  const placeId = `place-${attraction.id}`

  return (
    <article
      id={placeId}
      className="border-guide-line bg-guide-surface flex min-w-0 scroll-mt-4 flex-col overflow-hidden rounded-2xl border"
    >
      <Link
        to={placeUrl}
        state={{ fromChecklist: true }}
        id={`${placeId}-link`}
        aria-label={`View ${attraction.name}`}
        onClick={(event) => {
          if (
            !event.metaKey &&
            !event.ctrlKey &&
            !event.shiftKey &&
            !event.altKey
          ) {
            rememberChecklistPosition(location.key, placeId)
          }
        }}
        className="group block outline-offset-[-4px]"
      >
        <ImageWithFallback
          src={attraction.image_url}
          alt={`View of ${attraction.name}`}
          className="aspect-[2/1]"
        />
        <div className="flex min-h-11 items-baseline gap-3 px-4 pt-4 sm:px-5">
          <span
            className="text-guide-accent shrink-0 text-sm font-semibold tabular-nums"
            aria-label={`Recommended position ${attraction.sort_order}`}
          >
            {String(attraction.sort_order).padStart(2, '0')}
          </span>
          <h3 className="min-w-0 text-xl leading-tight font-semibold tracking-tight break-words group-hover:underline">
            {attraction.name}
          </h3>
          <ArrowUpRight
            aria-hidden="true"
            size={16}
            className="text-guide-accent ml-auto shrink-0"
          />
        </div>
      </Link>
      <p className="text-guide-muted mt-2 line-clamp-3 px-4 text-sm leading-6 sm:px-5">
        {attraction.description}
      </p>
      {error ? (
        <div
          role="alert"
          className="mx-4 mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-900 sm:mx-5"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 font-semibold underline"
          >
            Try again
          </button>
        </div>
      ) : null}
      <div className="mt-auto px-4 pt-4 pb-4 sm:px-5">
        <div className="border-guide-line flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t pt-3">
          <label className="guide-control cursor-pointer gap-2">
            <input
              type="checkbox"
              id={`visit-${attraction.id}`}
              aria-label={`${visited ? 'Visited' : 'Mark visited'}: ${attraction.name}`}
              checked={visited}
              aria-disabled={disabled || undefined}
              onClick={(event) => {
                if (disabled) event.preventDefault()
              }}
              onChange={(event) => {
                if (!disabled) onVisitedChange(event.currentTarget.checked)
              }}
              className="accent-guide-accent size-4"
            />
            {visited ? 'Visited' : 'Mark visited'}
          </label>
          <a
            href={googleMapsSearchUrl(attraction.name, cityName)}
            target="_blank"
            rel="noreferrer"
            className="guide-text-link"
          >
            <MapPin aria-hidden="true" size={16} /> Open in Maps
          </a>
        </div>
      </div>
    </article>
  )
}
