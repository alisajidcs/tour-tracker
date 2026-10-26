import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  localChecklistStorage,
  type ChecklistStorage,
} from '@/features/checklist/storage'

type ChecklistUpdate =
  | { type: 'set'; attractionId: string; visited: boolean; ids: string[] }
  | { type: 'replace'; ids: string[] }

export function useChecklist(
  storage: ChecklistStorage = localChecklistStorage,
) {
  const queryClient = useQueryClient()
  const checklistQueryKey = ['checklist', storage.cacheKey] as const
  const [saveError, setSaveError] = useState<string | null>(null)
  const checklistQuery = useQuery({
    queryKey: checklistQueryKey,
    queryFn: () => storage.getVisitedAttractionIds(),
    staleTime: storage.staleTime,
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (update: ChecklistUpdate) =>
      update.type === 'set'
        ? storage.setVisitedAttraction(update.attractionId, update.visited)
        : storage.saveVisitedAttractionIds(update.ids),
    onMutate: async ({ ids }) => {
      await queryClient.cancelQueries({ queryKey: checklistQueryKey })
      const previousIds = queryClient.getQueryData<string[]>(checklistQueryKey)
      queryClient.setQueryData(checklistQueryKey, [...ids])
      setSaveError(null)
      return { previousIds }
    },
    onError: (error, _ids, context) => {
      if (context?.previousIds) {
        queryClient.setQueryData(checklistQueryKey, context.previousIds)
      }
      setSaveError(error.message)
    },
    onSuccess: () => setSaveError(null),
  })

  const visitedIds = new Set(checklistQuery.data ?? [])

  function setVisited(attractionId: string, visited: boolean) {
    if (saveMutation.isPending || checklistQuery.data === undefined) return

    const nextIds = new Set(checklistQuery.data)
    if (visited) nextIds.add(attractionId)
    else nextIds.delete(attractionId)
    saveMutation.mutate({
      type: 'set',
      attractionId,
      visited,
      ids: [...nextIds],
    })
  }

  async function replaceVisitedAttractionIds(ids: readonly string[]) {
    if (checklistQuery.data === undefined) {
      throw new Error('Checklist progress is still loading.')
    }
    if (saveMutation.isPending) {
      throw new Error('Wait for the current checklist save to finish.')
    }

    await saveMutation.mutateAsync({
      type: 'replace',
      ids: [...new Set(ids)],
    })
  }

  return {
    checklistQuery,
    visitedIds,
    isSaving: saveMutation.isPending,
    saveError,
    setVisited,
    replaceVisitedAttractionIds,
  }
}
