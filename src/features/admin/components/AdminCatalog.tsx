import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { Button } from '@/components/ui/button'
import {
  createAttraction,
  createCity,
  deleteAttraction,
  deleteCity,
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
import { validateAttractionImport } from '@/features/admin/importValidation'
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
  const [editingCityId, setEditingCityId] = useState<string | null>(null)
  const [cityValidationError, setCityValidationError] = useState<string | null>(
    null,
  )
  const [attractionDraft, setAttractionDraft] = useState({
    name: '',
    description: '',
    image_url: '',
  })
  const [editingAttractionId, setEditingAttractionId] = useState<string | null>(
    null,
  )
  const [attractionValidationError, setAttractionValidationError] = useState<
    string | null
  >(null)
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget | null>(null)
  const [importDraft, setImportDraft] = useState('')
  const [importValidationError, setImportValidationError] = useState<
    string | null
  >(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)

  const saveCityMutation = useMutation({
    mutationFn: ({ id, input }: { id: string | null; input: CityInput }) =>
      id ? updateCity(id, input) : createCity(input),
    onSuccess: async (city) => {
      setSelectedCityId(city.id)
      setCityDraft({
        name: city.name,
        description: city.description,
        image_url: city.image_url,
      })
      setEditingCityId(city.id)
      setCityValidationError(null)
      await queryClient.invalidateQueries({ queryKey: ['cities'] })
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
      setAttractionDraft({ name: '', description: '', image_url: '' })
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
        setAttractionDraft({ name: '', description: '', image_url: '' })
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
      setImportValidationError(null)
      setImportSuccess(
        `Imported ${count} ${count === 1 ? 'attraction' : 'attractions'}.`,
      )
      await queryClient.invalidateQueries({
        queryKey: ['attractions', activeCity?.id],
      })
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
  const attractions = attractionsQuery.data ?? []

  function startCityEdit(city: City) {
    setEditingCityId(city.id)
    setCityDraft({
      name: city.name,
      description: city.description,
      image_url: city.image_url,
    })
    setCityValidationError(null)
  }

  function startNewCity() {
    setEditingCityId(null)
    setCityDraft(emptyCity)
    setCityValidationError(null)
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
      input: { ...cityDraft, name: cityDraft.name.trim() },
    })
  }

  function startAttractionEdit(attraction: Attraction) {
    setEditingAttractionId(attraction.id)
    setAttractionDraft({
      name: attraction.name,
      description: attraction.description,
      image_url: attraction.image_url,
    })
    setAttractionValidationError(null)
  }

  function startNewAttraction() {
    setEditingAttractionId(null)
    setAttractionDraft({ name: '', description: '', image_url: '' })
    setAttractionValidationError(null)
  }

  function submitAttraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeCity) return
    const nameError = validateCatalogName(attractionDraft.name)
    const imageError = validateImageUrl(attractionDraft.image_url)
    const nextOrder = editingAttractionId
      ? (attractions.find((item) => item.id === editingAttractionId)
          ?.sort_order ?? 1)
      : Math.max(0, ...attractions.map((item) => item.sort_order)) + 1
    const orderError = validateSortOrder(nextOrder)
    if (nameError || imageError || orderError) {
      setAttractionValidationError(nameError ?? imageError ?? orderError)
      return
    }
    saveAttractionMutation.mutate({
      id: editingAttractionId,
      input: {
        city_id: activeCity.id,
        ...attractionDraft,
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
    <AdminPageFrame>
      <div className="mb-8">
        <p className="text-sm font-medium text-emerald-800">Administrator</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
          Manage city guides
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
          Changes publish directly to the shared catalog. Removing a city also
          removes its attractions and their associated visit records.
        </p>
      </div>

      {(saveCityMutation.error ||
        saveAttractionMutation.error ||
        deleteMutation.error ||
        reorderMutation.error ||
        importMutation.error) && (
        <p
          className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          {getErrorMessage(
            saveCityMutation.error ??
              saveAttractionMutation.error ??
              deleteMutation.error ??
              reorderMutation.error ??
              importMutation.error,
          )}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">Cities</h2>
              <p className="mt-1 text-sm text-stone-500">
                {cities.length} {cities.length === 1 ? 'guide' : 'guides'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={startNewCity}>
              Add city
            </Button>
          </div>

          <div className="mt-5 space-y-2">
            {cities.map((city) => (
              <div
                key={city.id}
                className={`flex items-center justify-between gap-2 rounded-2xl border p-3 ${activeCity?.id === city.id ? 'border-emerald-800/40 bg-emerald-50/50' : 'border-stone-200'}`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityId(city.id)
                    setEditingAttractionId(null)
                    startNewAttraction()
                  }}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate text-sm font-semibold text-stone-900">
                    {city.name}
                  </span>
                  <span className="block truncate text-xs text-stone-500">
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

          <form
            className="mt-6 border-t border-stone-200 pt-5"
            onSubmit={submitCity}
            noValidate
          >
            <h3 className="font-semibold text-stone-900">
              {editingCityId ? 'Edit city' : 'New city'}
            </h3>
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-stone-700">
                Name
                <input
                  required
                  value={cityDraft.name}
                  onChange={(event) =>
                    setCityDraft({ ...cityDraft, name: event.target.value })
                  }
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
            {cityValidationError ? (
              <FormError message={cityValidationError} />
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="submit" disabled={saveCityMutation.isPending}>
                {saveCityMutation.isPending ? 'Saving…' : 'Save city'}
              </Button>
              {editingCityId ? (
                <Button type="button" variant="outline" onClick={startNewCity}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Attractions
              </h2>
              <p className="mt-1 text-sm text-stone-500">
                {activeCity
                  ? `Manage stops in ${activeCity.name}.`
                  : 'Add a city first.'}
              </p>
            </div>
            {activeCity ? (
              <label className="text-sm font-medium text-stone-700">
                City
                <select
                  aria-label="Select city"
                  value={activeCity.id}
                  onChange={(event) => {
                    setSelectedCityId(event.target.value)
                    startNewAttraction()
                  }}
                  className={inputClass}
                >
                  {cities.map((city) => (
                    <option key={city.id} value={city.id}>
                      {city.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
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
              <div className="mt-5 space-y-2">
                {attractions.map((attraction, index) => (
                  <div
                    key={attraction.id}
                    className="flex items-center gap-2 rounded-2xl border border-stone-200 p-3"
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
                      <span className="block truncate text-sm font-semibold text-stone-900">
                        {attraction.sort_order}. {attraction.name}
                      </span>
                      <span className="block truncate text-xs text-stone-500">
                        {attraction.description || 'No description'}
                      </span>
                    </div>
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
                  <p className="rounded-2xl border border-dashed border-stone-300 px-4 py-6 text-center text-sm text-stone-500">
                    No attractions yet. Add the first stop below.
                  </p>
                ) : null}
              </div>

              {activeCity ? (
                <form
                  className="mt-6 border-t border-stone-200 pt-5"
                  onSubmit={submitImport}
                  noValidate
                >
                  <h3 className="font-semibold text-stone-900">
                    Import attractions from JSON
                  </h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Add up to 500 attractions. Existing entries are kept, and
                    imported order values set their relative order.
                  </p>
                  <label className="mt-4 block text-sm font-medium text-stone-700">
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
                    <p role="status" className="mt-3 text-sm text-emerald-800">
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

              {activeCity ? (
                <form
                  className="mt-6 border-t border-stone-200 pt-5"
                  onSubmit={submitAttraction}
                  noValidate
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-semibold text-stone-900">
                      {editingAttractionId
                        ? 'Edit attraction'
                        : 'New attraction'}
                    </h3>
                    {!editingAttractionId ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={startNewAttraction}
                      >
                        Clear
                      </Button>
                    ) : null}
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
                    {editingAttractionId ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={startNewAttraction}
                      >
                        Cancel edit
                      </Button>
                    ) : null}
                  </div>
                </form>
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
