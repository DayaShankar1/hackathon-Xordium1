export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type CampusIssueStatus =
  | "submitted"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "closed"
  | "reopened"
  | "rejected";
export type CampusIssuePriority = "low" | "medium" | "high" | "critical";
export type CampusIssueCategory =
  | "network"
  | "computer_lab"
  | "electricity"
  | "water"
  | "classroom"
  | "hostel"
  | "library"
  | "washroom"
  | "security"
  | "other";

type SimpleTable<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

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
      resources: {
        Row: {
          branch: string | null;
          created_at: string;
          description: string | null;
          file_name: string;
          file_path: string;
          file_size_bytes: number | null;
          hidden_at: string | null;
          hidden_by: string | null;
          hidden_reason: string | null;
          id: string;
          is_hidden: boolean;
          mime_type: string | null;
          resource_type: "notes" | "pyq" | "assignment" | "book" | "other";
          semester: string | null;
          subject: string;
          title: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          branch?: string | null;
          created_at?: string;
          description?: string | null;
          file_name: string;
          file_path: string;
          file_size_bytes?: number | null;
          hidden_at?: string | null;
          hidden_by?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_hidden?: boolean;
          mime_type?: string | null;
          resource_type: "notes" | "pyq" | "assignment" | "book" | "other";
          semester?: string | null;
          subject: string;
          title: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          branch?: string | null;
          created_at?: string;
          description?: string | null;
          file_name?: string;
          file_path?: string;
          file_size_bytes?: number | null;
          hidden_at?: string | null;
          hidden_by?: string | null;
          hidden_reason?: string | null;
          id?: string;
          is_hidden?: boolean;
          mime_type?: string | null;
          resource_type?: "notes" | "pyq" | "assignment" | "book" | "other";
          semester?: string | null;
          subject?: string;
          title?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "resources_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "resources_hidden_by_fkey";
            columns: ["hidden_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campus_fix_departments: SimpleTable<
        {
          code: string;
          created_at: string;
          created_by: string | null;
          default_sla_hours: number;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          updated_at: string;
        },
        {
          code: string;
          created_at?: string;
          created_by?: string | null;
          default_sla_hours?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          updated_at?: string;
        }
      >;
      campus_fix_category_routes: SimpleTable<
        {
          category: CampusIssueCategory;
          default_priority: CampusIssuePriority;
          department_id: string;
          is_active: boolean;
          updated_at: string;
          updated_by: string | null;
        },
        {
          category: CampusIssueCategory;
          default_priority?: CampusIssuePriority;
          department_id: string;
          is_active?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        }
      >;
      campus_fix_contacts: SimpleTable<
        {
          created_at: string;
          created_by: string | null;
          department_id: string;
          id: string;
          is_active: boolean;
          job_title: string | null;
          profile_id: string | null;
          staff_name: string;
          updated_at: string;
          whatsapp_consent: boolean;
          whatsapp_number: string | null;
        },
        {
          created_at?: string;
          created_by?: string | null;
          department_id: string;
          id?: string;
          is_active?: boolean;
          job_title?: string | null;
          profile_id?: string | null;
          staff_name: string;
          updated_at?: string;
          whatsapp_consent?: boolean;
          whatsapp_number?: string | null;
        }
      >;
      campus_fix_contact_scopes: SimpleTable<
        {
          building: string | null;
          can_add_evidence: boolean;
          can_update_status: boolean;
          can_view: boolean;
          category: CampusIssueCategory | null;
          contact_id: string;
          created_at: string;
          created_by: string | null;
          id: string;
        },
        {
          building?: string | null;
          can_add_evidence?: boolean;
          can_update_status?: boolean;
          can_view?: boolean;
          category?: CampusIssueCategory | null;
          contact_id: string;
          created_at?: string;
          created_by?: string | null;
          id?: string;
        }
      >;
      campus_issues: SimpleTable<
        {
          agree_count: number;
          assigned_contact_id: string | null;
          assigned_staff_name: string | null;
          building: string;
          category: CampusIssueCategory;
          closed_at: string | null;
          created_at: string;
          department_id: string;
          description: string;
          disagree_count: number;
          duplicate_of_issue_id: string | null;
          estimated_resolution_at: string | null;
          id: string;
          image_path: string | null;
          is_anonymous: boolean;
          last_activity_at: string;
          location: string;
          moderated_at: string | null;
          moderated_by: string | null;
          moderation_reason: string | null;
          moderation_status: "visible" | "hidden" | "deleted";
          notify_authority: boolean;
          priority: CampusIssuePriority;
          reference_id: string;
          rejection_reason: string | null;
          reopened_at: string | null;
          reporter_name: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          status: CampusIssueStatus;
          title: string;
          updated_at: string;
          user_id: string | null;
          version: number;
        },
        {
          agree_count?: number;
          assigned_contact_id?: string | null;
          assigned_staff_name?: string | null;
          building: string;
          category: CampusIssueCategory;
          closed_at?: string | null;
          created_at?: string;
          department_id: string;
          description: string;
          disagree_count?: number;
          duplicate_of_issue_id?: string | null;
          estimated_resolution_at?: string | null;
          id?: string;
          image_path?: string | null;
          is_anonymous?: boolean;
          last_activity_at?: string;
          location: string;
          moderated_at?: string | null;
          moderated_by?: string | null;
          moderation_reason?: string | null;
          moderation_status?: "visible" | "hidden" | "deleted";
          notify_authority?: boolean;
          priority?: CampusIssuePriority;
          reference_id: string;
          rejection_reason?: string | null;
          reopened_at?: string | null;
          reporter_name: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          status?: CampusIssueStatus;
          title: string;
          updated_at?: string;
          user_id?: string | null;
          version?: number;
        }
      >;
      issue_updates: SimpleTable<
        {
          actor_id: string | null;
          actor_kind: "reporter" | "staff" | "admin" | "system";
          audience: "campus" | "reporter" | "staff";
          created_at: string;
          event_type: "created" | "status_changed" | "note_added" | "assigned" | "reassigned" | "evidence_added" | "reopened" | "moderated" | "restored";
          id: string;
          issue_id: string;
          new_status: CampusIssueStatus;
          note: string | null;
          old_status: CampusIssueStatus | null;
          payload: Json;
          request_id: string | null;
        },
        {
          actor_id?: string | null;
          actor_kind?: "reporter" | "staff" | "admin" | "system";
          audience?: "campus" | "reporter" | "staff";
          created_at?: string;
          event_type?: "created" | "status_changed" | "note_added" | "assigned" | "reassigned" | "evidence_added" | "reopened" | "moderated" | "restored";
          id?: string;
          issue_id: string;
          new_status: CampusIssueStatus;
          note?: string | null;
          old_status?: CampusIssueStatus | null;
          payload?: Json;
          request_id?: string | null;
        }
      >;
      campus_issue_evidence: SimpleTable<
        {
          caption: string | null;
          created_at: string;
          evidence_type: "report" | "progress" | "resolution";
          file_name: string;
          file_size_bytes: number;
          id: string;
          issue_id: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          object_path: string;
          sort_order: number;
          uploaded_by: string | null;
        },
        {
          caption?: string | null;
          created_at?: string;
          evidence_type: "report" | "progress" | "resolution";
          file_name: string;
          file_size_bytes: number;
          id?: string;
          issue_id: string;
          mime_type: "image/jpeg" | "image/png" | "image/webp";
          object_path: string;
          sort_order?: number;
          uploaded_by?: string | null;
        }
      >;
      campus_issue_votes: SimpleTable<
        { created_at: string; issue_id: string; updated_at: string; vote: "agree" | "disagree"; voter_id: string },
        { created_at?: string; issue_id: string; updated_at?: string; vote: "agree" | "disagree"; voter_id: string }
      >;
      campus_issue_assignments: SimpleTable<
        {
          assigned_at: string;
          assigned_by: string | null;
          contact_id: string;
          department_id: string;
          ended_at: string | null;
          ended_by: string | null;
          id: string;
          issue_id: string;
          reason: string | null;
        },
        {
          assigned_at?: string;
          assigned_by?: string | null;
          contact_id: string;
          department_id: string;
          ended_at?: string | null;
          ended_by?: string | null;
          id?: string;
          issue_id: string;
          reason?: string | null;
        }
      >;
      campus_fix_notification_logs: SimpleTable<
        {
          accepted_at: string | null;
          attempt_count: number;
          channel: "whatsapp";
          contact_id: string | null;
          created_at: string;
          delivered_at: string | null;
          event_type: "issue_created" | "issue_assigned" | "status_changed";
          id: string;
          idempotency_key: string;
          issue_id: string;
          issue_update_id: string | null;
          last_error_code: string | null;
          last_error_message: string | null;
          locked_at: string | null;
          next_attempt_at: string;
          provider_message_sid: string | null;
          provider_status: string | null;
          sent_at: string | null;
          status: "pending" | "processing" | "suppressed" | "accepted" | "queued" | "sent" | "delivered" | "read" | "failed" | "undelivered";
          updated_at: string;
        },
        {
          accepted_at?: string | null;
          attempt_count?: number;
          channel?: "whatsapp";
          contact_id?: string | null;
          created_at?: string;
          delivered_at?: string | null;
          event_type: "issue_created" | "issue_assigned" | "status_changed";
          id?: string;
          idempotency_key: string;
          issue_id: string;
          issue_update_id?: string | null;
          last_error_code?: string | null;
          last_error_message?: string | null;
          locked_at?: string | null;
          next_attempt_at?: string;
          provider_message_sid?: string | null;
          provider_status?: string | null;
          sent_at?: string | null;
          status?: "pending" | "processing" | "suppressed" | "accepted" | "queued" | "sent" | "delivered" | "read" | "failed" | "undelivered";
          updated_at?: string;
        }
      >;
      campus_fix_notification_events: SimpleTable<
        {
          error_code: string | null;
          error_message: string | null;
          event_key: string;
          id: string;
          notification_id: string;
          provider_at: string | null;
          received_at: string;
          signature_verified: boolean;
          status: string;
        },
        {
          error_code?: string | null;
          error_message?: string | null;
          event_key: string;
          id?: string;
          notification_id: string;
          provider_at?: string | null;
          received_at?: string;
          signature_verified?: boolean;
          status: string;
        }
      >;
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
      campus_fix_can_manage_issue: { Args: { p_issue_id: string }; Returns: boolean };
      campus_fix_can_read_issue: { Args: { p_issue_id: string }; Returns: boolean };
      campus_fix_is_reporter: { Args: { p_issue_id: string }; Returns: boolean };
      campus_fix_issue_permissions: {
        Args: { p_issue_id: string };
        Returns: Array<{
          actual_reporter_name: string;
          can_manage: boolean;
          is_admin: boolean;
          is_reporter: boolean;
        }>;
      };
      campus_fix_submit_issue: {
        Args: {
          p_building: string;
          p_category: CampusIssueCategory;
          p_description: string;
          p_evidence: Json;
          p_is_anonymous: boolean;
          p_notify_authority: boolean;
          p_issue_id: string;
          p_location: string;
          p_priority: CampusIssuePriority;
          p_request_id: string;
          p_title: string;
        };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_edit_issue: {
        Args: {
          p_building: string;
          p_description: string;
          p_issue_id: string;
          p_location: string;
          p_priority: CampusIssuePriority;
          p_request_id: string;
          p_title: string;
        };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_set_vote: {
        Args: { p_issue_id: string; p_vote: "agree" | "disagree" };
        Returns: Array<{ agree_count: number; disagree_count: number; user_vote: "agree" | "disagree" }>;
      };
      campus_fix_transition_issue: {
        Args: {
          p_estimated_resolution_at: string | null;
          p_evidence: Json;
          p_expected_version: number;
          p_issue_id: string;
          p_new_status: CampusIssueStatus;
          p_note: string;
          p_rejection_reason: string | null;
          p_request_id: string;
          p_resolution_notes: string | null;
        };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_add_update: {
        Args: {
          p_estimated_resolution_at: string | null;
          p_evidence: Json;
          p_expected_version: number;
          p_issue_id: string;
          p_note: string;
          p_request_id: string;
        };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_reopen_issue: {
        Args: { p_issue_id: string; p_reason: string; p_request_id: string };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_assign_issue: {
        Args: { p_contact_id: string; p_issue_id: string; p_reason: string; p_request_id: string };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_moderate_issue: {
        Args: { p_action: string; p_duplicate_of: string | null; p_issue_id: string; p_reason: string; p_request_id: string };
        Returns: Database["public"]["Tables"]["campus_issues"]["Row"];
      };
      campus_fix_claim_notifications: {
        Args: { p_limit?: number };
        Returns: Array<Database["public"]["Tables"]["campus_fix_notification_logs"]["Row"]>;
      };
      campus_fix_complete_notification: {
        Args: {
          p_error_code: string | null;
          p_error_message: string | null;
          p_notification_id: string;
          p_provider_message_sid: string | null;
          p_provider_status: string | null;
          p_status: string;
        };
        Returns: Database["public"]["Tables"]["campus_fix_notification_logs"]["Row"];
      };
      campus_fix_record_notification_event: {
        Args: {
          p_error_code: string | null;
          p_error_message: string | null;
          p_event_key: string;
          p_provider_at: string | null;
          p_provider_message_sid: string;
          p_signature_verified: boolean;
          p_status: string;
        };
        Returns: Database["public"]["Tables"]["campus_fix_notification_logs"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type TableRow<TableName extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][TableName]["Row"];
