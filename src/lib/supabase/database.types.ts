import type { AppRole } from "@/lib/roles";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      cwb_distribution_versions: {
        Row: {
          distribution_version: string;
          source_schema_profile: string;
          consumer_schema_version: string;
          package_name: string;
          generated_at: string;
          distribution_type: string;
          translation: string;
          source_status: string;
          display_status: string;
          warning: string;
          state: "importing" | "failed" | "validated" | "active" | "retired";
          expected_books: number;
          expected_chapters: number;
          expected_verses: number;
          imported_books: number;
          imported_chapters: number;
          imported_verses: number;
          imported_search_index: number;
          manifest_sha256: string;
          books_sha256: string;
          chapters_sha256: string;
          verses_sha256: string;
          search_index_sha256: string;
          cwb_status_sha256: string;
          verse_id_set_sha256: string | null;
          validation_report: Json;
          import_method: string;
          imported_at: string | null;
          imported_by: string | null;
          activated_at: string | null;
          failure_reason: string | null;
          created_at: string;
        };
        Insert: {
          distribution_version: string;
          source_schema_profile: string;
          consumer_schema_version: string;
          package_name: string;
          generated_at: string;
          distribution_type: string;
          translation: string;
          source_status: string;
          display_status: string;
          warning: string;
          state?: "importing" | "failed" | "validated" | "active" | "retired";
          expected_books: number;
          expected_chapters: number;
          expected_verses: number;
          imported_books?: number;
          imported_chapters?: number;
          imported_verses?: number;
          imported_search_index?: number;
          manifest_sha256: string;
          books_sha256: string;
          chapters_sha256: string;
          verses_sha256: string;
          search_index_sha256: string;
          cwb_status_sha256: string;
          verse_id_set_sha256?: string | null;
          validation_report?: Json;
          import_method?: string;
          imported_at?: string | null;
          imported_by?: string | null;
          activated_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
        };
        Update: {
          distribution_version?: string;
          source_schema_profile?: string;
          consumer_schema_version?: string;
          package_name?: string;
          generated_at?: string;
          distribution_type?: string;
          translation?: string;
          source_status?: string;
          display_status?: string;
          warning?: string;
          state?: "importing" | "failed" | "validated" | "active" | "retired";
          expected_books?: number;
          expected_chapters?: number;
          expected_verses?: number;
          imported_books?: number;
          imported_chapters?: number;
          imported_verses?: number;
          imported_search_index?: number;
          manifest_sha256?: string;
          books_sha256?: string;
          chapters_sha256?: string;
          verses_sha256?: string;
          search_index_sha256?: string;
          cwb_status_sha256?: string;
          verse_id_set_sha256?: string | null;
          validation_report?: Json;
          import_method?: string;
          imported_at?: string | null;
          imported_by?: string | null;
          activated_at?: string | null;
          failure_reason?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      cwb_books: {
        Row: {
          distribution_version: string;
          order: number;
          testament: string;
          book: string;
          book_slug: string;
          chapters: number;
          verses: number;
        };
        Insert: {
          distribution_version: string;
          order: number;
          testament: string;
          book: string;
          book_slug: string;
          chapters: number;
          verses: number;
        };
        Update: {
          distribution_version?: string;
          order?: number;
          testament?: string;
          book?: string;
          book_slug?: string;
          chapters?: number;
          verses?: number;
        };
        Relationships: [];
      };
      cwb_chapters: {
        Row: {
          distribution_version: string;
          book_slug: string;
          chapter: number;
          reference: string;
          verse_count: number;
        };
        Insert: {
          distribution_version: string;
          book_slug: string;
          chapter: number;
          reference: string;
          verse_count: number;
        };
        Update: {
          distribution_version?: string;
          book_slug?: string;
          chapter?: number;
          reference?: string;
          verse_count?: number;
        };
        Relationships: [];
      };
      cwb_verses: {
        Row: {
          distribution_version: string;
          verse_id: string;
          translation: string;
          testament: string;
          book: string;
          book_slug: string;
          chapter: number;
          verse: number;
          reference: string;
          text: string;
          source_status: string;
          source_file: string;
          source_version: string;
        };
        Insert: {
          distribution_version: string;
          verse_id: string;
          translation: string;
          testament: string;
          book: string;
          book_slug: string;
          chapter: number;
          verse: number;
          reference: string;
          text: string;
          source_status: string;
          source_file: string;
          source_version: string;
        };
        Update: {
          distribution_version?: string;
          verse_id?: string;
          translation?: string;
          testament?: string;
          book?: string;
          book_slug?: string;
          chapter?: number;
          verse?: number;
          reference?: string;
          text?: string;
          source_status?: string;
          source_file?: string;
          source_version?: string;
        };
        Relationships: [];
      };
      cwb_search_index: {
        Row: {
          distribution_version: string;
          verse_id: string;
          reference: string;
          book_slug: string;
          chapter: number;
          verse: number;
          plain_text: string;
          searchable_text: string;
        };
        Insert: {
          distribution_version: string;
          verse_id: string;
          reference: string;
          book_slug: string;
          chapter: number;
          verse: number;
          plain_text: string;
          searchable_text: string;
        };
        Update: {
          distribution_version?: string;
          verse_id?: string;
          reference?: string;
          book_slug?: string;
          chapter?: number;
          verse?: number;
          plain_text?: string;
          searchable_text?: string;
        };
        Relationships: [];
      };
      cwb_runtime_state: {
        Row: {
          id: boolean;
          active_distribution_version: string | null;
          previous_distribution_version: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          active_distribution_version?: string | null;
          previous_distribution_version?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: boolean;
          active_distribution_version?: string | null;
          previous_distribution_version?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      cwb_import_logs: {
        Row: {
          id: number;
          distribution_version: string | null;
          event_type: string;
          level: "info" | "warning" | "error";
          message: string;
          details: Json;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: number;
          distribution_version?: string | null;
          event_type: string;
          level?: "info" | "warning" | "error";
          message: string;
          details?: Json;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: number;
          distribution_version?: string | null;
          event_type?: string;
          level?: "info" | "warning" | "error";
          message?: string;
          details?: Json;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [];
      };
      cwb_preview_entitlements: {
        Row: {
          user_id: string;
          enabled: boolean;
          granted_by: string | null;
          granted_at: string;
          expires_at: string | null;
          reason: string | null;
        };
        Insert: {
          user_id: string;
          enabled?: boolean;
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          reason?: string | null;
        };
        Update: {
          user_id?: string;
          enabled?: boolean;
          granted_by?: string | null;
          granted_at?: string;
          expires_at?: string | null;
          reason?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          user_id: string;
          email: string | null;
          full_name: string | null;
          phone: string | null;
          address_line1: string | null;
          city: string | null;
          postcode: string | null;
          status: "VISITOR" | "MEMBER";
          tags: string[];
          role: AppRole;
          created_at: string;
        };
        Insert: {
          user_id: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          status?: "VISITOR" | "MEMBER";
          tags?: string[];
          role?: AppRole;
          created_at?: string;
        };
        Update: {
          user_id?: string;
          email?: string | null;
          full_name?: string | null;
          phone?: string | null;
          address_line1?: string | null;
          city?: string | null;
          postcode?: string | null;
          status?: "VISITOR" | "MEMBER";
          tags?: string[];
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
      people_notes: {
        Row: {
          id: string;
          profile_user_id: string;
          note: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_user_id: string;
          note: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          profile_user_id?: string;
          note?: string;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          consent: boolean;
          status: string;
          tags: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          consent?: boolean;
          status?: string;
          tags?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          consent?: boolean;
          status?: string;
          tags?: string[];
          created_at?: string;
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
      has_cwb_preview_access: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      is_cwb_diagnostics_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      cwb_mark_import_failed: {
        Args: {
          p_distribution_version: string;
          p_failure_reason: string;
          p_validation_report?: Json;
          p_failed_by?: string | null;
        };
        Returns: undefined;
      };
      cwb_validate_distribution: {
        Args: {
          p_distribution_version: string;
          p_validation_report?: Json;
          p_validated_by?: string | null;
        };
        Returns: undefined;
      };
      cwb_activate_distribution: {
        Args: {
          p_distribution_version: string;
          p_activated_by?: string | null;
        };
        Returns: undefined;
      };
      cwb_rollback_distribution: {
        Args: {
          p_rolled_back_by?: string | null;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
};
