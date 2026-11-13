import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, MapPin } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
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

  return (
    <AttractionStory
      key={placeId}
      city={cityQuery.data}
      place={placeQuery.data}
    />
  )
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
  const heading = useRef<HTMLHeadingElement>(null)
  const { state } = useLocation()
  const navigate = useNavigate()

  function returnToChecklist(event: MouseEvent<HTMLAnchorElement>) {
    if (
      !state?.fromChecklist ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return
    event.preventDefault()
    void navigate(-1)
  }

  useLayoutEffect(() => {
    if (window.scrollY) window.scrollTo({ top: 0, behavior: 'instant' })
    heading.current?.focus({ preventScroll: true })
  }, [])

  const cityUrl = `/cities/${city.id}`
  const returnUrl = `${cityUrl}#place-${place.id}`

  return (
    <article className="guide-shell py-5 sm:py-8">
      <Link
        to={returnUrl}
        onClick={returnToChecklist}
        className="guide-text-link mb-2"
      >
        <ArrowLeft aria-hidden="true" size={16} /> {city.name} checklist
      </Link>

      <div className="grid items-start gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] md:gap-x-10">
        <header className="min-w-0 md:col-start-1 md:row-start-1">
          <h1
            ref={heading}
            tabIndex={-1}
            className="guide-display text-4xl break-words sm:text-5xl"
          >
            {place.name}
          </h1>
          <p className="text-guide-accent mt-3 text-sm font-medium">
            Recommended place {String(place.sort_order).padStart(2, '0')}
          </p>
          <p className="text-guide-muted mt-4 text-base leading-7 sm:text-lg">
            {place.description}
          </p>
          <div className="mt-4 flex flex-wrap items-start gap-2">
            <a
              href={googleMapsSearchUrl(place.name, city.name)}
              target="_blank"
              rel="noreferrer"
              className="guide-control guide-primary gap-2"
            >
              <MapPin aria-hidden="true" size={17} /> Find on Google Maps
            </a>
            <ShareButton
              title={`${place.name} · ${city.name} · Tour Tracker`}
              text={place.description}
            />
          </div>
        </header>

        <div className="min-w-0 md:col-start-2 md:row-span-2 md:row-start-1">
          <ImageWithFallback
            src={images[activeImageIndex] ?? place.image_url}
            alt={`${place.name}, image ${activeImageIndex + 1}`}
            loading="eager"
            className="aspect-[4/3] rounded-2xl sm:aspect-[5/4]"
          />
          {images.length > 1 ? (
            <div
              role="group"
              aria-label={`${place.name} photo gallery`}
              className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5"
            >
              {images.map((imageUrl, index) => (
                <button
                  key={imageUrl}
                  type="button"
                  aria-label={`Show image ${index + 1} of ${place.name}`}
                  aria-pressed={activeImageIndex === index}
                  onClick={() => setActiveImageIndex(index)}
                  className="aria-pressed:border-guide-accent overflow-hidden rounded-lg border-2 border-transparent p-0.5 opacity-75 transition hover:opacity-100 aria-pressed:opacity-100"
                >
                  <ImageWithFallback
                    src={imageUrl}
                    alt=""
                    className="aspect-square rounded-sm"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="md:col-start-1">
          {place.long_description.trim() ? (
            <section className="border-guide-line border-t pt-5">
              <h2 className="guide-display text-2xl">About this place</h2>
              <p className="text-guide-muted mt-3 max-w-prose leading-7 whitespace-pre-line">
                {place.long_description}
              </p>
            </section>
          ) : null}
          <Link
            to={returnUrl}
            onClick={returnToChecklist}
            className="guide-text-link mt-3"
          >
            <ArrowLeft aria-hidden="true" size={16} /> Back to recommended
            places
          </Link>
        </div>
      </div>
    </article>
  )
}
function BackToCity({ cityId }: { cityId: string }) {
  return (
    <Link to={`/cities/${cityId}`} className="guide-text-link">
      <ArrowLeft aria-hidden="true" size={16} /> Back to city
    </Link>
  )
}
