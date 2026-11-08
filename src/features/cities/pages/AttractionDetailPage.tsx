import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/components/shared/QueryState'
import { ImageWithFallback } from '@/components/shared/ImageWithFallback'
import { ShareButton } from '@/components/shared/ShareButton'
import { fetchAttraction, fetchCity } from '@/features/cities/api'
import { googleMapsSearchUrl } from '@/features/cities/maps'
import { usePageMetadata } from '@/features/cities/usePageMetadata'

export function AttractionDetailPage() {
  const { cityId = '', placeId = '' } = useParams()
  const cityQuery = useQuery({
    queryKey: ['cities', cityId],
    queryFn: () => fetchCity(cityId),
    enabled: Boolean(cityId),
  })
  const placeQuery = useQuery({
    queryKey: ['attractions', cityId, placeId],
    queryFn: () => fetchAttraction(cityId, placeId),
    enabled: Boolean(cityId) && Boolean(placeId),
  })
  usePageMetadata({
    title:
      placeQuery.data && cityQuery.data
        ? `${placeQuery.data.name} · ${cityQuery.data.name} · Tour Tracker`
        : 'Place guide · Tour Tracker',
    description:
      placeQuery.data?.long_description ||
      placeQuery.data?.description ||
      'Explore a recommended place with Tour Tracker.',
    image: placeQuery.data?.image_url || '',
  })

  if (cityQuery.isPending || placeQuery.isPending) {
    return <LoadingState label="Loading this place…" />
  }
  if (cityQuery.isError || placeQuery.isError) {
    const error = cityQuery.error ?? placeQuery.error
    return (
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <BackToCity cityId={cityId} />
        <div className="mt-8">
          <ErrorState
            title="We couldn’t load this place"
            message={error?.message || 'Check your connection and try again.'}
            onRetry={() => {
              void cityQuery.refetch()
              void placeQuery.refetch()
            }}
          />
        </div>
      </section>
    )
  }
  if (!cityQuery.data || !placeQuery.data) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <BackToCity cityId={cityId} />
        <div className="mt-8">
          <EmptyState
            title="Place not found"
            message="This place may have been removed, or the link may be out of date."
          />
        </div>
      </section>
    )
  }

  return <AttractionStory city={cityQuery.data} place={placeQuery.data} />
}

function AttractionStory({
  city,
  place,
}: {
  city: NonNullable<Awaited<ReturnType<typeof fetchCity>>>
  place: NonNullable<Awaited<ReturnType<typeof fetchAttraction>>>
}) {
  const images = [
    ...new Set([place.image_url, ...place.gallery_image_urls]),
  ].filter(Boolean)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const description = place.long_description.trim() || place.description

  return (
    <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="mb-7 flex flex-wrap items-center gap-2 text-sm text-stone-500">
        <Link
          to={`/cities/${city.id}`}
          className="inline-flex items-center gap-2 font-medium text-stone-700 transition hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
        >
          <ArrowLeft aria-hidden="true" size={16} /> {city.name}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-stone-500">{place.name}</span>
      </div>

      <div className="grid gap-9 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.8fr)] lg:gap-14">
        <div>
          <div className="overflow-hidden rounded-[1.75rem] border border-stone-200/80 bg-white shadow-sm shadow-stone-900/5">
            <ImageWithFallback
              src={images[activeImageIndex] ?? place.image_url}
              alt={`${place.name}, image ${activeImageIndex + 1}`}
              className="aspect-[4/3] sm:aspect-[5/3]"
              imageClassName="transition duration-500"
            />
          </div>
          {images.length > 1 ? (
            <div
              role="group"
              aria-label={`${place.name} photo gallery`}
              className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5"
            >
              {images.map((imageUrl, index) => (
                <button
                  key={`${imageUrl}-${index}`}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${place.name}`}
                  aria-pressed={activeImageIndex === index}
                  onClick={() => setActiveImageIndex(index)}
                  className={`overflow-hidden rounded-xl border-2 transition focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none ${
                    activeImageIndex === index
                      ? 'border-emerald-900'
                      : 'border-transparent opacity-75 hover:opacity-100'
                  }`}
                >
                  <ImageWithFallback
                    src={imageUrl}
                    alt={`${place.name}, gallery image ${index + 1}`}
                    className="aspect-square"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="lg:py-3">
          <p className="text-xs font-semibold tracking-[0.18em] text-emerald-900 uppercase">
            Recommended place · {String(place.sort_order).padStart(2, '0')}
          </p>
          <h1 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight text-stone-950 sm:text-5xl">
            {place.name}
          </h1>
          <p className="mt-5 text-lg leading-8 text-stone-600">
            {place.description}
          </p>

          <div className="mt-6 flex flex-wrap items-start gap-3">
            <a
              href={googleMapsSearchUrl(place.name, city.name)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm transition hover:border-emerald-900/30 hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              <MapPin aria-hidden="true" size={16} /> Find on Google Maps
            </a>
            <ShareButton
              title={`${place.name} · ${city.name} · Tour Tracker`}
              text={place.description}
            />
          </div>

          {place.long_description.trim() ? (
            <div className="mt-9 border-t border-stone-200 pt-6">
              <p className="text-xs font-semibold tracking-[0.16em] text-stone-500 uppercase">
                The story
              </p>
              <h2 className="mt-2 font-serif text-2xl text-stone-950">
                About this place
              </h2>
              <p className="mt-4 text-[15px] leading-7 whitespace-pre-line text-stone-600">
                {description}
              </p>
            </div>
          ) : null}

          <Link
            to={`/cities/${city.id}`}
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-900 transition hover:text-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          >
            <ArrowLeft aria-hidden="true" size={16} /> Back to recommended
            places
          </Link>
        </div>
      </div>
    </section>
  )
}

function BackToCity({ cityId }: { cityId: string }) {
  return (
    <Link
      to={`/cities/${cityId}`}
      className="inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-800 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <ArrowLeft aria-hidden="true" size={16} /> Back to city
    </Link>
  )
}
