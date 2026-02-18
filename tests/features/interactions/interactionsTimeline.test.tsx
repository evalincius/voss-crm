import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUsePersonInteractions, mockUseDeleteInteraction, mockMutateAsync } = vi.hoisted(() => ({
  mockUsePersonInteractions: vi.fn(),
  mockUseDeleteInteraction: vi.fn(),
  mockMutateAsync: vi.fn(),
}));

vi.mock("@/features/interactions/hooks/useInteractions", () => ({
  usePersonInteractions: mockUsePersonInteractions,
  useDeleteInteraction: mockUseDeleteInteraction,
}));

vi.mock("@/components/ui/tooltip", () => ({
  Tooltip: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TooltipContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { InteractionsTimeline } from "@/features/interactions/components/InteractionsTimeline";

describe("InteractionsTimeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders interactions", () => {
    mockUseDeleteInteraction.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    mockUsePersonInteractions.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: "interaction-1",
          type: "call",
          summary: "Intro call completed",
          occurred_at: "2026-02-14T10:00:00.000Z",
          next_step_at: null,
          deal_id: "deal-1",
          deal_product_name: "Starter Offer",
        },
      ],
    });

    render(<InteractionsTimeline organizationId="org-1" personId="person-1" />);

    expect(screen.getByText("Timeline")).toBeInTheDocument();
    expect(screen.getByText("Intro call completed")).toBeInTheDocument();
    expect(screen.getByText(/Deal:/)).toBeInTheDocument();
    expect(screen.getByText("Starter Offer")).toBeInTheDocument();
  });

  it("shows empty state", () => {
    mockUseDeleteInteraction.mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    });
    mockUsePersonInteractions.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [],
    });

    render(<InteractionsTimeline organizationId="org-1" personId="person-1" />);

    expect(screen.getByText("No interactions yet.")).toBeInTheDocument();
  });

  it("deletes interaction from card action", () => {
    mockUseDeleteInteraction.mockReturnValue({
      mutateAsync: mockMutateAsync.mockResolvedValue(undefined),
      isPending: false,
    });
    mockUsePersonInteractions.mockReturnValue({
      isLoading: false,
      isError: false,
      data: [
        {
          id: "interaction-1",
          type: "note",
          summary: "Follow-up note",
          occurred_at: "2026-02-14T10:00:00.000Z",
          next_step_at: null,
        },
      ],
    });

    render(<InteractionsTimeline organizationId="org-1" personId="person-1" />);

    fireEvent.click(screen.getByRole("button", { name: "Delete interaction" }));

    expect(mockMutateAsync).toHaveBeenCalledWith({
      interactionId: "interaction-1",
      organizationId: "org-1",
      personId: "person-1",
    });
  });
});
