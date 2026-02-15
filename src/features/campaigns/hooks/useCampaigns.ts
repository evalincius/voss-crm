import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  addPeopleToCampaign,
  archiveCampaign,
  createCampaign,
  getCampaignById,
  getCampaignLinkedProductIds,
  getCampaignLinkedTemplateIds,
  getCampaignMetrics,
  getPersonCampaignMemberships,
  listCampaignMembers,
  listCampaignOptions,
  listCampaigns,
  removePersonFromCampaign,
  syncCampaignProducts,
  syncCampaignTemplates,
  unarchiveCampaign,
  updateCampaign,
} from "@/features/campaigns/services/campaignsService";
import type {
  AddPeopleToCampaignInput,
  CampaignListParams,
  CreateCampaignInput,
  RemovePersonFromCampaignInput,
  SyncCampaignProductsInput,
  SyncCampaignTemplatesInput,
  UpdateCampaignInput,
} from "@/features/campaigns/types";
import { campaignKeys } from "@/lib/queryKeys";

async function invalidateCampaignsForOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: campaignKeys.list._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });
}

export function useCampaignsList(params: CampaignListParams | null) {
  return useQuery({
    queryKey: params
      ? campaignKeys.list(params.organizationId, {
          search: params.search,
          archiveFilter: params.archiveFilter,
          typeFilter: params.typeFilter,
          sort: params.sort,
        }).queryKey
      : (["campaigns", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!params) {
        throw new Error("Campaign query params are required");
      }

      const result = await listCampaigns(params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaigns");
      }

      return result.data;
    },
    enabled: !!params,
  });
}

export function useCampaignDetail(organizationId: string | null, campaignId: string | null) {
  return useQuery({
    queryKey:
      organizationId && campaignId
        ? campaignKeys.detail(organizationId, campaignId).queryKey
        : (["campaigns", "detail", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !campaignId) {
        throw new Error("Organization and campaign are required");
      }

      const result = await getCampaignById(organizationId, campaignId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!campaignId,
  });
}

export function useCampaignLinkedProductIds(
  organizationId: string | null,
  campaignId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && campaignId
        ? campaignKeys.productLinks(organizationId, campaignId).queryKey
        : (["campaigns", "product-links", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !campaignId) {
        throw new Error("Organization and campaign are required");
      }

      const result = await getCampaignLinkedProductIds(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked products");
      }

      return result.data;
    },
    enabled: !!organizationId && !!campaignId,
  });
}

export function useCampaignLinkedTemplateIds(
  organizationId: string | null,
  campaignId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && campaignId
        ? campaignKeys.templateLinks(organizationId, campaignId).queryKey
        : (["campaigns", "template-links", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !campaignId) {
        throw new Error("Organization and campaign are required");
      }

      const result = await getCampaignLinkedTemplateIds(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked templates");
      }

      return result.data;
    },
    enabled: !!organizationId && !!campaignId,
  });
}

export function useCampaignMembers(organizationId: string | null, campaignId: string | null) {
  return useQuery({
    queryKey:
      organizationId && campaignId
        ? campaignKeys.members(organizationId, campaignId).queryKey
        : (["campaigns", "members", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !campaignId) {
        throw new Error("Organization and campaign are required");
      }

      const result = await listCampaignMembers(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaign members");
      }

      return result.data;
    },
    enabled: !!organizationId && !!campaignId,
  });
}

export function useCampaignMetrics(organizationId: string | null, campaignId: string | null) {
  return useQuery({
    queryKey:
      organizationId && campaignId
        ? campaignKeys.metrics(organizationId, campaignId).queryKey
        : (["campaigns", "metrics", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !campaignId) {
        throw new Error("Organization and campaign are required");
      }

      const result = await getCampaignMetrics(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaign metrics");
      }

      return result.data;
    },
    enabled: !!organizationId && !!campaignId,
  });
}

export function usePersonCampaignMemberships(
  organizationId: string | null,
  personId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && personId
        ? campaignKeys.byPerson(organizationId, personId).queryKey
        : (["campaigns", "by-person", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId) {
        throw new Error("Organization and person are required");
      }

      const result = await getPersonCampaignMemberships(organizationId, personId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaign memberships");
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId,
  });
}

export function useCampaignOptions(organizationId: string | null) {
  return useQuery({
    queryKey: organizationId
      ? campaignKeys.options(organizationId).queryKey
      : (["campaigns", "options", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId) {
        throw new Error("Organization is required");
      }

      const result = await listCampaignOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaign options");
      }

      return result.data;
    },
    enabled: !!organizationId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCampaignInput) => {
      const result = await createCampaign(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create campaign");
      }

      return result.data;
    },
    onSuccess: async (campaign) => {
      await invalidateCampaignsForOrg(queryClient, campaign.organization_id);
    },
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateCampaignInput) => {
      const result = await updateCampaign(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update campaign");
      }

      return result.data;
    },
    onSuccess: async (campaign) => {
      await invalidateCampaignsForOrg(queryClient, campaign.organization_id);
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaign.organization_id, campaign.id).queryKey,
      });
    },
  });
}

export function useArchiveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const result = await archiveCampaign(campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to archive campaign");
      }

      return result.data;
    },
    onSuccess: async (campaign) => {
      await invalidateCampaignsForOrg(queryClient, campaign.organization_id);
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaign.organization_id, campaign.id).queryKey,
      });
    },
  });
}

export function useUnarchiveCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (campaignId: string) => {
      const result = await unarchiveCampaign(campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to restore campaign");
      }

      return result.data;
    },
    onSuccess: async (campaign) => {
      await invalidateCampaignsForOrg(queryClient, campaign.organization_id);
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(campaign.organization_id, campaign.id).queryKey,
      });
    },
  });
}

export function useSyncCampaignProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncCampaignProductsInput) => {
      const result = await syncCampaignProducts(input);
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.productLinks(input.organizationId, input.campaignId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(input.organizationId, input.campaignId).queryKey,
      });
    },
  });
}

export function useSyncCampaignTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SyncCampaignTemplatesInput) => {
      const result = await syncCampaignTemplates(input);
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.templateLinks(input.organizationId, input.campaignId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(input.organizationId, input.campaignId).queryKey,
      });
    },
  });
}

export function useAddPeopleToCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddPeopleToCampaignInput) => {
      const result = await addPeopleToCampaign(input);
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.members(input.organizationId, input.campaignId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.metrics(input.organizationId, input.campaignId).queryKey,
      });
    },
  });
}

export function useRemovePersonFromCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemovePersonFromCampaignInput) => {
      const result = await removePersonFromCampaign(input);
      if (result.error) {
        throw new Error(result.error);
      }

      return input;
    },
    onSuccess: async (input) => {
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.members(input.organizationId, input.campaignId).queryKey,
      });
      await queryClient.invalidateQueries({
        queryKey: campaignKeys.metrics(input.organizationId, input.campaignId).queryKey,
      });
    },
  });
}
