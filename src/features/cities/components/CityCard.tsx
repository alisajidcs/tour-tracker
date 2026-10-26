import { ArrowUpRight, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import type { Database } from '@/types/database'

type City = Database['public']['Tables']['cities']['Row']

export function CityCard({ city }: { city: City }) {
  return (
    <Link
      to={`/cities/${city.id}`}
      className="group overflow-hidden rounded-3xl border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5 transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-stone-900/10 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ImageWithFallback
        src={city.image_url}
        alt={`View of ${city.name}`}
        className="aspect-[16/10]"
      />
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-emerald-800 uppercase">
              <MapPin aria-hidden="true" size={13} /> City guide
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-stone-950 group-hover:text-emerald-900">
              {city.name}
            </h2>
          </div>
          <ArrowUpRight
            aria-hidden="true"
            className="mt-1 text-stone-400 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-emerald-800"
            size={19}
          />
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
          {city.description}
        </p>
      </div>
    </Link>
  )
}
