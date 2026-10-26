export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string
          name: string
          description: string
          image_url: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          image_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          image_url?: string
          created_at?: string
        }
        Relationships: []
      }
      attractions: {
        Row: {
          id: string
          city_id: string
          name: string
          description: string
          image_url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          description?: string
          image_url?: string
          sort_order: number
          created_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          description?: string
          image_url?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'attractions_city_id_fkey'
            columns: ['city_id']
            isOneToOne: false
            referencedRelation: 'cities'
            referencedColumns: ['id']
          },
        ]
      }
      user_visits: {
        Row: {
          user_id: string
          attraction_id: string
          visited_at: string
        }
        Insert: {
          user_id: string
          attraction_id: string
          visited_at?: string
        }
        Update: {
          user_id?: string
          attraction_id?: string
          visited_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_visits_attraction_id_fkey'
            columns: ['attraction_id']
            isOneToOne: false
            referencedRelation: 'attractions'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      set_user_visit: {
        Args: { p_attraction_id: string; p_visited: boolean }
        Returns: undefined
      }
      replace_user_visits: {
        Args: { visited_ids: string[] }
        Returns: undefined
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
