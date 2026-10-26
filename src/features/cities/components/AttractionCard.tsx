import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import type { Database } from '@/types/database'

type Attraction = Database['public']['Tables']['attractions']['Row']

type AttractionCardProps = {
  attraction: Attraction
  visited: boolean
  disabled?: boolean
  onVisitedChange: (visited: boolean) => void
}

export function AttractionCard({
  attraction,
  visited,
  disabled = false,
  onVisitedChange,
}: AttractionCardProps) {
  return (
    <article className="w-[min(82vw,19rem)] shrink-0 snap-start overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5 sm:w-[20rem]">
      <ImageWithFallback
        src={attraction.image_url}
        alt={`View of ${attraction.name}`}
        className="aspect-[4/3]"
      />
      <div className="p-5">
        <p className="text-xs font-medium tracking-wide text-emerald-800 uppercase">
          Recommended stop {attraction.sort_order}
        </p>
        <h2 className="mt-2 text-lg font-semibold tracking-tight text-stone-950">
          {attraction.name}
        </h2>
        <p className="mt-2 line-clamp-4 text-sm leading-6 text-stone-600">
          {attraction.description}
        </p>
        <label className="mt-5 flex cursor-pointer items-center gap-3 border-t border-stone-100 pt-4 text-sm font-medium text-stone-800">
          <input
            type="checkbox"
            aria-label={`${visited ? 'Mark as unvisited' : 'Mark as visited'}: ${attraction.name}`}
            checked={visited}
            disabled={disabled}
            onChange={(event) => onVisitedChange(event.currentTarget.checked)}
            className="size-5 accent-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2"
          />
          {visited ? 'Visited' : 'Mark as visited'}
        </label>
      </div>
    </article>
  )
}
