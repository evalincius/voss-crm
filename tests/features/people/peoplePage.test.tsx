import { createMemoryRouter, RouterProvider } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { mockUseAuth, mockPeopleListView } = vi.hoisted(() => ({
  mockUseAuth: vi.fn(),
  mockPeopleListView: vi.fn(),
}));

vi.mock("@/features/auth/hooks/useAuth", () => ({
  useAuth: mockUseAuth,
}));

vi.mock("@/features/people/components/PeopleListView", () => ({
  PeopleListView: (props: Record<string, unknown>) => {
    mockPeopleListView(props);
    return <div>people list view</div>;
  },
}));

import { PeoplePage } from "@/pages/PeoplePage";

describe("PeoplePage", () => {
  it("passes quick add intent to list view", async () => {
    mockUseAuth.mockReturnValue({
      currentOrganization: { id: "org-1" },
      user: { id: "user-1" },
    });

    const router = createMemoryRouter(
      [
        {
          path: "/app/people",
          element: <PeoplePage />,
        },
      ],
      {
        initialEntries: [
          {
            pathname: "/app/people",
            state: {
              quickAdd: {
                intent: "interaction",
                organization_id: "org-1",
              },
            },
          },
        ],
      },
    );

    render(<RouterProvider router={router} />);

    expect(await screen.findByText("people list view")).toBeInTheDocument();
    expect(mockPeopleListView).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        userId: "user-1",
        quickAddIntent: "interaction",
      }),
    );
  });
});
