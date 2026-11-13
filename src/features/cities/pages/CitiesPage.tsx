import { useQuery } from '@tanstack/react-query'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared/QueryState'
import { CityCard } from '@/features/cities/components/CityCard'
import { RequestCityCard } from '@/features/cities/components/RequestCityCard'
import { fetchCities } from '@/features/cities/api'
import { usePageMetadata } from '@/features/cities/usePageMetadata'

export function CitiesPage() {
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: fetchCities })
  usePageMetadata({
    title: 'Tour Tracker · City guides',
    description:
      'Explore recommended places and keep track of where you’ve been.',
    image: '',
  })

  return (
    <section id="city-guides" className="guide-shell py-9 sm:py-14">
      <header className="border-guide-line mb-7 flex flex-wrap items-end justify-between gap-3 border-b pb-5 sm:mb-8">
        <div>
          <h1 className="guide-display text-4xl sm:text-6xl">
            Choose your next city
          </h1>
          <p className="text-guide-muted mt-3 text-base sm:text-lg">
            Find places worth a stop and check them off as you go.
          </p>
        </div>
        {citiesQuery.data?.length ? (
          <span className="text-guide-muted text-sm font-medium tabular-nums">
            {citiesQuery.data.length}{' '}
            {citiesQuery.data.length === 1 ? 'guide' : 'guides'}
          </span>
        ) : null}
      </header>

      {citiesQuery.isPending ? (
        <LoadingState label="Finding city guides…" />
      ) : citiesQuery.isError ? (
        <ErrorState
          title="We couldn’t load the city guides"
          message={
            citiesQuery.error.message || 'Check your connection and try again.'
          }
          onRetry={() => void citiesQuery.refetch()}
        />
      ) : citiesQuery.data.length === 0 ? (
        <EmptyState
          title="No city guides yet"
          message="Request a city below to suggest where we should start."
        />
      ) : (
        <div
          className={
            citiesQuery.data.length === 1
              ? 'grid'
              : 'grid gap-5 sm:grid-cols-2 lg:grid-cols-3'
          }
        >
          {citiesQuery.data.map((city) => (
            <CityCard
              key={city.id}
              city={city}
              featured={citiesQuery.data.length === 1}
            />
          ))}
        </div>
      )}

      <RequestCityCard />
    </section>
  )
}
