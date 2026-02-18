import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockFollowUpsListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockFollowUpsListView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/dashboard/components/FollowUpsListView", () => ({
  FollowUpsListView: (props: Record<string, unknown>) => {
    mockFollowUpsListView(props);
    return <div>follow-ups list view</div>;
  },
}));

import { FollowUpsPage } from "@/pages/FollowUpsPage";

describe("FollowUpsPage", () => {
  it("renders FollowUpsListView with org and user context", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    render(<FollowUpsPage />);

    expect(screen.getByText("follow-ups list view")).toBeInTheDocument();
    expect(mockFollowUpsListView).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", userId: "user-1" }),
    );
  });

  it("renders loading state when org is not available", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: null,
      user: { id: "user-1" },
    });

    render(<FollowUpsPage />);

    expect(screen.queryByText("follow-ups list view")).not.toBeInTheDocument();
  });

  it("renders loading state when user is not available", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: null,
    });

    render(<FollowUpsPage />);

    expect(screen.queryByText("follow-ups list view")).not.toBeInTheDocument();
  });
});
