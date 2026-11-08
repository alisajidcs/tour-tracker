import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { Button } from '@/components/ui/button'
import {
  createAttraction,
  createCity,
  createCityFromRequest,
  createCityWithAttractions,
  deleteAttraction,
  deleteCity,
  fetchPendingCityRequests,
  importAttractions,
  reorderAttractions,
  updateAttraction,
  updateCity,
  validateCatalogName,
  validateImageUrl,
  validateSortOrder,
  type AttractionInput,
  type CityInput,
} from '@/features/admin/api'
import {
  validateAttractionImport,
  validateCityGuideImport,
} from '@/features/admin/importValidation'
import {
  buildAttractionImportPrompt,
  buildCityGuideImportPrompt,
} from '@/features/admin/importPrompt'
import { fetchAttractions, fetchCities } from '@/features/cities/api'
import type { Database } from '@/types/database'
import { AdminPageFrame } from '@/features/admin/components/AdminPageFrame'

type City = Database['public']['Tables']['cities']['Row']
type Attraction = Database['public']['Tables']['attractions']['Row']
type DeleteTarget =
  | { type: 'city'; id: string; name: string }
  | { type: 'attraction'; id: string; name: string }

const emptyCity: CityInput = { name: '', description: '', image_url: '' }

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : 'The change could not be saved.'
}

export function AdminCatalog() {
  const queryClient = useQueryClient()
  const citiesQuery = useQuery({ queryKey: ['cities'], queryFn: fetchCities })
  const cityRequestsQuery = useQuery({
    queryKey: ['city-requests', 'pending'],
    queryFn: fetchPendingCityRequests,
  })
  const [selectedCityId, setSelectedCityId] = useState('')
  const selectedCity = citiesQuery.data?.find(
    (city) => city.id === selectedCityId,
  )
  const activeCity = selectedCity ?? citiesQuery.data?.[0] ?? null
  const attractionsQuery = useQuery({
    queryKey: ['attractions', activeCity?.id],
    queryFn: () => fetchAttractions(activeCity!.id),
    enabled: Boolean(activeCity),
  })
  const [cityDraft, setCityDraft] = useState<CityInput>(emptyCity)
  const [pendingCityRequestId, setPendingCityRequestId] = useState<
    string | null
  >(null)
  const [editingCityId, setEditingCityId] = useState<string | null>(null)
  const [isCityFormOpen, setIsCityFormOpen] = useState(false)
  const [cityValidationError, setCityValidationError] = useState<string | null>(
    null,
  )
  const [attractionDraft, setAttractionDraft] = useState({
    name: '',
    description: '',
    image_url: '',
    long_description: '',
    gallery_image_urls: '',
  })
  const [editingAttractionId, setEditingAttractionId] = useState<string | null>(
    null,
  )
  const [isAttractionFormOpen, setIsAttractionFormOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [attractionValidationError, setAttractionValidationError] = useState<
    string | null
  >(null)
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null)
  const [importDraft, setImportDraft] = useState('')
  const [importValidationError, setImportValidationError] = useState<
    string | null
  >(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const [promptCopyStatus, setPromptCopyStatus] = useState('')
  const [cityGuideDraft, setCityGuideDraft] = useState('')
  const [cityGuideError, setCityGuideError] = useState<string | null>(null)
  const [cityGuideStatus, setCityGuideStatus] = useState('')
  const [adminSection, setAdminSection] = useState<'cities' | 'places'>(
    'cities',
  )

  const saveCityMutation = useMutation({
    mutationFn: ({
      id,
      input,
      requestId,
    }: {
      id: string | null
      input: CityInput
      requestId: string | null
    }) =>
      id
        ? updateCity(id, input)
        : requestId
          ? createCityFromRequest(requestId, input)
          : createCity(input),
    onSuccess: async (city) => {
      setAdminSection('places')
      setSelectedCityId(city.id)
      setPendingCityRequestId(null)
      setCityDraft(emptyCity)
      setEditingCityId(null)
      setIsCityFormOpen(false)
      setCityValidationError(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({
          queryKey: ['city-requests', 'pending'],
        }),
      ])
    },
  })

  const saveAttractionMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string | null
      input: AttractionInput
    }) => (id ? updateAttraction(id, input) : createAttraction(input)),
    onSuccess: async () => {
      setEditingAttractionId(null)
      setIsAttractionFormOpen(false)
      setAttractionDraft({
        name: '',
        description: '',
        image_url: '',
        long_description: '',
        gallery_image_urls: '',
      })
      setAttractionValidationError(null)
      await queryClient.invalidateQueries({
        queryKey: ['attractions', activeCity?.id],
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (target: DeleteTarget) =>
      target.type === 'city'
        ? deleteCity(target.id)
        : deleteAttraction(target.id),
    onSuccess: async (_result, target) => {
      setPendingDelete(null)
      if (target.type === 'city' && target.id === activeCity?.id) {
        setSelectedCityId('')
        setEditingCityId(null)
        setCityDraft(emptyCity)
        setEditingAttractionId(null)
      }
      if (target.type === 'attraction' && target.id === editingAttractionId) {
        setEditingAttractionId(null)
        setAttractionDraft({
          name: '',
          description: '',
          image_url: '',
          long_description: '',
          gallery_image_urls: '',
        })
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({
          queryKey: ['attractions', activeCity?.id],
        }),
      ])
    },
  })

  const reorderMutation = useMutation({
    mutationFn: (ids: string[]) =>
      activeCity ? reorderAttractions(activeCity.id, ids) : Promise.resolve(),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ['attractions', activeCity?.id],
      }),
  })

  const importMutation = useMutation({
    mutationFn: (places: Parameters<typeof importAttractions>[1]) =>
      activeCity
        ? importAttractions(activeCity.id, places)
        : Promise.resolve(0),
    onSuccess: async (count) => {
      setImportDraft('')
      setIsImportOpen(false)
      setImportValidationError(null)
      setImportSuccess(
        `Imported ${count} ${count === 1 ? 'attraction' : 'attractions'}.`,
      )
      await queryClient.invalidateQueries({
        queryKey: ['attractions', activeCity?.id],
      })
    },
  })

  const createGuideMutation = useMutation({
    mutationFn: ({
      guide,
      requestId,
    }: {
      guide: Parameters<typeof createCityWithAttractions>[0]
      requestId: string | null
    }) => createCityWithAttractions(guide, requestId),
    onSuccess: async (cityId) => {
      setSelectedCityId(cityId)
      setPendingCityRequestId(null)
      setCityDraft(emptyCity)
      setCityGuideDraft('')
      setCityGuideError(null)
      setCityGuideStatus('City guide created with its places.')
      setIsCityFormOpen(false)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cities'] }),
        queryClient.invalidateQueries({ queryKey: ['attractions', cityId] }),
        queryClient.invalidateQueries({
          queryKey: ['city-requests', 'pending'],
        }),
      ])
    },
  })

  if (citiesQuery.isPending) {
    return (
      <AdminPageFrame>
        <LoadingState label="Loading catalog…" />
      </AdminPageFrame>
    )
  }
  if (citiesQuery.isError) {
    return (
      <AdminPageFrame>
        <ErrorState
          title="The catalog could not be loaded"
          message={citiesQuery.error.message}
          onRetry={() => void citiesQuery.refetch()}
        />
      </AdminPageFrame>
    )
  }

  const cities = citiesQuery.data
  const pendingCityRequests = cityRequestsQuery.data ?? []
  const attractions = attractionsQuery.data ?? []
  const importPrompt = activeCity
    ? buildAttractionImportPrompt(
        activeCity,
        attractions.map((item) => item.name),
      )
    : ''
  const cityGuidePrompt = buildCityGuideImportPrompt(cityDraft.name)

  async function copyImportPrompt() {
    try {
      if (!navigator.clipboard?.writeText) {
        setPromptCopyStatus(
          'Clipboard access is unavailable. Select and copy the prompt manually.',
        )
        return
      }
      await navigator.clipboard.writeText(importPrompt)
      setPromptCopyStatus(
        'Prompt copied. Paste it into an LLM, then paste its JSON response below.',
      )
    } catch {
      setPromptCopyStatus(
        'Could not copy the prompt. Select and copy it manually.',
      )
    }
  }

  async function copyCityGuidePrompt() {
    try {
      if (!navigator.clipboard?.writeText) {
        setCityGuideStatus(
          'Clipboard access unavailable. Select and copy the prompt manually.',
        )
        return
      }
      await navigator.clipboard.writeText(cityGuidePrompt)
      setCityGuideStatus('Prompt copied. Paste the JSON response below.')
    } catch {
      setCityGuideStatus(
        'Could not copy the prompt. Select and copy it manually.',
      )
    }
  }

  function startCityEdit(city: City) {
    setAdminSection('cities')
    setEditingCityId(city.id)
    setPendingCityRequestId(null)
    setCityDraft({
      name: city.name,
      description: city.description,
      image_url: city.image_url,
    })
    setCityValidationError(null)
    setIsCityFormOpen(true)
  }

  function startNewCity() {
    setAdminSection('cities')
    setEditingCityId(null)
    setPendingCityRequestId(null)
    setCityDraft(emptyCity)
    setCityValidationError(null)
    setCityGuideDraft('')
    setCityGuideError(null)
    setCityGuideStatus('')
    setIsCityFormOpen(true)
  }

  function startCityRequest(requestId: string, cityName: string) {
    setAdminSection('cities')
    setEditingCityId(null)
    setPendingCityRequestId(requestId)
    setCityDraft({ name: cityName, description: '', image_url: '' })
    setCityValidationError(null)
    setCityGuideDraft('')
    setCityGuideError(null)
    setCityGuideStatus('')
    setIsCityFormOpen(true)
  }

  function submitCityGuideImport() {
    setCityGuideStatus('')
    const result = validateCityGuideImport(cityGuideDraft)
    if (!result.guide) {
      setCityGuideError(result.error)
      return
    }
    if (
      cityDraft.name.trim() &&
      result.guide.city.name.toLocaleLowerCase() !==
        cityDraft.name.trim().toLocaleLowerCase()
    ) {
      setCityGuideError(
        `The JSON city name must match “${cityDraft.name.trim()}”.`,
      )
      return
    }
    setCityGuideError(null)
    createGuideMutation.mutate({
      guide: result.guide,
      requestId: pendingCityRequestId,
    })
  }

  function submitCity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nameError = validateCatalogName(cityDraft.name)
    const imageError = validateImageUrl(cityDraft.image_url)
    if (nameError || imageError) {
      setCityValidationError(nameError ?? imageError)
      return
    }
    saveCityMutation.mutate({
      id: editingCityId,
      requestId: pendingCityRequestId,
      input: { ...cityDraft, name: cityDraft.name.trim() },
    })
  }

  function startAttractionEdit(attraction: Attraction) {
    setAdminSection('places')
    setEditingAttractionId(attraction.id)
    setAttractionDraft({
      name: attraction.name,
      description: attraction.description,
      image_url: attraction.image_url,
      long_description: attraction.long_description,
      gallery_image_urls: attraction.gallery_image_urls.join('\n'),
    })
    setAttractionValidationError(null)
    setIsAttractionFormOpen(true)
  }

  function startNewAttraction() {
    setAdminSection('places')
    setEditingAttractionId(null)
    setAttractionDraft({
      name: '',
      description: '',
      image_url: '',
      long_description: '',
      gallery_image_urls: '',
    })
    setAttractionValidationError(null)
    setIsAttractionFormOpen(true)
  }

  function submitAttraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCity) return
    const nameError = validateCatalogName(attractionDraft.name)
    const imageError = validateImageUrl(attractionDraft.image_url)
    const galleryUrls = attractionDraft.gallery_image_urls
      .split(/[\n,]/)
      .map((url) => url.trim())
      .filter(Boolean)
    const galleryError = galleryUrls.map(validateImageUrl).find(Boolean)
    const nextOrder = editingAttractionId
      ? (attractions.find((item) => item.id === editingAttractionId)
          ?.sort_order ?? 1)
      : Math.max(0, ...attractions.map((item) => item.sort_order)) + 1
    const orderError = validateSortOrder(nextOrder)
    if (nameError || imageError || galleryError || orderError) {
      setAttractionValidationError(
        nameError ?? imageError ?? galleryError ?? orderError ?? null,
      )
      return
    }
    saveAttractionMutation.mutate({
      id: editingAttractionId,
      input: {
        city_id: activeCity.id,
        ...attractionDraft,
        gallery_image_urls: galleryUrls,
        name: attractionDraft.name.trim(),
        sort_order: nextOrder,
      },
    })
  }

  function submitImport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setImportSuccess(null)
    const result = validateAttractionImport(
      importDraft,
      attractions.map((attraction) => attraction.name),
    )
    if (result.places === null) {
      setImportValidationError(result.error)
      return
    }
    setImportValidationError(null)
    importMutation.mutate(result.places)
  }

  function moveAttraction(attractionIndex: number, offset: -1 | 1) {
    const neighborIndex = attractionIndex + offset
    if (
      neighborIndex < 0 ||
      neighborIndex >= attractions.length ||
      reorderMutation.isPending
    ) {
      return
    }
    const orderedIds = attractions.map((attraction) => attraction.id)
    ;[orderedIds[attractionIndex], orderedIds[neighborIndex]] = [
      orderedIds[neighborIndex],
      orderedIds[attractionIndex],
    ]
    reorderMutation.mutate(orderedIds)
  }

  return (
    <AdminPageFrame
      onOpenImport={() => {
        setAdminSection('places')
        setIsImportOpen(true)
      }}
    >
      <div id="catalog" className="mb-7 scroll-mt-8">
        <p className="text-xs font-semibold tracking-[0.12em] text-[#737b86] uppercase">
          Catalog
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-[#20242a] sm:text-[28px]">
              City guides
            </h1>
            <p className="mt-1.5 text-sm text-[#737b86]">
              Manage cities and the places in each guide.
            </p>
          </div>
          <p className="text-xs text-[#858c96]">
            Changes publish to the public catalog
          </p>
        </div>
      </div>

      <nav aria-label="Catalog sections" className="mb-5 flex gap-2">
        <Button
          type="button"
          variant={adminSection === 'cities' ? 'default' : 'outline'}
          onClick={() => setAdminSection('cities')}
        >
          Cities
        </Button>
        <Button
          type="button"
          variant={adminSection === 'places' ? 'default' : 'outline'}
          onClick={() => setAdminSection('places')}
        >
          Places{activeCity ? ` · ${activeCity.name}` : ''}
        </Button>
      </nav>

      {(saveCityMutation.error ||
        saveAttractionMutation.error ||
        deleteMutation.error ||
        reorderMutation.error ||
        importMutation.error ||
        createGuideMutation.error) && (
        <p
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {getErrorMessage(
            saveCityMutation.error ??
              saveAttractionMutation.error ??
              deleteMutation.error ??
              reorderMutation.error ??
              importMutation.error ??
              createGuideMutation.error,
          )}
        </p>
      )}

      {cityGuideStatus ? (
        <p role="status" className="mb-4 text-sm text-emerald-800">
          {cityGuideStatus}
        </p>
      ) : null}
      {importSuccess ? (
        <p role="status" className="mb-4 text-sm text-emerald-800">
          {importSuccess}
        </p>
      ) : null}

      <div className="grid items-start gap-5">
        <section
          hidden={adminSection !== 'cities'}
          className="flex flex-col overflow-hidden rounded-lg border border-[#e2e5e9] bg-white"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="p-4 sm:px-5">
              <h2 className="text-sm font-semibold text-[#303740]">
                Cities{' '}
                <span className="ml-1 font-normal text-[#9299a2]">
                  {cities.length}
                </span>
              </h2>
              <p className="mt-1 text-xs text-[#858c96]">
                Select a city to manage its stops.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mr-4"
              onClick={startNewCity}
            >
              Add city
            </Button>
          </div>

          <section
            aria-labelledby="city-requests-heading"
            className={`${isCityFormOpen ? 'order-2' : 'order-1'} border-y border-[#edf0f2] bg-[#fafbfc] p-4 sm:px-5`}
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3
                id="city-requests-heading"
                className="text-sm font-semibold text-[#303740]"
              >
                City requests
              </h3>
              <span className="text-xs text-[#858c96]">
                {pendingCityRequests.length} pending
              </span>
            </div>
            {cityRequestsQuery.isError ? (
              <p role="alert" className="mt-2 text-sm text-red-800">
                Requests could not be loaded: {cityRequestsQuery.error.message}
              </p>
            ) : pendingCityRequests.length ? (
              <ul className="mt-2 divide-y divide-[#edf0f2]">
                {pendingCityRequests.map((request) => (
                  <li
                    key={request.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[#303740]">
                        {request.city_name}
                      </p>
                      <p className="text-xs text-[#858c96]">
                        Requested{' '}
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        startCityRequest(request.id, request.city_name)
                      }
                    >
                      Add
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-[#858c96]">
                No pending requests.
              </p>
            )}
          </section>

          <div className="order-3 border-y border-[#edf0f2]">
            {cities.map((city) => (
              <div
                key={city.id}
                className={`flex items-center justify-between gap-2 border-l-2 px-3 py-3 ${activeCity?.id === city.id ? 'border-l-[#40536d] bg-[#f6f7f9]' : 'border-l-transparent hover:bg-[#fafbfc]'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityId(city.id)
                    setAdminSection('places')
                    setEditingAttractionId(null)
                    startNewAttraction()
                  }}
                  className="flex min-w-0 flex-1 items-center text-left"
                >
                  <ImageThumb
                    src={city.image_url}
                    alt=""
                    className="mr-3 h-12 w-16 shrink-0 rounded-md"
                  />
                  <span className="block truncate text-sm font-medium text-[#303740]">
                    {city.name}
                  </span>
                  <span className="block truncate text-xs text-[#858c96]">
                    {city.description || 'No description'}
                  </span>
                </button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => startCityEdit(city)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-700 hover:bg-red-50"
                  onClick={() =>
                    setPendingDelete({
                      type: 'city',
                      id: city.id,
                      name: city.name,
                    })
                  }
                >
                  Delete
                </Button>
              </div>
            ))}
          </div>

          {isCityFormOpen ? (
            <form
              className="order-1 p-4 sm:p-5"
              onSubmit={submitCity}
              noValidate
            >
              <h3 className="text-sm font-semibold text-[#303740]">
                {editingCityId ? 'Edit city' : 'New city'}
              </h3>
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-stone-700">
                  Name
                  <input
                    required
                    value={cityDraft.name}
                    onChange={(event) => {
                      setCityDraft({ ...cityDraft, name: event.target.value })
                      setCityGuideDraft('')
                      setCityGuideError(null)
                      setCityGuideStatus('')
                    }}
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-medium text-stone-700">
                  Description
                  <textarea
                    rows={3}
                    value={cityDraft.description}
                    onChange={(event) =>
                      setCityDraft({
                        ...cityDraft,
                        description: event.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </label>
                <ImageUrlField
                  value={cityDraft.image_url}
                  onChange={(image_url) =>
                    setCityDraft({ ...cityDraft, image_url })
                  }
                />
              </div>
              {!editingCityId && cityDraft.name.trim() ? (
                <div className="mt-5 rounded-xl border border-[#dfe5ea] bg-[#f8fafb] p-3">
                  <h4 className="text-sm font-semibold text-[#303740]">
                    Build a complete {cityDraft.name.trim()} guide
                  </h4>
                  <p className="mt-1 text-xs leading-5 text-[#737b86]">
                    Copy this prompt to generate one JSON file with the city and
                    its places, then import it below.
                  </p>
                  <textarea
                    aria-label="Prompt for city guide"
                    readOnly
                    rows={7}
                    value={cityGuidePrompt}
                    className={`${inputClass} font-mono text-xs`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => void copyCityGuidePrompt()}
                  >
                    Copy city guide prompt
                  </Button>
                  <label className="mt-4 block text-sm font-medium text-[#4b535e]">
                    City and places JSON
                    <textarea
                      aria-label="City guide JSON"
                      rows={9}
                      value={cityGuideDraft}
                      onChange={(event) => {
                        setCityGuideDraft(event.target.value)
                        setCityGuideError(null)
                        setCityGuideStatus('')
                      }}
                      className={`${inputClass} font-mono text-xs`}
                      placeholder={
                        '{\n  "city": {\n    "name": "' +
                        cityDraft.name.trim() +
                        '",\n    "description": "A city guide.",\n    "imageUrl": "https://example.com/city.jpg"\n  },\n  "places": [{\n    "name": "A notable place",\n    "description": "A short description.",\n    "longDescription": "More visitor information.",\n    "imageUrl": "https://example.com/place.jpg",\n    "galleryImageUrls": [],\n    "order": 1\n  }]\n}'
                      }
                    />
                  </label>
                  {cityGuideError ? (
                    <FormError message={cityGuideError} />
                  ) : null}
                  {cityGuideStatus ? (
                    <p role="status" className="mt-2 text-xs text-emerald-800">
                      {cityGuideStatus}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className="mt-3"
                    onClick={submitCityGuideImport}
                    disabled={createGuideMutation.isPending}
                  >
                    {createGuideMutation.isPending
                      ? 'Creating guide…'
                      : 'Create city and places'}
                  </Button>
                </div>
              ) : null}
              {cityValidationError ? (
                <FormError message={cityValidationError} />
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="submit" disabled={saveCityMutation.isPending}>
                  {saveCityMutation.isPending ? 'Saving…' : 'Save city'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCityFormOpen(false)
                    setPendingCityRequestId(null)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          ) : null}
        </section>

        <section
          hidden={adminSection !== 'places'}
          className="min-w-0 overflow-hidden rounded-lg border border-[#e2e5e9] bg-white"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0f2] p-4 sm:px-5">
            <div>
              <h2 className="text-sm font-semibold text-[#303740]">
                {activeCity?.name ?? 'Attractions'}{' '}
                <span className="font-normal text-[#858c96]">
                  · {attractions.length}{' '}
                  {attractions.length === 1 ? 'place' : 'places'}
                </span>
              </h2>
              <p className="mt-1 text-xs text-[#858c96]">
                {activeCity
                  ? `Manage stops in ${activeCity.name}.`
                  : 'Add a city first.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeCity ? (
                <select
                  aria-label="Select city"
                  value={activeCity.id}
                  onChange={(event) => {
                    setSelectedCityId(event.target.value)
                    startNewAttraction()
                  }}
                  className={`${inputClass} mt-0 w-auto min-w-32 py-2`}
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              ) : null}
              {activeCity ? (
                <Button size="sm" onClick={startNewAttraction}>
                  Add place
                </Button>
              ) : null}
            </div>
          </div>

          {activeCity && attractionsQuery.isPending ? (
            <LoadingState label="Loading attractions…" />
          ) : activeCity && attractionsQuery.isError ? (
            <ErrorState
              title="Attractions could not be loaded"
              message={attractionsQuery.error.message}
              onRetry={() => void attractionsQuery.refetch()}
            />
          ) : (
            <>
              <div className="divide-y divide-[#edf0f2]">
                {attractions.map((attraction, index) => (
                  <div
                    key={attraction.id}
                    className="flex min-w-0 items-center gap-2 px-3 py-2.5 sm:px-4"
                  >
                    <div className="flex flex-col">
                      <button
                        type="button"
                        aria-label={`Move ${attraction.name} up`}
                        disabled={index === 0 || reorderMutation.isPending}
                        onClick={() => moveAttraction(index, -1)}
                        className="px-2 text-stone-600 disabled:opacity-30"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move ${attraction.name} down`}
                        disabled={
                          index === attractions.length - 1 ||
                          reorderMutation.isPending
                        }
                        onClick={() => moveAttraction(index, 1)}
                        className="px-2 text-stone-600 disabled:opacity-30"
                      >
                        ↓
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-[#303740]">
                        {attraction.sort_order}. {attraction.name}
                      </span>
                      <span className="block truncate text-xs text-[#858c96]">
                        {attraction.description || 'No description'}
                      </span>
                    </div>
                    <ImageThumb
                      src={attraction.image_url}
                      alt=""
                      className="h-12 w-16 shrink-0 rounded-md"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startAttractionEdit(attraction)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-700 hover:bg-red-50"
                      onClick={() =>
                        setPendingDelete({
                          type: 'attraction',
                          id: attraction.id,
                          name: attraction.name,
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                ))}
                {attractions.length === 0 ? (
                  <p className="px-5 py-8 text-center text-sm text-[#858c96]">
                    No places in this guide yet.
                  </p>
                ) : null}
              </div>

              {activeCity ? (
                <div
                  id="import"
                  className="scroll-mt-6 border-t border-[#edf0f2] p-4 sm:px-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[#303740]">
                        Bulk import
                      </h3>
                      <p className="mt-1 text-xs text-[#858c96]">
                        Append places from a JSON file or pasted data.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsImportOpen(!isImportOpen)}
                    >
                      {isImportOpen ? 'Close import' : 'Import JSON'}
                    </Button>
                  </div>
                  {isImportOpen ? (
                    <form className="mt-4" onSubmit={submitImport} noValidate>
                      <div className="mb-5 rounded-md border border-[#dfe5ed] bg-[#f7f9fb] p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-[#303740]">
                              Generate JSON with an LLM
                            </h4>
                            <p className="mt-1 max-w-2xl text-xs leading-5 text-[#737b86]">
                              Copy this prompt into an LLM. Review the
                              attraction names and image links, then paste its
                              JSON response into the field below.
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void copyImportPrompt()}
                          >
                            Copy prompt
                          </Button>
                        </div>
                        <label className="mt-3 block text-xs font-medium text-[#4b535e]">
                          Prompt for {activeCity?.name}
                          <textarea
                            aria-label="Prompt for LLM"
                            readOnly
                            rows={13}
                            value={importPrompt}
                            onFocus={(event) => event.currentTarget.select()}
                            className={`${inputClass} font-mono text-xs leading-5`}
                          />
                        </label>
                        {promptCopyStatus ? (
                          <p
                            role="status"
                            className="mt-2 text-xs text-[#52647b]"
                          >
                            {promptCopyStatus}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-xs text-[#737b86]">
                        Add up to 500 attractions. Existing entries are kept,
                        and imported order values set their relative order.
                      </p>
                      <label className="mt-3 block text-sm font-medium text-[#4b535e]">
                        JSON places
                        <textarea
                          aria-label="Attractions JSON"
                          rows={10}
                          value={importDraft}
                          onChange={(event) => {
                            setImportDraft(event.target.value)
                            setImportValidationError(null)
                            setImportSuccess(null)
                          }}
                          className={inputClass}
                          placeholder={
                            '{\n  "places": [\n    {\n      "name": "Frauenkirche",\n      "description": "A historic church.",\n      "imageUrl": "https://example.com/church.jpg",\n      "order": 1\n    }\n  ]\n}'
                          }
                        />
                      </label>
                      {importValidationError ? (
                        <FormError message={importValidationError} />
                      ) : null}
                      {importSuccess ? (
                        <p
                          role="status"
                          className="mt-3 text-sm text-emerald-800"
                        >
                          {importSuccess}
                        </p>
                      ) : null}
                      <Button
                        type="submit"
                        className="mt-4"
                        disabled={
                          importMutation.isPending || attractionsQuery.isPending
                        }
                      >
                        {importMutation.isPending
                          ? 'Importing…'
                          : 'Import attractions'}
                      </Button>
                    </form>
                  ) : null}
                </div>
              ) : null}

              {activeCity ? (
                isAttractionFormOpen ? (
                  <form
                    className="border-t border-[#edf0f2] p-4 sm:p-5"
                    onSubmit={submitAttraction}
                    noValidate
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-stone-900">
                        {editingAttractionId
                          ? 'Edit attraction'
                          : 'New attraction'}
                      </h3>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAttractionFormOpen(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <label className="block text-sm font-medium text-stone-700">
                        Name
                        <input
                          required
                          value={attractionDraft.name}
                          onChange={(event) =>
                            setAttractionDraft({
                              ...attractionDraft,
                              name: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>
                      <ImageUrlField
                        value={attractionDraft.image_url}
                        onChange={(image_url) =>
                          setAttractionDraft({ ...attractionDraft, image_url })
                        }
                      />
                      <label className="block text-sm font-medium text-stone-700 sm:col-span-2">
                        Description
                        <textarea
                          rows={3}
                          value={attractionDraft.description}
                          onChange={(event) =>
                            setAttractionDraft({
                              ...attractionDraft,
                              description: event.target.value,
                            })
                          }
                          className={inputClass}
                        />
                      </label>
                      <label className="block text-sm font-medium text-stone-700 sm:col-span-2">
                        Full place description
                        <textarea
                          rows={5}
                          value={attractionDraft.long_description}
                          onChange={(event) =>
                            setAttractionDraft({
                              ...attractionDraft,
                              long_description: event.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="Additional visitor information for the place page"
                        />
                      </label>
                      <label className="block text-sm font-medium text-stone-700 sm:col-span-2">
                        Gallery image URLs (one per line)
                        <textarea
                          rows={3}
                          value={attractionDraft.gallery_image_urls}
                          onChange={(event) =>
                            setAttractionDraft({
                              ...attractionDraft,
                              gallery_image_urls: event.target.value,
                            })
                          }
                          className={inputClass}
                          placeholder="https://example.com/gallery-1.jpg"
                        />
                      </label>
                    </div>
                    {attractionValidationError ? (
                      <FormError message={attractionValidationError} />
                    ) : null}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        type="submit"
                        disabled={saveAttractionMutation.isPending}
                      >
                        {saveAttractionMutation.isPending
                          ? 'Saving…'
                          : 'Save attraction'}
                      </Button>
                    </div>
                  </form>
                ) : null
              ) : null}
            </>
          )}
        </section>
      </div>

      {pendingDelete ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-title"
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h2
              id="delete-title"
              className="text-xl font-semibold text-stone-950"
            >
              Delete {pendingDelete.name}?
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {pendingDelete.type === 'city'
                ? 'This also deletes its attractions and associated visit progress.'
                : 'This also deletes associated visit progress.'}
            </p>
            {deleteMutation.error ? (
              <FormError message={getErrorMessage(deleteMutation.error)} />
            ) : null}
            <div className="mt-6 flex justify-end gap-2">
              <Button
                variant="outline"
                disabled={deleteMutation.isPending}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-700 hover:bg-red-800"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(pendingDelete)}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminPageFrame>
  )
}

function ImageUrlField({
  value,
  onChange,
}: {
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-stone-700">
        Image URL (HTTPS)
        <input
          type="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={inputClass}
          placeholder="https://example.com/image.jpg"
        />
      </label>
      {value.trim() ? (
        <ImageThumb
          src={value}
          alt="Image preview"
          className="mt-2 h-20 w-28 rounded-md"
        />
      ) : null}
    </div>
  )
}

function ImageThumb({
  src,
  alt,
  className,
}: {
  src: string
  alt: string
  className: string
}) {
  const [failed, setFailed] = useState(false)
  if (!src.trim() || failed) {
    return (
      <div
        aria-hidden="true"
        className={`${className} flex items-center justify-center bg-stone-100 text-[10px] text-stone-400`}
      >
        No image
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`${className} object-cover`}
      onError={() => setFailed(true)}
    />
  )
}

function FormError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-3 text-sm text-red-800">
      {message}
    </p>
  )
}

const inputClass =
  'mt-1.5 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-emerald-800 focus:ring-2 focus:ring-emerald-800/15'
