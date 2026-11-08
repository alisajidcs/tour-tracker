import { useMemo, useState } from 'react'
import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { ChecklistBoard } from '@/features/checklist/components/ChecklistBoard'
import { ChecklistConflictDialog } from '@/features/checklist/components/ChecklistConflictDialog'
import { resolveChecklistConflict } from '@/features/checklist/conflicts'
import { SupabaseChecklistStorage } from '@/features/checklist/cloudStorage'
import type { Attraction } from '@/features/checklist/sorting'
import { localChecklistStorage } from '@/features/checklist/storage'
import type { ChecklistConflictChoice } from '@/features/checklist/conflicts'
import { useChecklist } from '@/features/checklist/useChecklist'
import { useAuth } from '@/features/auth/AuthContext'

export function ChecklistExperience({
  attractions,
  cityName,
}: {
  attractions: Attraction[]
  cityName?: string
}) {
  const auth = useAuth()

  if (auth.isLoading) return <LoadingState label="Checking sign-in status…" />

  return auth.user ? (
    <AuthenticatedChecklist
      attractions={attractions}
      cityName={cityName}
      userId={auth.user.id}
    />
  ) : (
    <GuestChecklist attractions={attractions} cityName={cityName} />
  )
}

function GuestChecklist({
  attractions,
  cityName,
}: {
  attractions: Attraction[]
  cityName?: string
}) {
  const checklist = useChecklist(localChecklistStorage)
  return (
    <ChecklistBoard
      attractions={attractions}
      checklist={checklist}
      cityName={cityName}
    />
  )
}

function AuthenticatedChecklist({
  attractions,
  cityName,
  userId,
}: {
  attractions: Attraction[]
  cityName?: string
  userId: string
}) {
  const localChecklist = useChecklist(localChecklistStorage)
  const cloudStorage = useMemo(
    () => new SupabaseChecklistStorage(userId),
    [userId],
  )
  const cloudChecklist = useChecklist(cloudStorage)
  const [isResolving, setIsResolving] = useState(false)
  const [resolutionError, setResolutionError] = useState<string | null>(null)

  if (
    localChecklist.checklistQuery.isPending ||
    cloudChecklist.checklistQuery.isPending
  ) {
    return <LoadingState label="Loading your account checklist…" />
  }

  if (localChecklist.checklistQuery.isError) {
    return (
      <ErrorState
        title="Guest progress could not be loaded"
        message={localChecklist.checklistQuery.error.message}
        onRetry={() => void localChecklist.checklistQuery.refetch()}
      />
    )
  }

  if (cloudChecklist.checklistQuery.isError) {
    return (
      <ErrorState
        title="Account progress could not be synchronized"
        message={cloudChecklist.checklistQuery.error.message}
        onRetry={() => void cloudChecklist.checklistQuery.refetch()}
      />
    )
  }

  const localIds = localChecklist.checklistQuery.data
  const cloudIds = cloudChecklist.checklistQuery.data

  if (localIds.length > 0) {
    const onResolve = async (choice: ChecklistConflictChoice) => {
      setIsResolving(true)
      setResolutionError(null)
      try {
        await resolveChecklistConflict(
          choice,
          localIds,
          cloudIds,
          cloudChecklist.replaceVisitedAttractionIds,
          () => localChecklist.replaceVisitedAttractionIds([]),
        )
      } catch (error) {
        setResolutionError(
          error instanceof Error
            ? error.message
            : 'Checklist progress could not be synchronized. Your guest data is still saved.',
        )
      } finally {
        setIsResolving(false)
      }
    }

    return (
      <ChecklistConflictDialog
        localCount={localIds.length}
        cloudCount={cloudIds.length}
        isResolving={isResolving}
        error={resolutionError}
        onResolve={(choice) => void onResolve(choice)}
      />
    )
  }

  return (
    <ChecklistBoard
      attractions={attractions}
      checklist={cloudChecklist}
      cityName={cityName}
      storageLabel="Progress is saved to your account and syncs across devices."
    />
  )
}
