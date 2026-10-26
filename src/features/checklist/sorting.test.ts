import { describe, expect, it } from 'vitest'
import type { Database } from '@/types/database'
import { sortAttractionsByVisited } from './sorting'

type Attraction = Database['public']['Tables']['attractions']['Row']

const attractions: Attraction[] = [
  {
    id: 'attraction-3',
    city_id: 'city-1',
    name: 'Third stop',
    description: '',
    image_url: '',
    sort_order: 3,
    created_at: '2026-01-03T00:00:00Z',
  },
  {
    id: 'attraction-1',
    city_id: 'city-1',
    name: 'First stop',
    description: '',
    image_url: '',
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'attraction-2',
    city_id: 'city-1',
    name: 'Second stop',
    description: '',
    image_url: '',
    sort_order: 2,
    created_at: '2026-01-02T00:00:00Z',
  },
]

describe('sortAttractionsByVisited', () => {
  it('keeps unvisited stops first and each group in recommended order', () => {
    const result = sortAttractionsByVisited(
      attractions,
      new Set(['attraction-1']),
    )

    expect(result.map(({ id }) => id)).toEqual([
      'attraction-2',
      'attraction-3',
      'attraction-1',
    ])
  })

  it('restores an unchecked stop to its recommended position', () => {
    const result = sortAttractionsByVisited(attractions, new Set())

    expect(result.map(({ id }) => id)).toEqual([
      'attraction-1',
      'attraction-2',
      'attraction-3',
    ])
  })
})
