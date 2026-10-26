import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import {
  localChecklistStorage,
  type ChecklistStorage,
} from '@/features/checklist/storage'

export function useChecklist(
  storage: ChecklistStorage = localChecklistStorage,
) {
  const queryClient = useQueryClient()
  const checklistQueryKey = ['checklist', storage.cacheKey] as const
  const [saveError, setSaveError] = useState<string | null>(null)
  const checklistQuery = useQuery({
    queryKey: checklistQueryKey,
    queryFn: () => storage.getVisitedAttractionIds(),
    staleTime: Infinity,
    retry: false,
  })

  const saveMutation = useMutation({
    mutationFn: (ids: readonly string[]) =>
      storage.saveVisitedAttractionIds(ids),
    onMutate: async (ids) => {
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
    saveMutation.mutate([...nextIds])
  }

  return {
    checklistQuery,
    visitedIds,
    isSaving: saveMutation.isPending,
    saveError,
    setVisited,
  }
}
