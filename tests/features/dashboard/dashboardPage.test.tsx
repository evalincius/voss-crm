import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockDashboardView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockDashboardView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/dashboard/components/DashboardView", () => ({
  DashboardView: (props: Record<string, unknown>) => {
    mockDashboardView(props);
    return <div>dashboard view</div>;
  },
}));

import { DashboardPage } from "@/pages/DashboardPage";

describe("DashboardPage", () => {
  it("renders DashboardView with org and user context", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    render(<DashboardPage />);

    expect(screen.getByText("dashboard view")).toBeInTheDocument();
    expect(mockDashboardView).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", userId: "user-1" }),
    );
  });

  it("renders loading state when org is not available", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: null,
      user: { id: "user-1" },
    });

    render(<DashboardPage />);

    expect(screen.queryByText("dashboard view")).not.toBeInTheDocument();
  });

  it("renders loading state when user is not available", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: null,
    });

    render(<DashboardPage />);

    expect(screen.queryByText("dashboard view")).not.toBeInTheDocument();
  });
});
