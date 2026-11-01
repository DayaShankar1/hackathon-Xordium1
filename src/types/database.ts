export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string;
          id: string;
          role: "student" | "admin";
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id: string;
          role?: "student" | "admin";
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string;
          id?: string;
          role?: "student" | "admin";
          updated_at?: string;
        };
        Relationships: [];
      };
      lost_found_items: {
        Row: {
          category: string;
          created_at: string;
          description: string;
          id: string;
          image_path: string | null;
          incident_date: string | null;
          is_hidden: boolean;
          item_type: "lost" | "found";
          location: string;
          resolved_at: string | null;
          status: "open" | "claimed" | "resolved";
          title: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category: string;
          created_at?: string;
          description: string;
          id?: string;
          image_path?: string | null;
          incident_date?: string | null;
          is_hidden?: boolean;
          item_type: "lost" | "found";
          location: string;
          resolved_at?: string | null;
          status?: "open" | "claimed" | "resolved";
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          description?: string;
          id?: string;
          image_path?: string | null;
          incident_date?: string | null;
          is_hidden?: boolean;
          item_type?: "lost" | "found";
          location?: string;
          resolved_at?: string | null;
          status?: "open" | "claimed" | "resolved";
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lost_found_items_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lost_found_item_images: {
        Row: {
          created_at: string;
          id: string;
          item_id: string;
          object_path: string;
          sort_order: number;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          item_id: string;
          object_path: string;
          sort_order: number;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          item_id?: string;
          object_path?: string;
          sort_order?: number;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lost_found_item_images_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "lost_found_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lost_found_item_images_uploaded_by_fkey";
            columns: ["uploaded_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      lost_found_claims: {
        Row: {
          claimant_id: string;
          created_at: string;
          id: string;
          identifying_details: string;
          item_id: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          statement: string;
          status: "pending" | "approved" | "rejected";
          updated_at: string;
        };
        Insert: {
          claimant_id: string;
          created_at?: string;
          id?: string;
          identifying_details: string;
          item_id: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement: string;
          status?: "pending" | "approved" | "rejected";
          updated_at?: string;
        };
        Update: {
          claimant_id?: string;
          created_at?: string;
          id?: string;
          identifying_details?: string;
          item_id?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          statement?: string;
          status?: "pending" | "approved" | "rejected";
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lost_found_claims_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "lost_found_items";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lost_found_claims_claimant_id_fkey";
            columns: ["claimant_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lost_found_claims_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      review_lost_found_claim: {
        Args: {
          claim_id: string;
          decision: string;
        };
        Returns: Database["public"]["Tables"]["lost_found_claims"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];
