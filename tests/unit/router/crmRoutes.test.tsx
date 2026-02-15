import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { appRoutes } from "@/app/router";
import { AuthContext } from "@/providers/AuthProvider";
import type { AuthContextValue } from "@/features/auth/types";

function createAuthContextValue(isAuthenticated: boolean): AuthContextValue {
  const organization = {
    id: "org-1",
    name: "Org",
    slug: "org",
    created_by: "user-1",
    logo_url: null,
    created_at: null,
    updated_at: null,
  };

  return {
    user: isAuthenticated
      ? ({ id: "user-1", email: "test@example.com" } as AuthContextValue["user"])
      : null,
    session: isAuthenticated ? ({ user: { id: "user-1" } } as AuthContextValue["session"]) : null,
    loading: false,
    signOut: async () => {},
    organizations: isAuthenticated ? [organization] : [],
    currentOrganization: isAuthenticated ? organization : null,
    switchOrganization: async () => {},
    refreshOrganizations: async () => {},
  };
}

function renderRoute(path: string, isAuthenticated: boolean) {
  const router = createMemoryRouter(appRoutes, {
    initialEntries: [path],
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={createAuthContextValue(isAuthenticated)}>
        <RouterProvider router={router} />
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

describe("CRM routes", () => {
  it.each([
    ["/app/dashboard", "Dashboard"],
    ["/app/people", "People"],
    ["/app/people/person-1", "Person Detail"],
    ["/app/campaigns", "Campaigns"],
    ["/app/campaigns/campaign-1", "Campaign Detail"],
    ["/app/deals", "Deals"],
    ["/app/library/products", "Library - Products"],
    ["/app/library/products/product-1", "Library - Product Detail"],
    ["/app/library/templates", "Library - Templates"],
    ["/app/library/templates/template-1", "Library - Template Detail"],
  ])("renders %s for authenticated users", async (path, heading) => {
    renderRoute(path, true);
    const matches = await screen.findAllByRole("heading", { name: heading });
    expect(matches.length).toBeGreaterThan(0);
  });

  it.each([
    "/app/dashboard",
    "/app/people",
    "/app/people/person-1",
    "/app/campaigns",
    "/app/campaigns/campaign-1",
    "/app/deals",
    "/app/library/products",
    "/app/library/products/product-1",
    "/app/library/templates",
    "/app/library/templates/template-1",
  ])("redirects %s to login when unauthenticated", async (path) => {
    renderRoute(path, false);
    expect(await screen.findByRole("heading", { name: "Login" })).toBeInTheDocument();
  });

  it("handles quick add route state for template intent", async () => {
    const router = createMemoryRouter(appRoutes, {
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
    });
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={createAuthContextValue(true)}>
          <RouterProvider router={router} />
        </AuthContext.Provider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText(/Quick Add intent detected/i)).toBeInTheDocument();
  });
});
