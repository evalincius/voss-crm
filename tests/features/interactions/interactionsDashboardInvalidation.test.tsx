import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateInteraction, mockDeleteInteraction, mockInvalidateDashboardForOrg } = vi.hoisted(
  () => ({
    mockCreateInteraction: vi.fn(),
    mockDeleteInteraction: vi.fn(),
    mockInvalidateDashboardForOrg: vi.fn(),
  }),
);

vi.mock("@/features/interactions/services/interactionsService", () => ({
  createInteraction: mockCreateInteraction,
  deleteInteraction: mockDeleteInteraction,
  listInteractionsByPerson: vi.fn(),
}));

vi.mock("@/lib/dashboardInvalidation", () => ({
  invalidateDashboardForOrg: mockInvalidateDashboardForOrg,
}));

import {
  useCreateInteraction,
  useDeleteInteraction,
} from "@/features/interactions/hooks/useInteractions";

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

describe("interaction dashboard invalidation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateDashboardForOrg.mockResolvedValue(undefined);
  });

  it("invalidates dashboard after creating interaction", async () => {
    mockCreateInteraction.mockResolvedValue({
      data: { id: "int-1", organization_id: "org-1", person_id: "person-1" },
      error: null,
    });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateInteraction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({} as never);
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });

  it("invalidates dashboard after deleting interaction", async () => {
    mockDeleteInteraction.mockResolvedValue({ error: null });
    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useDeleteInteraction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        interactionId: "int-1",
        organizationId: "org-1",
        personId: "person-1",
      });
    });

    expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
  });
});
