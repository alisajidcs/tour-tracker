import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import type { Database } from '@/types/database'

type City = Database['public']['Tables']['cities']['Row']

export function CityCard({
  city,
  featured,
}: {
  city: City
  featured: boolean
}) {
  return (
    <Link
      to={`/cities/${city.id}`}
      aria-label={`Open ${city.name} city guide`}
      className={`group border-guide-line bg-guide-surface hover:border-guide-accent grid overflow-hidden rounded-2xl border transition-colors ${featured ? 'md:grid-cols-[1.55fr_1fr]' : ''}`}
    >
      <ImageWithFallback
        src={city.image_url}
        alt={`View of ${city.name}`}
        loading={featured ? 'eager' : 'lazy'}
        className={
          featured ? 'aspect-[16/9] md:aspect-[16/10]' : 'aspect-[16/10]'
        }
      />
      <div
        className={`flex min-w-0 flex-col justify-center p-5 sm:p-6 ${featured ? 'lg:p-10' : ''}`}
      >
        <h2
          className={`guide-display text-3xl break-words ${featured ? 'sm:text-5xl' : ''}`}
        >
          {city.name}
        </h2>
        <p className="text-guide-muted mt-2 line-clamp-3 text-sm leading-6 sm:text-base">
          {city.description}
        </p>
        <span className="text-guide-accent mt-4 inline-flex items-center gap-2 font-semibold">
          Open city guide <ArrowUpRight aria-hidden="true" size={17} />
        </span>
      </div>
    </Link>
  )
}
