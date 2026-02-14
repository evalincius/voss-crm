import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  Organization,
  CreateOrgResult,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
  ValidateInvitationResult,
  AcceptInvitationResult,
} from "@/features/organizations/types";

export async function getUserOrganizationIds(): Promise<ApiResult<string[]>> {
  const { data, error } = await supabase.rpc("user_organization_ids");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getUserCurrentOrganizationId(): Promise<ApiResult<string | null>> {
  const { data, error } = await supabase.rpc("user_current_organization_id");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function getOrganizationsByIds(ids: string[]): Promise<ApiResult<Organization[]>> {
  if (ids.length === 0) {
    return { data: [], error: null };
  }

  const { data, error } = await supabase.from("organizations").select("*").in("id", ids);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function setCurrentOrganization(
  userId: string,
  orgId: string,
): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("profiles")
    .update({ current_organization_id: orgId })
    .eq("id", userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function createOrganization(
  name: string,
  slug?: string,
  logoUrl?: string,
): Promise<ApiResult<CreateOrgResult>> {
  const args: { org_name: string; org_slug?: string; org_logo_url?: string } = {
    org_name: name,
  };
  if (slug) args.org_slug = slug;
  if (logoUrl) args.org_logo_url = logoUrl;

  const { data, error } = await supabase.rpc("create_organization_with_membership", args);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as CreateOrgResult, error: null };
}

export async function updateOrganization(orgId: string, name: string): Promise<ApiResult<null>> {
  const { data, error } = await supabase
    .from("organizations")
    .update({ name })
    .eq("id", orgId)
    .select("id");

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data || data.length === 0) {
    return {
      data: null,
      error: "Organization not found or you don't have permission to update it",
    };
  }

  return { data: null, error: null };
}

export async function deleteOrganization(orgId: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("organizations").delete().eq("id", orgId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function fetchMembers(orgId: string): Promise<ApiResult<OrganizationMember[]>> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("*, profile:profiles!organization_members_profiles_fk(email, full_name, avatar_url)")
    .eq("organization_id", orgId)
    .order("joined_at");

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: (data as unknown as OrganizationMember[]) ?? [], error: null };
}

export async function updateMemberRole(
  memberId: string,
  role: OrganizationRole,
): Promise<ApiResult<null>> {
  const { error } = await supabase.from("organization_members").update({ role }).eq("id", memberId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function removeMember(memberId: string): Promise<ApiResult<null>> {
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function leaveOrganization(orgId: string, userId: string): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId)
    .eq("user_id", userId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function sendInvitation(
  orgId: string,
  email: string,
  role: OrganizationRole,
  invitedBy: string,
): Promise<ApiResult<OrganizationInvitation>> {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("organization_invitations")
    .insert({
      organization_id: orgId,
      email,
      role,
      invited_by: invitedBy,
      token,
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function fetchInvitations(
  orgId: string,
): Promise<ApiResult<OrganizationInvitation[]>> {
  const { data, error } = await supabase
    .from("organization_invitations")
    .select("*")
    .eq("organization_id", orgId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function revokeInvitation(invitationId: string): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("organization_invitations")
    .update({ status: "revoked" })
    .eq("id", invitationId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function validateInvitationToken(
  token: string,
): Promise<ApiResult<ValidateInvitationResult>> {
  const { data, error } = await supabase.rpc("validate_invitation_token", {
    invitation_token: token,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as ValidateInvitationResult, error: null };
}

export async function acceptInvitation(token: string): Promise<ApiResult<AcceptInvitationResult>> {
  const { data, error } = await supabase.rpc("accept_invitation", {
    invitation_token: token,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as unknown as AcceptInvitationResult, error: null };
}
