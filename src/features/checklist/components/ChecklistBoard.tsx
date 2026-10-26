import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { AttractionCard } from '@/features/cities/components/AttractionCard'
import { sortAttractionsByVisited } from '@/features/checklist/sorting'
import type { Attraction } from '@/features/checklist/sorting'
import { useChecklist } from '@/features/checklist/useChecklist'

type ChecklistState = ReturnType<typeof useChecklist>

type ChecklistBoardProps = {
  attractions: Attraction[]
  checklist: ChecklistState
  storageLabel?: string
}

export function ChecklistBoard({
  attractions,
  checklist,
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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-stone-600" aria-live="polite">
          Visited {visitedCount} of {attractions.length}
        </p>
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

      <div className="-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-6 sm:-mx-8 sm:gap-5 sm:px-8">
        {sortAttractionsByVisited(attractions, checklist.visitedIds).map(
          (attraction) => (
            <AttractionCard
              key={attraction.id}
              attraction={attraction}
              visited={checklist.visitedIds.has(attraction.id)}
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
