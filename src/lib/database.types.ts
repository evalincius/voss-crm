export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      organization_invitations: {
        Row: {
          accepted_at: string | null;
          created_at: string | null;
          email: string;
          expires_at: string | null;
          id: string;
          invited_by: string;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          status: Database["public"]["Enums"]["invitation_status"];
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          created_at?: string | null;
          email: string;
          expires_at?: string | null;
          id?: string;
          invited_by: string;
          organization_id: string;
          role?: Database["public"]["Enums"]["organization_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string | null;
          id?: string;
          invited_by?: string;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invitations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organization_members: {
        Row: {
          id: string;
          invited_by: string | null;
          joined_at: string | null;
          organization_id: string;
          role: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id: string;
          role?: Database["public"]["Enums"]["organization_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          invited_by?: string | null;
          joined_at?: string | null;
          organization_id?: string;
          role?: Database["public"]["Enums"]["organization_role"];
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_profiles_fk";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          logo_url: string | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          logo_url?: string | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          current_organization_id: string | null;
          email: string;
          full_name: string | null;
          id: string;
          role: Database["public"]["Enums"]["user_role"] | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_organization_id?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          current_organization_id?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["user_role"] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_current_org_fk";
            columns: ["current_organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      accept_invitation: {
        Args: { invitation_token: string };
        Returns: Json;
      };
      create_organization_with_membership: {
        Args: { org_logo_url?: string; org_name: string; org_slug?: string };
        Returns: Json;
      };
      user_current_organization_id: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      user_organization_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      validate_invitation_token: {
        Args: { invitation_token: string };
        Returns: Json;
      };
    };
    Enums: {
      invitation_status: "pending" | "accepted" | "expired" | "revoked";
      organization_role: "owner" | "member";
      user_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      organization_role: ["owner", "member"],
      user_role: ["admin", "user"],
    },
  },
} as const;
