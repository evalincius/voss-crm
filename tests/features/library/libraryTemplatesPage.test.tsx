import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockTemplatesListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockTemplatesListView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/library/templates/components/TemplatesListView", () => ({
  TemplatesListView: (props: Record<string, unknown>) => {
    mockTemplatesListView(props);
    return <div>templates list view</div>;
  },
}));

import { LibraryTemplatesPage } from "@/pages/LibraryTemplatesPage";

describe("LibraryTemplatesPage", () => {
  it("passes quick add intent to template list view", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    const router = createMemoryRouter(
      [
        {
          path: "/app/library/templates",
          element: <LibraryTemplatesPage />,
        },
      ],
      {
        initialEntries: [
          {
            pathname: "/app/library/templates",
            state: {
              quickAdd: {
                intent: "template",
                organization_id: "org-1",
              },
            },
          },
        ],
      },
    );

    render(<RouterProvider router={router} />);

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
