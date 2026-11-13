import { useQuery } from '@tanstack/react-query'
import { ArrowDown, ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared/QueryState'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { ShareButton } from '@/components/shared/ShareButton'
import { fetchAttractions, fetchCity } from '@/features/cities/api'
import { ChecklistExperience } from '@/features/checklist/components/ChecklistExperience'
import { usePageMetadata } from '@/features/cities/usePageMetadata'

export function CityDetailPage() {
  const { cityId = '' } = useParams()
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
  usePageMetadata({
    title: cityQuery.data
      ? `${cityQuery.data.name} city guide · Tour Tracker`
      : 'City guide · Tour Tracker',
    description:
      cityQuery.data?.description ||
      'Explore recommended places with Tour Tracker.',
    image: cityQuery.data?.image_url || '',
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
  const intro = city.description.trim()
  const firstSentence = intro.match(/^.{1,180}?[.!?](?=\s|$)/s)?.[0]
  const summary =
    intro.length > 180
      ? firstSentence || intro.slice(0, 177).replace(/\s+\S*$/, '') + '…'
      : intro

  return (
    <div className="guide-shell py-5 sm:py-8">
      <BackToCities />
      <header className="mb-6 grid items-center gap-4 sm:mb-8 sm:gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <h1 className="guide-display text-5xl break-words sm:text-7xl">
            {city.name}
          </h1>
          <p className="text-guide-muted mt-3 max-w-prose text-base leading-7 sm:text-lg">
            {summary}
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <a
              href="#recommended-places"
              className="guide-control guide-primary gap-2"
            >
              <ArrowDown size={17} aria-hidden="true" /> Jump to places
            </a>
            <ShareButton
              title={`${city.name} city guide · Tour Tracker`}
              text={city.description}
            />
          </div>
          {summary !== intro ? (
            <details className="text-guide-muted mt-2 max-w-prose text-sm leading-6">
              <summary className="text-guide-accent w-fit cursor-pointer py-2 font-semibold">
                About this city
              </summary>
              <p className="pb-2 whitespace-pre-line">{intro}</p>
            </details>
          ) : null}
        </div>
        <ImageWithFallback
          src={city.image_url}
          alt={`View of ${city.name}`}
          loading="eager"
          className="aspect-[3/1] rounded-xl md:aspect-[2.4/1]"
        />
      </header>

      <section
        id="recommended-places"
        tabIndex={-1}
        aria-label="Place checklist"
        className="scroll-mt-4"
      >
        {attractionsQuery.isPending ? (
          <LoadingState label="Loading recommended places…" />
        ) : attractionsQuery.isError ? (
          <ErrorState
            title="We couldn’t load the recommended places"
            message={
              attractionsQuery.error.message ||
              'Check your connection and try again.'
            }
            onRetry={() => void attractionsQuery.refetch()}
          />
        ) : attractionsQuery.data.length === 0 ? (
          <EmptyState
            title="No places in this guide yet"
            message="Recommended places will appear here once they’ve been added to this city."
          />
        ) : (
          <ChecklistExperience
            attractions={attractionsQuery.data}
            cityName={city.name}
          />
        )}
      </section>
    </div>
  )
}

function BackToCities() {
  return (
    <Link to="/" className="guide-text-link mb-2">
      <ArrowLeft aria-hidden="true" size={16} /> All cities
    </Link>
  )
}
