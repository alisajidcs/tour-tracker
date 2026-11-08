import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { AttractionCard } from '@/features/cities/components/AttractionCard'
import { sortAttractionsByVisited } from '@/features/checklist/sorting'
import type { Attraction } from '@/features/checklist/sorting'
import { useChecklist } from '@/features/checklist/useChecklist'

type ChecklistState = ReturnType<typeof useChecklist>

type ChecklistBoardProps = {
  attractions: Attraction[]
  checklist: ChecklistState
  cityName?: string
  storageLabel?: string
}

export function ChecklistBoard({
  attractions,
  checklist,
  cityName = '',
  storageLabel = 'Progress is saved in this browser.',
}: ChecklistBoardProps) {
  if (checklist.checklistQuery.isPending) {
    return <LoadingState label="Loading checklist progress…" />
  }

  if (checklist.checklistQuery.isError) {
    return (
      <ErrorState
        title="Checklist progress is unavailable"
        message={checklist.checklistQuery.error.message}
        onRetry={() => void checklist.checklistQuery.refetch()}
      />
    )
  }

  const visitedCount = attractions.filter((attraction) =>
    checklist.visitedIds.has(attraction.id),
  ).length

  return (
    <>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/80 bg-white/75 px-4 py-3.5 shadow-sm shadow-stone-900/5 sm:px-5">
        <div className="flex min-w-44 flex-1 items-center gap-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 font-serif text-sm font-semibold text-emerald-900"
            aria-hidden="true"
          >
            {visitedCount}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold text-stone-900"
              aria-live="polite"
            >
              {visitedCount} of {attractions.length} places visited
            </p>
            <div
              className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-label="Places visited"
              aria-valuemin={0}
              aria-valuemax={attractions.length}
              aria-valuenow={visitedCount}
            >
              <div
                className="h-full rounded-full bg-emerald-800 transition-[width] duration-300"
                style={{
                  width: `${attractions.length ? (visitedCount / attractions.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-stone-500">{storageLabel}</p>
      </div>

      {checklist.saveError ? (
        <p
          role="alert"
          className="mb-5 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          {checklist.saveError}
        </p>
      ) : null}

      <div className="columns-1 gap-x-6 md:columns-2 xl:columns-3">
        {sortAttractionsByVisited(attractions, checklist.visitedIds).map(
          (attraction) => (
            <AttractionCard
              key={attraction.id}
              attraction={attraction}
              visited={checklist.visitedIds.has(attraction.id)}
              cityName={cityName}
              disabled={
                checklist.isSaving || checklist.checklistQuery.isPending
              }
              onVisitedChange={(visited) =>
                checklist.setVisited(attraction.id, visited)
              }
            />
          ),
        )}
      </div>
    </>
  )
}
