import { useQuery, useMutation } from "@tanstack/react-query";
import { organizationKeys } from "@/lib/queryKeys";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  getOrganizationsByIds,
  createOrganization,
} from "@/features/organizations/services/organizationService";

export function useOrganizationDetail(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.detail(orgId).queryKey,
    queryFn: async () => {
      const result = await getOrganizationsByIds([orgId]);
      if (result.error || !result.data)
        throw new Error(result.error ?? "Failed to fetch organization");
      return result.data[0] ?? null;
    },
    enabled: !!orgId,
  });
}

export function useCreateOrganization() {
  const { refreshOrganizations } = useAuth();

  return useMutation({
    mutationFn: async (data: { name: string; slug?: string; logoUrl?: string }) => {
      const result = await createOrganization(data.name, data.slug, data.logoUrl);
      if (result.error) throw new Error(result.error);
      return result.data;
    },
    onSuccess: async () => {
      await refreshOrganizations();
    },
  });
}
