import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const {
  mockUseProductDetail,
  mockUseProductPerformanceSummary,
  mockUseArchiveProduct,
  mockUseUnarchiveProduct,
} = vi.hoisted(() => ({
  mockUseProductDetail: vi.fn(),
  mockUseProductPerformanceSummary: vi.fn(),
  mockUseArchiveProduct: vi.fn(),
  mockUseUnarchiveProduct: vi.fn(),
}));

vi.mock("@/features/library/products/hooks/useProducts", () => ({
  useProductDetail: mockUseProductDetail,
  useProductPerformanceSummary: mockUseProductPerformanceSummary,
  useArchiveProduct: mockUseArchiveProduct,
  useUnarchiveProduct: mockUseUnarchiveProduct,
}));

vi.mock("@/features/library/products/components/ProductFormDialog", () => ({
  ProductFormDialog: () => null,
}));

import { ProductDetailView } from "@/features/library/products/components/ProductDetailView";

describe("ProductDetailView", () => {
  it("renders deep link to deals with product query param", () => {
    mockUseProductDetail.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        id: "product-1",
        name: "Offer A",
        description: "Description",
        is_archived: false,
      },
    });
    mockUseProductPerformanceSummary.mockReturnValue({
      isLoading: false,
      isError: false,
      data: {
        stageCounts: {
          prospect: 0,
          offer_sent: 0,
          interested: 0,
          objection: 0,
          validated: 0,
          lost: 0,
        },
        relatedCampaigns: [],
        linkedTemplates: [],
      },
    });
    mockUseArchiveProduct.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseUnarchiveProduct.mockReturnValue({ mutateAsync: vi.fn() });

    render(
      <MemoryRouter>
        <ProductDetailView organizationId="org-1" userId="user-1" productId="product-1" />
      </MemoryRouter>,
    );

    const dealsLink = screen.getByRole("link", { name: "View on Deals board" });
    expect(dealsLink.getAttribute("href")).toContain("/app/deals?product_id=product-1");
  });
});
