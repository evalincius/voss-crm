import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockCampaignDetailView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockCampaignDetailView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("react-router", () => ({
  useParams: () => ({ id: "camp-1" }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => (
    <a href={to}>{children}</a>
  ),
}));

vi.mock("@/features/campaigns/components/CampaignDetailView", () => ({
  CampaignDetailView: (props: Record<string, unknown>) => {
    mockCampaignDetailView(props);
    return <div>campaign detail view</div>;
  },
}));

import { CampaignDetailPage } from "@/pages/CampaignDetailPage";

describe("CampaignDetailPage", () => {
  it("passes organization, user, and campaign id to detail view", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    render(<CampaignDetailPage />);

    expect(screen.getByText("campaign detail view")).toBeInTheDocument();
    expect(mockCampaignDetailView).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        campaignId: "camp-1",
      }),
    );
  });
});
