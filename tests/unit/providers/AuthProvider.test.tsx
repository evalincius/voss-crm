import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";

const {
  mockGetSession,
  mockOnAuthStateChange,
  mockSignOut,
  mockGetUserOrganizationIds,
  mockGetUserCurrentOrganizationId,
  mockGetOrganizationsByIds,
  mockSetCurrentOrganization,
  mockQueryClientClear,
} = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSignOut: vi.fn(),
  mockGetUserOrganizationIds: vi.fn(),
  mockGetUserCurrentOrganizationId: vi.fn(),
  mockGetOrganizationsByIds: vi.fn(),
  mockSetCurrentOrganization: vi.fn(),
  mockQueryClientClear: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
      signOut: mockSignOut,
    },
  },
}));

vi.mock("@/lib/queryClient", () => ({
  queryClient: {
    clear: mockQueryClientClear,
  },
}));

vi.mock("@/features/organizations/services/organizationService", () => ({
  getUserOrganizationIds: mockGetUserOrganizationIds,
  getUserCurrentOrganizationId: mockGetUserCurrentOrganizationId,
  getOrganizationsByIds: mockGetOrganizationsByIds,
  setCurrentOrganization: mockSetCurrentOrganization,
}));

function AuthProviderHarness() {
  const { currentOrganization, switchOrganization } = useAuth();

  return (
    <div>
      <span data-testid="current-org">{currentOrganization?.id ?? "none"}</span>
      <button type="button" onClick={() => void switchOrganization("org-2")}>
        Switch Org
      </button>
    </div>
  );
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: {
            id: "user-1",
            email: "test@example.com",
          },
        },
      },
    });

    mockOnAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn(),
        },
      },
    });

    mockGetUserOrganizationIds.mockResolvedValue({
      data: ["org-1", "org-2"],
      error: null,
    });

    mockGetOrganizationsByIds.mockResolvedValue({
      data: [
        {
          id: "org-1",
          name: "Org 1",
          slug: "org-1",
          created_by: "user-1",
          logo_url: null,
          created_at: null,
          updated_at: null,
        },
        {
          id: "org-2",
          name: "Org 2",
          slug: "org-2",
          created_by: "user-1",
          logo_url: null,
          created_at: null,
          updated_at: null,
        },
      ],
      error: null,
    });

    mockGetUserCurrentOrganizationId.mockResolvedValue({
      data: "org-1",
      error: null,
    });

    mockSetCurrentOrganization.mockResolvedValue({
      error: null,
    });
  });

  it("clears query cache and updates current org on switchOrganization", async () => {
    render(
      <AuthProvider>
        <AuthProviderHarness />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-org")).toHaveTextContent("org-1");
    });

    fireEvent.click(screen.getByRole("button", { name: "Switch Org" }));

    await waitFor(() => {
      expect(mockSetCurrentOrganization).toHaveBeenCalledWith("user-1", "org-2");
      expect(mockQueryClientClear).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("current-org")).toHaveTextContent("org-2");
    });
  });
});
