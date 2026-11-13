import { useLayoutEffect, useRef, useState } from 'react'
import { Check, X } from 'lucide-react'
import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { AttractionCard } from '@/features/cities/components/AttractionCard'
import { useRestoreChecklistPosition } from '@/features/cities/guideNavigation'
import {
  sortAttractionsByVisited,
  type Attraction,
} from '@/features/checklist/sorting'
import type { useChecklist } from '@/features/checklist/useChecklist'

type VisitChange = { place: Attraction; visited: boolean }

type ChecklistBoardProps = {
  attractions: Attraction[]
  checklist: ReturnType<typeof useChecklist>
  cityName?: string
  storageLabel?: string
}

export function ChecklistBoard({
  attractions,
  checklist,
  cityName = '',
  storageLabel = 'Progress is saved in this browser.',
}: ChecklistBoardProps) {
  useRestoreChecklistPosition(checklist.checklistQuery.isSuccess)
  const [confirmation, setConfirmation] = useState<VisitChange | null>(null)
  const [failedChange, setFailedChange] = useState<VisitChange | null>(null)
  const [focusRequest, setFocusRequest] = useState<{
    id: string
    checked?: boolean
  } | null>(null)
  const changeInProgress = useRef(false)
  const heading = useRef<HTMLHeadingElement>(null)
  const undoButton = useRef<HTMLButtonElement>(null)

  useLayoutEffect(() => {
    if (!focusRequest || checklist.isSaving) return
    const target = document.getElementById(focusRequest.id)
    if (!target) return
    if (
      target instanceof HTMLInputElement &&
      target.checked !== focusRequest.checked
    )
      return

    target.focus({ preventScroll: !(target instanceof HTMLInputElement) })
    setFocusRequest(null)
  }, [checklist.checklistQuery.data, checklist.isSaving, focusRequest])

  async function changeVisit(change: VisitChange, undo = false) {
    if (changeInProgress.current || checklist.isSaving) return
    changeInProgress.current = true
    const active = document.activeElement
    const restoreFocus =
      undo ||
      (active instanceof HTMLElement &&
        (active === undoButton.current ||
          document
            .getElementById(`place-${change.place.id}`)
            ?.contains(active)))
    if (restoreFocus) heading.current?.focus({ preventScroll: true })

    setFailedChange(null)
    setConfirmation(null)
    const saved = await checklist.setVisited(change.place.id, change.visited)
    changeInProgress.current = false

    if (saved) {
      if (!undo) setConfirmation(change)
      if (
        restoreFocus &&
        (document.activeElement === heading.current ||
          document.activeElement === document.body)
      ) {
        setFocusRequest(
          undo
            ? { id: `visit-${change.place.id}`, checked: change.visited }
            : { id: 'undo-visit' },
        )
      }
    } else {
      setFailedChange(change)
      if (
        restoreFocus &&
        (document.activeElement === heading.current ||
          document.activeElement === document.body)
      ) {
        setFocusRequest({
          id: `visit-${change.place.id}`,
          checked: !change.visited,
        })
      }
    }
  }

  if (checklist.checklistQuery.isPending)
    return <LoadingState label="Loading checklist progress…" />

  if (checklist.checklistQuery.isError) {
    return (
      <ErrorState
        title="Checklist progress is unavailable"
        message={checklist.checklistQuery.error.message}
        onRetry={() => void checklist.checklistQuery.refetch()}
      />
    )
  }

  const sorted = sortAttractionsByVisited(attractions, checklist.visitedIds)
  const remaining = sorted.filter(
    (place) => !checklist.visitedIds.has(place.id),
  )
  const visited = sorted.slice(remaining.length)

  function renderPlaces(places: Attraction[]) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {places.map((place) => {
          const failure =
            failedChange?.place.id === place.id ? failedChange : null
          return (
            <AttractionCard
              key={place.id}
              attraction={place}
              visited={checklist.visitedIds.has(place.id)}
              cityName={cityName}
              disabled={checklist.isSaving}
              error={
                failure
                  ? (checklist.saveError ??
                    'Checklist progress could not be saved.')
                  : undefined
              }
              onRetry={failure ? () => void changeVisit(failure) : undefined}
              onVisitedChange={(nextVisited) =>
                void changeVisit({ place, visited: nextVisited })
              }
            />
          )
        })}
      </div>
    )
  }

  return (
    <>
      <div className="border-guide-line mb-6 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-y py-4 sm:mb-8">
        <div className="w-full max-w-72">
          <p
            className="mb-2 text-sm font-semibold tabular-nums"
            aria-live="polite"
          >
            {visited.length} of {attractions.length} places visited
          </p>
          <progress
            aria-label="Places visited"
            className="guide-progress"
            value={visited.length}
            max={attractions.length}
          />
        </div>
        <p className="text-guide-muted text-sm">{storageLabel}</p>
      </div>

      {confirmation ? (
        <div className="bg-guide-ink fixed inset-x-3 bottom-3 z-20 mx-auto flex max-w-lg items-center gap-2 rounded-xl px-3 py-2 text-white shadow-lg sm:bottom-6 sm:px-4">
          <Check size={18} aria-hidden="true" className="shrink-0" />
          <p role="status" className="min-w-0 flex-1 text-sm">
            {confirmation.place.name} marked{' '}
            {confirmation.visited ? 'visited' : 'unvisited'}.
          </p>
          <button
            id="undo-visit"
            ref={undoButton}
            type="button"
            className="min-h-11 shrink-0 rounded-md px-2 font-semibold underline underline-offset-4 focus-visible:outline-white!"
            onClick={() =>
              void changeVisit(
                { ...confirmation, visited: !confirmation.visited },
                true,
              )
            }
          >
            Undo
          </button>
          <button
            type="button"
            aria-label="Dismiss visit confirmation"
            className="grid size-11 shrink-0 place-items-center rounded-md hover:bg-white/15 focus-visible:outline-white!"
            onClick={() => {
              setFocusRequest({ id: 'places-heading' })
              setConfirmation(null)
            }}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ) : null}
      <h2
        ref={heading}
        tabIndex={-1}
        id="places-heading"
        className="guide-display mb-5 scroll-mt-4 text-3xl sm:text-4xl"
      >
        Recommended places
      </h2>
      {remaining.length ? (
        renderPlaces(remaining)
      ) : (
        <p className="text-guide-muted">
          You’ve visited every place in this guide.
        </p>
      )}

      {visited.length ? (
        <section
          aria-labelledby="visited-places"
          className="border-guide-line mt-10 border-t pt-6"
        >
          <h2 id="visited-places" className="guide-display mb-5 text-3xl">
            Visited places
          </h2>
          {renderPlaces(visited)}
        </section>
      ) : null}
    </>
  )
}
