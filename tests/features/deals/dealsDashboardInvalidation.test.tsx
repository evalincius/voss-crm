import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateDeal, mockUpdateDeal, mockUpdateDealStage, mockInvalidateDashboardForOrg } =
  vi.hoisted(() => ({
    mockCreateDeal: vi.fn(),
    mockUpdateDeal: vi.fn(),
    mockUpdateDealStage: vi.fn(),
    mockInvalidateDashboardForOrg: vi.fn(),
  }));

vi.mock("@/features/deals/services/dealsService", () => ({
  listDeals: vi.fn(),
  getDealById: vi.fn(),
  createDeal: mockCreateDeal,
  updateDeal: mockUpdateDeal,
  updateDealStage: mockUpdateDealStage,
  checkDuplicateDeal: vi.fn(),
  listDealsByPerson: vi.fn(),
  listInteractionsByDeal: vi.fn(),
}));

vi.mock("@/lib/dashboardInvalidation", () => ({
  invalidateDashboardForOrg: mockInvalidateDashboardForOrg,
}));

import { useCreateDeal, useUpdateDeal, useUpdateDealStage } from "@/features/deals/hooks/useDeals";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}

describe("deal dashboard invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateDashboardForOrg.mockResolvedValue(undefined);
  });

  it("invalidates dashboard after creating a deal", async () => {
    mockCreateDeal.mockResolvedValue({
      data: { id: "d-1", organization_id: "org-1", person_id: "p-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateDeal(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });

  it("invalidates dashboard after updating a deal", async () => {
    mockUpdateDeal.mockResolvedValue({
      data: { id: "d-1", organization_id: "org-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateDeal(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });

  it("invalidates dashboard after stage updates settle", async () => {
    mockUpdateDealStage.mockResolvedValue({
      data: { id: "d-1", organization_id: "org-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useUpdateDealStage(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        dealId: "d-1",
        stage: "interested",
        organizationId: "org-1",
      });
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });
});
