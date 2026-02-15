import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import {
  checkDuplicateDeal,
  createDeal,
  getDealById,
  listDeals,
  listDealsByPerson,
  listInteractionsByDeal,
  updateDeal,
  updateDealStage,
} from "@/features/deals/services/dealsService";
import type {
  CreateDealInput,
  DealCardData,
  DealListParams,
  DealStage,
  UpdateDealInput,
} from "@/features/deals/types";
import { dealKeys } from "@/lib/queryKeys";

async function invalidateDealsForOrg(
  queryClient: ReturnType<typeof useQueryClient>,
  organizationId: string,
) {
  await queryClient.invalidateQueries({
    queryKey: dealKeys.list._def,
    predicate: (query) =>
      Array.isArray(query.queryKey) && query.queryKey.includes(`organization_id:${organizationId}`),
  });
}

export function useDealsList(params: DealListParams | null) {
  return useQuery({
    queryKey: params
      ? dealKeys.list(params.organizationId, {
          productId: params.productId,
          personSearch: params.personSearch,
        }).queryKey
      : (["deals", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!params) {
        throw new Error("Deal query params are required");
      }

      const result = await listDeals(params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load deals");
      }

      return result.data;
    },
    enabled: !!params,
  });
}

export function useDealDetail(organizationId: string | null, dealId: string | null) {
  return useQuery({
    queryKey:
      organizationId && dealId
        ? dealKeys.detail(organizationId, dealId).queryKey
        : (["deals", "detail", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !dealId) {
        throw new Error("Organization and deal are required");
      }

      const result = await getDealById(organizationId, dealId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!dealId,
  });
}

export function useDealsByPerson(organizationId: string | null, personId: string | null) {
  return useQuery({
    queryKey:
      organizationId && personId
        ? dealKeys.byPerson(organizationId, personId).queryKey
        : (["deals", "by-person", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId) {
        throw new Error("Organization and person are required");
      }

      const result = await listDealsByPerson(organizationId, personId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load deals");
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId,
  });
}

export function useDealInteractions(organizationId: string | null, dealId: string | null) {
  return useQuery({
    queryKey:
      organizationId && dealId
        ? dealKeys.interactions(organizationId, dealId).queryKey
        : (["deals", "interactions", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !dealId) {
        throw new Error("Organization and deal are required");
      }

      const result = await listInteractionsByDeal(organizationId, dealId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load interactions");
      }

      return result.data;
    },
    enabled: !!organizationId && !!dealId,
  });
}

export function useCheckDuplicateDeal(
  organizationId: string | null,
  personId: string | null,
  productId: string | null,
) {
  return useQuery({
    queryKey:
      organizationId && personId && productId
        ? dealKeys.duplicateCheck(organizationId, personId, productId).queryKey
        : (["deals", "duplicate-check", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!organizationId || !personId || !productId) {
        throw new Error("Organization, person, and product are required");
      }

      const result = await checkDuplicateDeal(organizationId, personId, productId);
      if (result.error) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId && !!personId && !!productId,
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateDealInput) => {
      const result = await createDeal(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to create deal");
      }

      return result.data;
    },
    onSuccess: async (deal) => {
      await invalidateDealsForOrg(queryClient, deal.organization_id);
      await queryClient.invalidateQueries({
        queryKey: dealKeys.byPerson(deal.organization_id, deal.person_id).queryKey,
      });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateDealInput) => {
      const result = await updateDeal(input);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update deal");
      }

      return result.data;
    },
    onSuccess: async (deal) => {
      await invalidateDealsForOrg(queryClient, deal.organization_id);
      await queryClient.invalidateQueries({
        queryKey: dealKeys.detail(deal.organization_id, deal.id).queryKey,
      });
    },
  });
}

export function useUpdateDealStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { dealId: string; stage: DealStage; organizationId: string }) => {
      const result = await updateDealStage(input.dealId, input.stage);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to update deal stage");
      }

      return result.data;
    },
    onMutate: async (input) => {
      // Optimistic update: cancel outgoing queries and update cache
      await queryClient.cancelQueries({
        queryKey: dealKeys.list._def,
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes(`organization_id:${input.organizationId}`),
      });

      // Snapshot all matching list queries
      const matchingQueries = queryClient.getQueriesData<DealCardData[]>({
        queryKey: dealKeys.list._def,
        predicate: (query) =>
          Array.isArray(query.queryKey) &&
          query.queryKey.includes(`organization_id:${input.organizationId}`),
      });

      // Optimistically update deals in list caches
      for (const [queryKey, data] of matchingQueries) {
        if (data) {
          queryClient.setQueryData(
            queryKey,
            data.map((deal) => (deal.id === input.dealId ? { ...deal, stage: input.stage } : deal)),
          );
        }
      }

      return { matchingQueries };
    },
    onError: (_error, _input, context) => {
      // Rollback on error
      if (context?.matchingQueries) {
        for (const [queryKey, data] of context.matchingQueries) {
          queryClient.setQueryData(queryKey, data);
        }
      }
    },
    onSettled: async (_data, _error, input) => {
      await invalidateDealsForOrg(queryClient, input.organizationId);
    },
  });
}
