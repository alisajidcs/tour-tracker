import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { ChecklistStorage } from './storage'
import { useChecklist } from './useChecklist'

describe('useChecklist storage cache isolation', () => {
  it('keeps different storage implementations in separate query caches', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const firstStorage: ChecklistStorage = {
      cacheKey: 'account:first',
      staleTime: 0,
      getVisitedAttractionIds: async () => ['first-attraction'],
      setVisitedAttraction: async () => {},
      saveVisitedAttractionIds: async () => {},
    }
    const secondStorage: ChecklistStorage = {
      cacheKey: 'account:second',
      staleTime: 0,
      getVisitedAttractionIds: async () => ['second-attraction'],
      setVisitedAttraction: async () => {},
      saveVisitedAttractionIds: async () => {},
    }

    const first = renderHook(() => useChecklist(firstStorage), { wrapper })
    const second = renderHook(() => useChecklist(secondStorage), { wrapper })

    await waitFor(() => {
      expect(first.result.current.visitedIds.has('first-attraction')).toBe(true)
      expect(second.result.current.visitedIds.has('second-attraction')).toBe(
        true,
      )
    })
    expect(first.result.current.visitedIds.has('second-attraction')).toBe(false)
    expect(second.result.current.visitedIds.has('first-attraction')).toBe(false)

    first.unmount()
    second.unmount()
    queryClient.clear()
  })

  it('persists a checkbox change as a single-item update', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    })
    const wrapper = ({ children }: PropsWithChildren) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
    const setVisitedAttraction = vi.fn(async () => {})
    const saveVisitedAttractionIds = vi.fn(async () => {})
    const storage: ChecklistStorage = {
      cacheKey: 'account:single-update',
      staleTime: 0,
      getVisitedAttractionIds: async () => ['existing-attraction'],
      setVisitedAttraction,
      saveVisitedAttractionIds,
    }
    const checklist = renderHook(() => useChecklist(storage), { wrapper })

    await waitFor(() =>
      expect(
        checklist.result.current.visitedIds.has('existing-attraction'),
      ).toBe(true),
    )

    act(() => checklist.result.current.setVisited('new-attraction', true))

    await waitFor(() =>
      expect(setVisitedAttraction).toHaveBeenCalledWith('new-attraction', true),
    )
    expect(saveVisitedAttractionIds).not.toHaveBeenCalled()
    expect(checklist.result.current.visitedIds.has('new-attraction')).toBe(true)

    checklist.unmount()
    queryClient.clear()
  })
})
