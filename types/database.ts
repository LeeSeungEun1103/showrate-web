/**
 * Supabase 데이터베이스 타입 정의
 * ERD를 기반으로 작성되었습니다.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      user: {
        Row: {
          id: string; // uuid
          email: string;
          password_hash: string;
          created_at: string; // timestamp
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          created_at?: string;
        };
      };
      guest: {
        Row: {
          id: string; // uuid
          created_at: string; // timestamp
        };
        Insert: {
          id?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
        };
      };
      performance: {
        Row: {
          id: string; // uuid
          title: string;
          description: string | null;
          created_at: string; // timestamp
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      venue: {
        Row: {
          id: string; // uuid
          name: string;
          address: string | null;
          city: string | null;
          website_url: string | null;
          created_at: string; // timestamp
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          city?: string | null;
          website_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          city?: string | null;
          website_url?: string | null;
          created_at?: string;
        };
      };
      performance_season: {
        Row: {
          id: string; // uuid
          performance_id: string; // uuid (FK)
          venue_id: string; // uuid (FK)
          start_date: string | null; // date
          end_date: string | null; // date
          poster_url: string | null;
          created_at: string; // timestamp
        };
        Insert: {
          id?: string;
          performance_id: string;
          venue_id: string;
          start_date?: string | null;
          end_date?: string | null;
          poster_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          performance_id?: string;
          venue_id?: string;
          start_date?: string | null;
          end_date?: string | null;
          poster_url?: string | null;
          created_at?: string;
        };
      };
      person: {
        Row: {
          id: string; // uuid
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
        Update: {
          id?: string;
          name?: string;
        };
      };
      performance_person: {
        Row: {
          id: string; // uuid
          performance_id: string; // uuid (FK)
          person_id: string; // uuid (FK)
          role: string;
        };
        Insert: {
          id?: string;
          performance_id: string;
          person_id: string;
          role: string;
        };
        Update: {
          id?: string;
          performance_id?: string;
          person_id?: string;
          role?: string;
        };
      };
      evaluation: {
        Row: {
          id: string; // uuid
          user_id: string | null; // uuid (FK, nullable)
          guest_id: string | null; // uuid (FK, nullable)
          season_id: string; // uuid (FK)
          star_rating: number; // numeric (0-5, 0.5 increments)
          like_rating: number; // numeric (0-5, 0.5 increments)
          comment: string | null;
          created_at: string; // timestamp
          updated_at: string; // timestamp
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          season_id: string;
          star_rating: number;
          like_rating: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          guest_id?: string | null;
          season_id?: string;
          star_rating?: number;
          like_rating?: number;
          comment?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

