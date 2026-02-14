import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memberKeys, invitationKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { OrganizationRole } from "@/features/organizations/types";
import {
  updateOrganization,
  deleteOrganization,
  fetchMembers,
  updateMemberRole,
  removeMember,
  leaveOrganization,
  sendInvitation,
  fetchInvitations,
  revokeInvitation,
  validateInvitationToken,
  acceptInvitation,
} from "@/features/organizations/services/organizationService";

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: memberKeys.list(orgId).queryKey,
    queryFn: async () => {
      const result = await fetchMembers(orgId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!orgId,
  });
}

export function useInvitations(orgId: string) {
  return useQuery({
    queryKey: invitationKeys.list(orgId).queryKey,
    queryFn: async () => {
      const result = await fetchInvitations(orgId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!orgId,
  });
}

export function useValidateInvitation(token: string) {
  return useQuery({
    queryKey: invitationKeys.validate(token).queryKey,
    queryFn: async () => {
      const result = await validateInvitationToken(token);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    enabled: !!token,
    retry: false,
  });
}

export function useUpdateOrganization() {
  const { refreshOrganizations } = useAuth();

  return useMutation({
    mutationFn: async (data: { orgId: string; name: string }) => {
      const result = await updateOrganization(data.orgId, data.name);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await refreshOrganizations();
    },
  });
}

export function useDeleteOrganization() {
  const { refreshOrganizations } = useAuth();

  return useMutation({
    mutationFn: async (orgId: string) => {
      const result = await deleteOrganization(orgId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await refreshOrganizations();
    },
  });
}

export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { memberId: string; role: OrganizationRole }) => {
      const result = await updateMemberRole(data.memberId, data.role);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memberKeys.list(orgId).queryKey });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const result = await removeMember(memberId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: memberKeys.list(orgId).queryKey });
    },
  });
}

export function useLeaveOrganization() {
  const { refreshOrganizations } = useAuth();

  return useMutation({
    mutationFn: async (data: { orgId: string; userId: string }) => {
      const result = await leaveOrganization(data.orgId, data.userId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await refreshOrganizations();
    },
  });
}

export function useSendInvitation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { email: string; role: OrganizationRole; invitedBy: string }) => {
      const result = await sendInvitation(orgId, data.email, data.role, data.invitedBy);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys.list(orgId).queryKey });
    },
  });
}

export function useRevokeInvitation(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const result = await revokeInvitation(invitationId);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: invitationKeys.list(orgId).queryKey });
    },
  });
}

export function useAcceptInvitation() {
  const { refreshOrganizations } = useAuth();

  return useMutation({
    mutationFn: async (token: string) => {
      const result = await acceptInvitation(token);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await refreshOrganizations();
    },
  });
}
