import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  mockUseTemplateDetail,
  mockUseTemplateUsedInSummary,
  mockUseTemplateLinkedProductIds,
  mockUseTemplateProductOptions,
  mockUseSetTemplateStatus,
} = vi.hoisted(() => ({
  mockUseTemplateDetail: vi.fn(),
  mockUseTemplateUsedInSummary: vi.fn(),
  mockUseTemplateLinkedProductIds: vi.fn(),
  mockUseTemplateProductOptions: vi.fn(),
  mockUseSetTemplateStatus: vi.fn(),
}));

vi.mock("@/features/library/templates/hooks/useTemplates", () => ({
  useTemplateDetail: mockUseTemplateDetail,
  useTemplateUsedInSummary: mockUseTemplateUsedInSummary,
  useTemplateLinkedProductIds: mockUseTemplateLinkedProductIds,
  useTemplateProductOptions: mockUseTemplateProductOptions,
  useSetTemplateStatus: mockUseSetTemplateStatus,
}));

vi.mock("@/features/library/templates/components/TemplateFormDialog", () => ({
  TemplateFormDialog: () => null,
}));

import { TemplateDetailView } from "@/features/library/templates/components/TemplateDetailView";

describe("TemplateDetailView", () => {
  it("renders used-in metrics and linked products", () => {
    mockUseTemplateDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: "template-1",
        title: "Cold opener",
        category: "cold_email",
        status: "approved",
        body: "Hi there",
      },
    });
    mockUseTemplateUsedInSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        interactionsCount: 5,
        interactionsWithDealCount: 2,
        campaignCount: 0,
        dealsIndirectCount: 2,
      },
    });
    mockUseTemplateLinkedProductIds.mockReturnValue({
      isLoading: false,
      data: ["product-1"],
    });
    mockUseTemplateProductOptions.mockReturnValue({
      isLoading: false,
      data: [{ id: "product-1", name: "Offer A" }],
    });
    mockUseSetTemplateStatus.mockReturnValue({ mutateAsync: vi.fn() });

    render(
      <MemoryRouter>
        <TemplateDetailView organizationId="org-1" userId="user-1" templateId="template-1" />
      </MemoryRouter>,
    );

    expect(screen.getByText("Offer A")).toBeInTheDocument();
    expect(screen.getByText(/Interactions:/)).toBeInTheDocument();
    expect(screen.getByText(/Deals indirect/)).toBeInTheDocument();
  });
});
