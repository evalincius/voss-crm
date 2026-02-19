import { fireEvent, render, screen } from "@testing-library/react";
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

function makeItem(index: number, overrides?: Partial<FollowUpItem>): FollowUpItem {
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
    ...overrides,
  };
}

describe("FollowUpsWidget", () => {
  it("renders a mixed list with source indicators and max 5 preview rows", () => {
    mockUseFollowUpsDue.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        items: Array.from({ length: 8 }, (_, index) => makeItem(index + 1)),
        total: 10,
        page: 1,
        pageSize: 5,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("heading", { name: "Deals" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Interactions" })).not.toBeInTheDocument();
    expect(screen.getByText("Person 1")).toBeInTheDocument();
    expect(screen.getAllByText("Deal").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Interaction").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: /Person \d+/ }).length).toBe(5);
    expect(screen.queryByText("Person 6")).not.toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View all follow-ups" })).toHaveAttribute(
      "href",
      "/app/follow-ups",
    );
  });

  it("does not render section placeholder copy and still renders rows when preview has only deal follow-ups", () => {
    mockUseFollowUpsDue.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        items: Array.from({ length: 5 }, (_, index) =>
          makeItem(index + 1, {
            source: "deal",
            deal_id: `deal-${index + 1}`,
            deal_stage: "prospect",
            deal_product_name: `Product ${index + 1}`,
            interaction_type: null,
            interaction_summary: null,
          }),
        ),
        total: 5,
        page: 1,
        pageSize: 5,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.queryByText("No interaction follow-ups in preview")).not.toBeInTheDocument();
    expect(screen.getAllByText("Deal").length).toBeGreaterThan(0);
    expect(screen.queryByText("Interaction")).not.toBeInTheDocument();
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
        pageSize: 5,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole("link", { name: "View all follow-ups" })).not.toBeInTheDocument();
  });

  it("opens linked deal from interaction row when interaction includes deal_id", () => {
    const onSelectDeal = vi.fn();

    mockUseFollowUpsDue.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        items: [
          makeItem(1, {
            source: "interaction",
            deal_id: "deal-linked-1",
            deal_stage: null,
            deal_product_name: null,
            interaction_type: "call",
            interaction_summary: "Follow-up call",
          }),
        ],
        total: 1,
        page: 1,
        pageSize: 5,
      },
    });

    render(
      <MemoryRouter>
        <FollowUpsWidget organizationId="org-1" onSelectDeal={onSelectDeal} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Feb 2, 00:00")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View linked deal for Person 1" }));
    expect(onSelectDeal).toHaveBeenCalledWith("deal-linked-1");
  });
});
