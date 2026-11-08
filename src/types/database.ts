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
          long_description: string
          gallery_image_urls: string[]
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          city_id: string
          name: string
          description?: string
          image_url?: string
          long_description?: string
          gallery_image_urls?: string[]
          sort_order: number
          created_at?: string
        }
        Update: {
          id?: string
          city_id?: string
          name?: string
          description?: string
          image_url?: string
          long_description?: string
          gallery_image_urls?: string[]
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
      admin_users: {
        Row: {
          user_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      city_requests: {
        Row: {
          id: string
          user_id: string
          city_name: string
          created_at: string
          status: 'pending' | 'fulfilled'
          fulfilled_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string
          city_name: string
          created_at?: string
          status?: 'pending' | 'fulfilled'
          fulfilled_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          city_name?: string
          created_at?: string
          status?: 'pending' | 'fulfilled'
          fulfilled_at?: string | null
        }
        Relationships: []
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
      reorder_city_attractions: {
        Args: { p_city_id: string; p_attraction_ids: string[] }
        Returns: undefined
      }
      append_city_attractions: {
        Args: { p_city_id: string; p_places: Json[] }
        Returns: number
      }
      create_city_with_attractions: {
        Args: { p_city: Json; p_places: Json[] }
        Returns: string
      }
      create_city_from_request: {
        Args: {
          p_request_id: string
          p_name: string
          p_description: string
          p_image_url: string
        }
        Returns: string
      }
      create_city_with_request_attractions: {
        Args: { p_request_id: string; p_city: Json; p_places: Json[] }
        Returns: string
      }
      create_city_attraction: {
        Args: {
          p_city_id: string
          p_name: string
          p_description: string
          p_image_url: string
          p_long_description: string
          p_gallery_image_urls: string[]
        }
        Returns: string
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
