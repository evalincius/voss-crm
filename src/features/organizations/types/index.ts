import type { Tables, Enums } from "@/lib/database.types";

export type Organization = Tables<"organizations">;

export type OrganizationRole = Enums<"organization_role">;

export interface CreateOrgResult {
  success: boolean;
  id: string;
  name: string;
  slug: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  joined_at: string | null;
  invited_by: string | null;
  profile: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export type OrganizationInvitation = Tables<"organization_invitations">;

export interface ValidateInvitationResult {
  valid: boolean;
  error?: string;
  organization_name?: string;
  inviter_name?: string;
  role?: OrganizationRole;
}

export interface AcceptInvitationResult {
  success: boolean;
  error?: string;
  organization_id?: string;
  organization_name?: string;
}
