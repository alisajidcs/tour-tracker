export type ChecklistConflictChoice = 'keep-local' | 'keep-cloud' | 'merge'

export async function resolveChecklistConflict(
  choice: ChecklistConflictChoice,
  localIds: readonly string[],
  cloudIds: readonly string[],
  saveCloud: (ids: readonly string[]) => Promise<void>,
  clearLocal: () => Promise<void>,
) {
  const idsToKeep =
    choice === 'keep-cloud'
      ? [...new Set(cloudIds)]
      : choice === 'keep-local'
        ? [...new Set(localIds)]
        : [...new Set([...localIds, ...cloudIds])]

  if (choice !== 'keep-cloud') {
    await saveCloud(idsToKeep)
  }

  await clearLocal()
  return idsToKeep
}
