import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { invalidateDashboardForOrg } from "@/lib/dashboardInvalidation";
import { dashboardKeys } from "@/lib/queryKeys";

describe("dashboard invalidation", () => {
  it("invalidates all dashboard queries scoped to organization", async () => {
    const queryClient = new QueryClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue(undefined);

    await invalidateDashboardForOrg(queryClient, "org-1");

    expect(invalidateSpy).toHaveBeenCalledTimes(5);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dashboardKeys.pipeline("org-1").queryKey }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dashboardKeys.topProducts("org-1").queryKey }),
    );
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: dashboardKeys.topCampaigns("org-1").queryKey }),
    );

    const followUpsCall = invalidateSpy.mock.calls.find(
      (call) => call[0]?.queryKey === dashboardKeys.followUps._def,
    );
    const staleDealsCall = invalidateSpy.mock.calls.find(
      (call) => call[0]?.queryKey === dashboardKeys.staleDeals._def,
    );

    if (!followUpsCall || !staleDealsCall) {
      throw new Error("Expected followUps and staleDeals invalidation calls");
    }

    const followUpsOptions = followUpsCall[0];
    const staleDealsOptions = staleDealsCall[0];

    if (!followUpsOptions || !staleDealsOptions) {
      throw new Error("Expected invalidation options");
    }

    const followUpsPredicate = followUpsOptions.predicate;
    const staleDealsPredicate = staleDealsOptions.predicate;

    expect(
      followUpsPredicate?.({
        queryKey: ["dashboard", "followUps", "organization_id:org-1"],
      } as never),
    ).toBe(true);
    expect(
      followUpsPredicate?.({
        queryKey: ["dashboard", "followUps", "organization_id:org-2"],
      } as never),
    ).toBe(false);

    expect(
      staleDealsPredicate?.({
        queryKey: ["dashboard", "staleDeals", "organization_id:org-1", "threshold:14"],
      } as never),
    ).toBe(true);
    expect(
      staleDealsPredicate?.({
        queryKey: ["dashboard", "staleDeals", "organization_id:org-2", "threshold:14"],
      } as never),
    ).toBe(false);
  });
});
