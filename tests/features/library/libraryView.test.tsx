import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockProductsListView, mockTemplatesListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockProductsListView: vi.fn(),
  mockTemplatesListView: vi.fn(),
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

vi.mock("@/features/library/templates/components/TemplatesListView", () => ({
  TemplatesListView: (props: Record<string, unknown>) => {
    mockTemplatesListView(props);
    return <div>templates list view</div>;
  },
}));

import { LibraryView } from "@/pages/LibraryView";

function renderLibrary(url: string, state?: unknown) {
  const parsed = new URL(url, "https://example.test");

  const router = createMemoryRouter([{ path: "/app/library", element: <LibraryView /> }], {
    initialEntries: [{ pathname: parsed.pathname, search: parsed.search, state }],
  });

  render(<RouterProvider router={router} />);
}

describe("LibraryView", () => {
  it("defaults to products tab", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    renderLibrary("/app/library");

    expect(await screen.findByText("products list view")).toBeInTheDocument();
    expect(screen.queryByText("templates list view")).not.toBeInTheDocument();
  });

  it("shows templates tab when tab query is templates", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    renderLibrary("/app/library?tab=templates");

    expect(await screen.findByText("templates list view")).toBeInTheDocument();
  });

  it("falls back to products for invalid tab", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    renderLibrary("/app/library?tab=invalid");

    expect(await screen.findByText("products list view")).toBeInTheDocument();
  });

  it("uses quick-add template intent fallback when tab is missing", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    renderLibrary("/app/library", {
      quickAdd: {
        intent: "template",
        organization_id: "org-1",
      },
    });

    expect(await screen.findByText("templates list view")).toBeInTheDocument();
    expect(mockTemplatesListView).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        quickAddIntent: "template",
      }),
    );
  });
});
