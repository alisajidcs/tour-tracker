import { beforeEach, describe, expect, it, vi } from 'vitest'
import { localChecklistStorage } from './storage'

const storageKey = 'tour-tracker:visited-attractions:v1'

describe('local checklist storage', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.restoreAllMocks()
  })

  it('starts with no visited attractions', async () => {
    await expect(
      localChecklistStorage.getVisitedAttractionIds(),
    ).resolves.toEqual([])
  })

  it('persists unique visited attraction ids', async () => {
    await localChecklistStorage.saveVisitedAttractionIds([
      'attraction-1',
      'attraction-1',
      'attraction-2',
    ])

    await expect(
      localChecklistStorage.getVisitedAttractionIds(),
    ).resolves.toEqual(['attraction-1', 'attraction-2'])
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? '{}')).toEqual(
      {
        visitedAttractionIds: ['attraction-1', 'attraction-2'],
      },
    )
  })

  it('reports corrupt saved data without silently discarding it', async () => {
    window.localStorage.setItem(storageKey, '{invalid json')

    await expect(
      localChecklistStorage.getVisitedAttractionIds(),
    ).rejects.toThrow('Saved checklist progress is invalid')
    expect(window.localStorage.getItem(storageKey)).toBe('{invalid json')
  })

  it('reports when browser storage cannot be written', async () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage disabled')
    })

    await expect(
      localChecklistStorage.saveVisitedAttractionIds(['attraction-1']),
    ).rejects.toThrow('Checklist progress could not be saved')
  })
})
