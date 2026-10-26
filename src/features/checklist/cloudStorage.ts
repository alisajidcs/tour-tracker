import { supabase } from '@/lib/supabase'
import type { ChecklistStorage } from '@/features/checklist/storage'

export class SupabaseChecklistStorage implements ChecklistStorage {
  readonly cacheKey: string
  readonly staleTime = 0

  constructor(userId: string) {
    this.cacheKey = `user:${userId}`
  }

  async getVisitedAttractionIds() {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { data, error } = await supabase
      .from('user_visits')
      .select('attraction_id')

    if (error) throw error
    return data.map(({ attraction_id }) => attraction_id)
  }

  async saveVisitedAttractionIds(ids: readonly string[]) {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { error } = await supabase.rpc('replace_user_visits', {
      visited_ids: [...new Set(ids)],
    })

    if (error) throw error
  }

  async setVisitedAttraction(attractionId: string, visited: boolean) {
    if (!supabase) throw new Error('Supabase is not configured.')

    const { error } = await supabase.rpc('set_user_visit', {
      p_attraction_id: attractionId,
      p_visited: visited,
    })

    if (error) throw error
  }
}
