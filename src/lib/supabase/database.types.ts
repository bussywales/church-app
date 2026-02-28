import type { AppRole } from "@/lib/roles";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          user_id: string;
          full_name: string | null;
          phone: string | null;
          address_line1: string | null;
          city: string | null;
          postcode: string | null;
          role: AppRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          full_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          full_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          role?: AppRole;
          created_at?: string;
        };
        Relationships: [];
      };
      sermons: {
        Row: {
          id: string;
          title: string;
          speaker: string | null;
          series: string | null;
          youtube_url: string | null;
          preached_at: string | null;
          notes_md: string | null;
          tags: string[];
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          speaker?: string | null;
          series?: string | null;
          youtube_url?: string | null;
          preached_at?: string | null;
          notes_md?: string | null;
          tags?: string[];
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          speaker?: string | null;
          series?: string | null;
          youtube_url?: string | null;
          preached_at?: string | null;
          notes_md?: string | null;
          tags?: string[];
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          location: string | null;
          starts_at: string;
          ends_at: string | null;
          capacity: number | null;
          is_published: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          location?: string | null;
          starts_at: string;
          ends_at?: string | null;
          capacity?: number | null;
          is_published?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string | null;
          location?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          capacity?: number | null;
          is_published?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      registrations: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string;
          qr_code: string | null;
          checked_in_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string;
          qr_code?: string | null;
          checked_in_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string;
          qr_code?: string | null;
          checked_in_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      funds: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          key: string;
          value_json: Json;
          updated_at: string;
        };
        Insert: {
          key: string;
          value_json?: Json;
          updated_at?: string;
        };
        Update: {
          key?: string;
          value_json?: Json;
          updated_at?: string;
        };
        Relationships: [];
      };
      donations: {
        Row: {
          id: string;
          user_id: string;
          fund_id: string | null;
          amount_pence: number;
          currency: string;
          stripe_session_id: string | null;
          payment_intent_id: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          fund_id?: string | null;
          amount_pence: number;
          currency?: string;
          stripe_session_id?: string | null;
          payment_intent_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          fund_id?: string | null;
          amount_pence?: number;
          currency?: string;
          stripe_session_id?: string | null;
          payment_intent_id?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      gift_aid_declarations: {
        Row: {
          id: string;
          user_id: string;
          accepted_at: string;
          address_snapshot: Json;
          wording_version: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          accepted_at: string;
          address_snapshot: Json;
          wording_version: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          accepted_at?: string;
          address_snapshot?: Json;
          wording_version?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_user_role: {
        Args: Record<string, never>;
        Returns: AppRole | null;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
