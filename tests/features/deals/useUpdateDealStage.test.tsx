import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockListDeals,
  mockGetDealById,
  mockCreateDeal,
  mockUpdateDeal,
  mockUpdateDealStage,
  mockCheckDuplicateDeal,
  mockListDealsByPerson,
  mockListInteractionsByDeal,
} = vi.hoisted(() => ({
  mockListDeals: vi.fn(),
  mockGetDealById: vi.fn(),
  mockCreateDeal: vi.fn(),
  mockUpdateDeal: vi.fn(),
  mockUpdateDealStage: vi.fn(),
  mockCheckDuplicateDeal: vi.fn(),
  mockListDealsByPerson: vi.fn(),
  mockListInteractionsByDeal: vi.fn(),
}));

vi.mock("@/features/deals/services/dealsService", () => ({
  listDeals: mockListDeals,
  getDealById: mockGetDealById,
  createDeal: mockCreateDeal,
  updateDeal: mockUpdateDeal,
  updateDealStage: mockUpdateDealStage,
  checkDuplicateDeal: mockCheckDuplicateDeal,
  listDealsByPerson: mockListDealsByPerson,
  listInteractionsByDeal: mockListInteractionsByDeal,
}));

import { useUpdateDealStage } from "@/features/deals/hooks/useDeals";
import type { DealCardData } from "@/features/deals/types";
import { dealKeys } from "@/lib/queryKeys";

function createDeal(overrides: Partial<DealCardData> = {}): DealCardData {
  return {
    id: "deal-1",
    organization_id: "org-1",
    person_id: "person-1",
    product_id: "product-1",
    campaign_id: null,
    stage: "prospect",
    value: 400,
    currency: "EUR",
    next_step_at: null,
    notes: null,
    created_at: "2026-02-01T12:00:00Z",
    updated_at: "2026-02-02T12:00:00Z",
    person_name: "Alice",
    product_name: "Starter",
    ...overrides,
  };
}

describe("useUpdateDealStage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("optimistically updates stage and updated_at for matching org list caches", async () => {
    mockUpdateDealStage.mockResolvedValue({
      data: {
        id: "deal-1",
        organization_id: "org-1",
        person_id: "person-1",
        product_id: "product-1",
        campaign_id: null,
        stage: "interested",
        value: 400,
        currency: "EUR",
        next_step_at: null,
        notes: null,
        created_at: "2026-02-01T12:00:00Z",
        updated_at: "2026-02-03T12:00:00Z",
        created_by: "user-1",
      },
      error: null,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    vi.spyOn(queryClient, "cancelQueries").mockImplementation(
      () => new Promise<void>(() => undefined),
    );

    const listKeyA = dealKeys.list("org-1", {
      productId: null,
      personSearch: "",
    }).queryKey;
    const listKeyB = dealKeys.list("org-1", {
      productId: "product-2",
      personSearch: "",
    }).queryKey;
    const listKeyOtherOrg = dealKeys.list("org-2", {
      productId: null,
      personSearch: "",
    }).queryKey;

    const original = createDeal();
    const untouchedOther = createDeal({
      id: "deal-2",
      organization_id: "org-1",
      stage: "offer_sent",
      updated_at: "2026-02-03T12:00:00Z",
    });
    const otherOrgDeal = createDeal({
      id: "deal-3",
      organization_id: "org-2",
      stage: "prospect",
      updated_at: "2026-02-01T11:00:00Z",
    });

    queryClient.setQueryData(listKeyA, [original, untouchedOther]);
    queryClient.setQueryData(listKeyB, [original]);
    queryClient.setQueryData(listKeyOtherOrg, [otherOrgDeal]);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateDealStage(), { wrapper });

    let mutationPromise: Promise<unknown> | undefined;
    act(() => {
      mutationPromise = result.current.mutateAsync({
        dealId: "deal-1",
        stage: "interested",
        organizationId: "org-1",
      });
    });

    const optimisticA = queryClient.getQueryData<DealCardData[]>(listKeyA);
    const optimisticB = queryClient.getQueryData<DealCardData[]>(listKeyB);
    const untouchedOrg = queryClient.getQueryData<DealCardData[]>(listKeyOtherOrg);

    const movedInA = optimisticA?.find((deal) => deal.id === "deal-1");
    const movedInB = optimisticB?.find((deal) => deal.id === "deal-1");

    expect(movedInA?.stage).toBe("interested");
    expect(movedInB?.stage).toBe("interested");
    expect(movedInA?.updated_at).not.toBe(original.updated_at);
    expect(movedInB?.updated_at).not.toBe(original.updated_at);
    expect(untouchedOrg?.[0]?.stage).toBe("prospect");

    await act(async () => {
      await mutationPromise;
    });
  });
});
