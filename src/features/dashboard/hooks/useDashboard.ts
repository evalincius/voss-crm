import { useQuery, keepPreviousData, type QueryKey } from "@tanstack/react-query";
import {
  getFollowUpsDue,
  getStaleDeals,
  getPipelineSnapshot,
  getTopProducts,
  getTopCampaigns,
} from "@/features/dashboard/services/dashboardService";
import type { FollowUpsQueryParams } from "@/features/dashboard/types";
import { dashboardKeys } from "@/lib/queryKeys";

export function useFollowUpsDue(orgId: string | null, params: FollowUpsQueryParams | null) {
  return useQuery({
    queryKey:
      orgId && params
        ? dashboardKeys.followUps(orgId, params).queryKey
        : (["dashboard", "followUps", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!orgId || !params) {
        throw new Error("Organization is required");
      }

      const result = await getFollowUpsDue(orgId, params);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load follow-ups");
      }

      return result.data;
    },
    enabled: !!orgId && !!params,
    placeholderData: keepPreviousData,
  });
}

export function useStaleDeals(orgId: string | null, threshold: number) {
  return useQuery({
    queryKey: orgId
      ? dashboardKeys.staleDeals(orgId, threshold).queryKey
      : (["dashboard", "staleDeals", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }

      const result = await getStaleDeals(orgId, threshold);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load stale deals");
      }

      return result.data;
    },
    enabled: !!orgId,
  });
}

export function usePipelineSnapshot(orgId: string | null) {
  return useQuery({
    queryKey: orgId
      ? dashboardKeys.pipeline(orgId).queryKey
      : (["dashboard", "pipeline", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }

      const result = await getPipelineSnapshot(orgId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load pipeline snapshot");
      }

      return result.data;
    },
    enabled: !!orgId,
  });
}

export function useTopProducts(orgId: string | null) {
  return useQuery({
    queryKey: orgId
      ? dashboardKeys.topProducts(orgId).queryKey
      : (["dashboard", "topProducts", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }

      const result = await getTopProducts(orgId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load top products");
      }

      return result.data;
    },
    enabled: !!orgId,
  });
}

export function useTopCampaigns(orgId: string | null) {
  return useQuery({
    queryKey: orgId
      ? dashboardKeys.topCampaigns(orgId).queryKey
      : (["dashboard", "topCampaigns", "disabled"] satisfies QueryKey),
    queryFn: async () => {
      if (!orgId) {
        throw new Error("Organization is required");
      }

      const result = await getTopCampaigns(orgId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load top campaigns");
      }

      return result.data;
    },
    enabled: !!orgId,
  });
}
