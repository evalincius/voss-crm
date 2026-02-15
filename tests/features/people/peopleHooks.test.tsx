import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockListPeople } = vi.hoisted(() => ({
  mockListPeople: vi.fn(),
}));

vi.mock("@/features/people/services/peopleService", () => ({
  listPeople: mockListPeople,
  getPersonById: vi.fn(),
  createPerson: vi.fn(),
  updatePerson: vi.fn(),
  archivePerson: vi.fn(),
  unarchivePerson: vi.fn(),
}));

import { usePeopleList } from "@/features/people/hooks/usePeople";

describe("usePeopleList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads people data", async () => {
    mockListPeople.mockResolvedValue({
      data: {
        items: [{ id: "person-1", full_name: "Alice" }],
        total: 1,
        page: 1,
        pageSize: 20,
      },
      error: null,
    });

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(
      () =>
        usePeopleList({
          organizationId: "org-1",
          search: "",
          lifecycle: "all",
          archiveFilter: "active",
          sort: "updated_desc",
          page: 1,
          pageSize: 20,
          productInterest: null,
          sourceCampaign: null,
          hasOpenDeal: null,
        }),
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.items).toHaveLength(1);
  });
});
