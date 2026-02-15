import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockCampaignsListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCampaignsListView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/campaigns/components/CampaignsListView", () => ({
  CampaignsListView: (props: Record<string, unknown>) => {
    mockCampaignsListView(props);
    return <div>campaigns list view</div>;
  },
}));

import { CampaignsPage } from "@/pages/CampaignsPage";

describe("CampaignsPage", () => {
  it("passes organization and user context to campaigns list view", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    render(<CampaignsPage />);

    expect(screen.getByText("campaigns list view")).toBeInTheDocument();
    expect(mockCampaignsListView).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", userId: "user-1" }),
    );
  });
});
