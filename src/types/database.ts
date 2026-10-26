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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
