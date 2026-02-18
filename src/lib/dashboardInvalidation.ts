import type { QueryClient } from "@tanstack/react-query";
import { dashboardKeys } from "@/lib/queryKeys";

export async function invalidateDashboardForOrg(queryClient: QueryClient, organizationId: string) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.followUps._def,
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.includes(`organization_id:${organizationId}`),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.staleDeals._def,
      predicate: (query) =>
        Array.isArray(query.queryKey) &&
        query.queryKey.includes(`organization_id:${organizationId}`),
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.pipeline(organizationId).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.topProducts(organizationId).queryKey,
    }),
    queryClient.invalidateQueries({
      queryKey: dashboardKeys.topCampaigns(organizationId).queryKey,
    }),
  ]);
}
