export interface ChecklistStorage {
  readonly cacheKey: string
  readonly staleTime: number
  getVisitedAttractionIds(): Promise<string[]>
  setVisitedAttraction(attractionId: string, visited: boolean): Promise<void>
  saveVisitedAttractionIds(ids: readonly string[]): Promise<void>
}

const STORAGE_KEY = 'tour-tracker:visited-attractions:v1'

function getBrowserStorage(): Storage {
  try {
    if (typeof window === 'undefined') {
      throw new Error('Browser storage is unavailable.')
    }

    return window.localStorage
  } catch {
    throw new Error(
      'Checklist storage is unavailable. Enable browser storage to save your progress.',
    )
  }
}

export const localChecklistStorage: ChecklistStorage = {
  cacheKey: 'guest',
  staleTime: Infinity,
  async getVisitedAttractionIds() {
    const storage = getBrowserStorage()
    let savedValue: string | null

    try {
      savedValue = storage.getItem(STORAGE_KEY)
    } catch {
      throw new Error('Checklist progress could not be read from this browser.')
    }

    if (!savedValue) return []

    try {
      const parsed: unknown = JSON.parse(savedValue)
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        !('visitedAttractionIds' in parsed) ||
        !Array.isArray(parsed.visitedAttractionIds) ||
        !parsed.visitedAttractionIds.every((id) => typeof id === 'string')
      ) {
        throw new Error('Invalid checklist data.')
      }

      return [...new Set(parsed.visitedAttractionIds)]
    } catch {
      throw new Error(
        'Saved checklist progress is invalid and could not be loaded.',
      )
    }
  },

  async saveVisitedAttractionIds(ids) {
    const storage = getBrowserStorage()

    try {
      storage.setItem(
        STORAGE_KEY,
        JSON.stringify({ visitedAttractionIds: [...new Set(ids)] }),
      )
    } catch {
      throw new Error(
        'Checklist progress could not be saved. Check browser storage settings and try again.',
      )
    }
  },

  async setVisitedAttraction(attractionId, visited) {
    const ids = new Set(await this.getVisitedAttractionIds())
    if (visited) ids.add(attractionId)
    else ids.delete(attractionId)
    await this.saveVisitedAttractionIds([...ids])
  },
}
