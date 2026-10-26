import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared/QueryState'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { AttractionCard } from '@/features/cities/components/AttractionCard'
import { fetchAttractions, fetchCity } from '@/features/cities/api'
import { sortAttractionsByVisited } from '@/features/checklist/sorting'
import { useChecklist } from '@/features/checklist/useChecklist'

export function CityDetailPage() {
  const { cityId = '' } = useParams()
  const checklist = useChecklist()
  const cityQuery = useQuery({
    queryKey: ['cities', cityId],
    queryFn: () => fetchCity(cityId),
    enabled: Boolean(cityId),
  })
  const attractionsQuery = useQuery({
    queryKey: ['attractions', cityId],
    queryFn: () => fetchAttractions(cityId),
    enabled: Boolean(cityId) && cityQuery.isSuccess && Boolean(cityQuery.data),
  })

  if (cityQuery.isPending)
    return <LoadingState label="Loading this city guide…" />
  if (cityQuery.isError) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <BackToCities />
        <div className="mt-8">
          <ErrorState
            title="We couldn’t load this city guide"
            message={
              cityQuery.error.message || 'Check your connection and try again.'
            }
            onRetry={() => void cityQuery.refetch()}
          />
        </div>
      </section>
    )
  }
  if (!cityQuery.data) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <BackToCities />
        <div className="mt-8">
          <EmptyState
            title="City guide not found"
            message="This city may have been removed, or the link may be out of date."
          />
        </div>
      </section>
    )
  }

  const city = cityQuery.data

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-8 sm:px-8 sm:pt-10">
        <BackToCities />
        <div className="mt-7 grid overflow-hidden rounded-[2rem] border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5 lg:grid-cols-[1fr_0.9fr]">
          <ImageWithFallback
            src={city.image_url}
            alt={`View of ${city.name}`}
            className="aspect-[16/9] min-h-56 lg:aspect-auto lg:min-h-[22rem]"
          />
          <div className="flex flex-col justify-center p-6 sm:p-9 lg:p-11">
            <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-800">
              <MapPin aria-hidden="true" size={15} /> City guide
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] text-stone-950 sm:text-5xl">
              {city.name}
            </h1>
            <p className="mt-5 text-base leading-7 text-stone-600 sm:text-lg sm:leading-8">
              {city.description}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-800">
              A good place to begin
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">
              Recommended stops
            </h2>
          </div>
          {attractionsQuery.isSuccess &&
          attractionsQuery.data.length > 0 &&
          checklist.checklistQuery.isSuccess ? (
            <p
              className="text-sm font-medium text-stone-600"
              aria-live="polite"
            >
              Visited{' '}
              {
                attractionsQuery.data.filter((attraction) =>
                  checklist.visitedIds.has(attraction.id),
                ).length
              }{' '}
              of {attractionsQuery.data.length}
            </p>
          ) : null}
        </div>

        {checklist.checklistQuery.isError || checklist.saveError ? (
          <div
            role="alert"
            className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <span>
              {checklist.saveError ||
                checklist.checklistQuery.error?.message ||
                'Checklist progress is unavailable.'}
            </span>
            {checklist.checklistQuery.isError ? (
              <button
                type="button"
                onClick={() => void checklist.checklistQuery.refetch()}
                className="font-semibold underline underline-offset-2"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {attractionsQuery.isPending ? (
          <LoadingState label="Loading recommended stops…" />
        ) : attractionsQuery.isError ? (
          <ErrorState
            title="We couldn’t load the recommended stops"
            message={
              attractionsQuery.error.message ||
              'Check your connection and try again.'
            }
            onRetry={() => void attractionsQuery.refetch()}
          />
        ) : attractionsQuery.data.length === 0 ? (
          <EmptyState
            title="No stops in this guide yet"
            message="Recommended places will appear here once they’ve been added to this city."
          />
        ) : (
          <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:-mx-8 sm:gap-5 sm:px-8">
            {sortAttractionsByVisited(
              attractionsQuery.data,
              checklist.visitedIds,
            ).map((attraction) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                visited={checklist.visitedIds.has(attraction.id)}
                disabled={
                  checklist.isSaving ||
                  checklist.checklistQuery.isPending ||
                  checklist.checklistQuery.isError
                }
                onVisitedChange={(visited) =>
                  checklist.setVisited(attraction.id, visited)
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  )
}

function BackToCities() {
  return (
    <Link
      to="/"
      className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" size={16} /> All cities
    </Link>
  )
}
