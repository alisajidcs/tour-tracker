import type { Database } from '@/types/database'

export type Attraction = Database['public']['Tables']['attractions']['Row']

export function sortAttractionsByVisited(
  attractions: readonly Attraction[],
  visitedAttractionIds: ReadonlySet<string>,
): Attraction[] {
  return attractions
    .map((attraction, index) => ({ attraction, index }))
    .sort((left, right) => {
      const leftVisited = visitedAttractionIds.has(left.attraction.id)
      const rightVisited = visitedAttractionIds.has(right.attraction.id)

      if (leftVisited !== rightVisited) return leftVisited ? 1 : -1

      const orderDifference =
        left.attraction.sort_order - right.attraction.sort_order
      if (orderDifference !== 0) return orderDifference

      return left.index - right.index
    })
    .map(({ attraction }) => attraction)
}
