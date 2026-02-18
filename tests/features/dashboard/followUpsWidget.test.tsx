import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import type { FollowUpItem } from "@/features/dashboard/types";

const { mockUseFollowUpsDue } = vi.hoisted(() => ({
  mockUseFollowUpsDue: vi.fn(),
}));

vi.mock("@/features/dashboard/hooks/useDashboard", () => ({
  useFollowUpsDue: mockUseFollowUpsDue,
}));

import { FollowUpsWidget } from "@/features/dashboard/components/FollowUpsWidget";

function makeItem(index: number): FollowUpItem {
  return {
    id: `id-${index}`,
    source: index % 2 === 0 ? "deal" : "interaction",
    next_step_at: new Date(2026, 1, index + 1).toISOString(),
    deal_id: index % 2 === 0 ? `deal-${index}` : null,
    deal_stage: index % 2 === 0 ? "prospect" : null,
    deal_product_name: index % 2 === 0 ? `Product ${index}` : null,
    person_id: `person-${index}`,
    person_name: `Person ${index}`,
    interaction_type: index % 2 === 1 ? "call" : null,
    interaction_summary: index % 2 === 1 ? `Summary ${index}` : null,
  };
}

describe("FollowUpsWidget", () => {
  it("renders a max of 8 preview rows and shows CTA when more records exist", () => {
    mockUseFollowUpsDue.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        items: Array.from({ length: 8 }, (_, index) => makeItem(index + 1)),
        total: 10,
        page: 1,
        pageSize: 8,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: /Person \d+/ }).length).toBeLessThanOrEqual(8);
    expect(screen.queryByText("Person 9")).not.toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all follow-ups" })).toHaveAttribute(
      "href",
      "/app/follow-ups",
    );
  });

  it("does not render CTA when total count is within preview limit", () => {
    mockUseFollowUpsDue.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        items: Array.from({ length: 5 }, (_, index) => makeItem(index + 1)),
        total: 5,
        page: 1,
        pageSize: 8,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "View all follow-ups" })).not.toBeInTheDocument();
  });
});
