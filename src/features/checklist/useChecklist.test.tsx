import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { PropsWithChildren } from 'react'
import { describe, expect, it } from 'vitest'
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
      getVisitedAttractionIds: async () => ['first-attraction'],
      saveVisitedAttractionIds: async () => {},
    }
    const secondStorage: ChecklistStorage = {
      cacheKey: 'account:second',
      getVisitedAttractionIds: async () => ['second-attraction'],
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
})
