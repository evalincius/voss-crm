import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockProductsListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockProductsListView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/library/products/components/ProductsListView", () => ({
  ProductsListView: (props: Record<string, unknown>) => {
    mockProductsListView(props);
    return <div>products list view</div>;
  },
}));

import { LibraryProductsPage } from "@/pages/LibraryProductsPage";

describe("LibraryProductsPage", () => {
  it("passes organization and user context to products list view", () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    render(<LibraryProductsPage />);

    expect(screen.getByText("products list view")).toBeInTheDocument();
    expect(mockProductsListView).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1", userId: "user-1" }),
    );
  });
});
