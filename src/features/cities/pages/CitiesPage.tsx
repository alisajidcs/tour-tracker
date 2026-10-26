import { useQuery } from '@tanstack/react-query'
import { Compass, MapPin } from 'lucide-react'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared/QueryState'
import { CityCard } from '@/features/cities/components/CityCard'
import { fetchCities } from '@/features/cities/api'

export function CitiesPage() {
  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: fetchCities,
  })

  return (
    <>
      <section className="relative overflow-hidden border-b border-stone-200/70 bg-[radial-gradient(ellipse_at_90%_5%,rgba(190,205,177,0.45),transparent_38%),linear-gradient(180deg,#f7f7f4,#f2f2ec)]">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20 lg:py-24">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-white/70 px-3.5 py-2 text-sm text-emerald-950 shadow-sm shadow-stone-900/5">
              <Compass aria-hidden="true" size={15} /> A little more exploring
            </div>
            <h1 className="text-5xl leading-[1.04] font-semibold tracking-[-0.055em] text-stone-950 sm:text-6xl lg:text-7xl">
              Find your way to{' '}
              <span className="font-serif font-normal text-emerald-900 italic">
                somewhere.
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-600 sm:text-xl">
              Thoughtful city guides for curious days. Pick a place and see
              what’s worth discovering.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-7 flex items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
              <MapPin aria-hidden="true" size={15} /> Explore
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
              Choose your next city
            </h2>
          </div>
          {citiesQuery.data?.length ? (
            <span className="hidden text-sm text-stone-500 sm:block">
              {citiesQuery.data.length}{' '}
              {citiesQuery.data.length === 1 ? 'guide' : 'guides'}
            </span>
          ) : null}
        </div>

        {citiesQuery.isPending ? (
          <LoadingState label="Finding city guides…" />
        ) : citiesQuery.isError ? (
          <ErrorState
            title="We couldn’t load the city guides"
            message={
              citiesQuery.error.message ||
              'Check your connection and try again.'
            }
            onRetry={() => void citiesQuery.refetch()}
          />
        ) : citiesQuery.data.length === 0 ? (
          <EmptyState
            title="No city guides yet"
            message="There aren’t any cities in the catalog yet. Check back after the first guide is added."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {citiesQuery.data.map((city) => (
              <CityCard key={city.id} city={city} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
