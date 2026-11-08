import { ArrowUpRight, Check, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import type { Database } from '@/types/database'
import { googleMapsSearchUrl } from '@/features/cities/maps'

type Attraction = Database['public']['Tables']['attractions']['Row']

type AttractionCardProps = {
  attraction: Attraction
  visited: boolean
  cityName?: string
  disabled?: boolean
  onVisitedChange: (visited: boolean) => void
}

export function AttractionCard({
  attraction,
  visited,
  cityName = '',
  disabled = false,
  onVisitedChange,
}: AttractionCardProps) {
  return (
    <article className="group relative mb-7 break-inside-avoid overflow-hidden rounded-[1.35rem] border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5 transition duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-stone-900/10">
      <div className="relative">
        <Link
          to={`/cities/${attraction.city_id}/places/${attraction.id}`}
          aria-label={`View ${attraction.name}`}
          className="block focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:outline-none focus-visible:ring-inset"
        >
          <ImageWithFallback
            src={attraction.image_url}
            alt={`View of ${attraction.name}`}
            className="aspect-[5/3]"
          />
        </Link>
        <label className="absolute top-3 right-3 z-10 cursor-pointer">
          <input
            type="checkbox"
            aria-label={`${visited ? 'Mark as unvisited' : 'Mark as visited'}: ${attraction.name}`}
            checked={visited}
            disabled={disabled}
            onChange={(event) => onVisitedChange(event.currentTarget.checked)}
            className="peer sr-only"
          />
          <span className="flex size-10 items-center justify-center rounded-full border border-white/80 bg-white/90 text-emerald-900 shadow-md shadow-stone-950/10 backdrop-blur transition peer-checked:border-emerald-900 peer-checked:bg-emerald-900 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-800 peer-focus-visible:ring-offset-2 peer-disabled:opacity-50 peer-checked:[&>span]:hidden peer-checked:[&>svg]:block">
            <Check
              aria-hidden="true"
              size={18}
              strokeWidth={2.5}
              className="hidden"
            />
            <span
              aria-hidden="true"
              className="size-4 rounded border-2 border-stone-500"
            />
          </span>
        </label>
        <span className="absolute bottom-3 left-3 rounded-full bg-stone-950/70 px-3 py-1 text-[11px] font-semibold tracking-[0.14em] text-white uppercase backdrop-blur">
          Place {String(attraction.sort_order).padStart(2, '0')}
        </span>
      </div>
      <div className="p-5 sm:p-6">
        <Link
          to={`/cities/${attraction.city_id}/places/${attraction.id}`}
          className="group/title focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <h2 className="font-serif text-[1.55rem] leading-tight tracking-tight text-stone-950 group-hover/title:text-emerald-900">
            {attraction.name}
          </h2>
        </Link>
        <p className="mt-3 line-clamp-4 text-sm leading-6 text-stone-600">
          {attraction.description}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <a
            href={googleMapsSearchUrl(attraction.name, cityName)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 transition hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            <MapPin aria-hidden="true" size={14} /> Open in Maps
          </a>
          <Link
            to={`/cities/${attraction.city_id}/places/${attraction.id}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-900 transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            Explore place <ArrowUpRight aria-hidden="true" size={14} />
          </Link>
        </div>
      </div>
    </article>
  )
}
