import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { QuickAddMenu } from "@/components/shared/QuickAddMenu";
import { AuthContext } from "@/providers/AuthProvider";
import type { AuthContextValue } from "@/features/auth/types";

const { mockNavigate } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...(actual as Record<string, unknown>),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({
    children,
    disabled,
    onSelect,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    onSelect?: () => void;
  }) => (
    <button type="button" disabled={disabled} onClick={onSelect}>
      {children}
    </button>
  ),
}));

function createAuthContextValue(currentOrganizationId: string | null): AuthContextValue {
  return {
    user: { id: "user-1", email: "test@example.com" } as AuthContextValue["user"],
    session: { user: { id: "user-1" } } as AuthContextValue["session"],
    loading: false,
    signOut: async () => {},
    organizations: currentOrganizationId
      ? [
          {
            id: currentOrganizationId,
            name: "Org",
            slug: "org",
            created_by: "user-1",
            logo_url: null,
            created_at: null,
            updated_at: null,
          },
        ]
      : [],
    currentOrganization: currentOrganizationId
      ? {
          id: currentOrganizationId,
          name: "Org",
          slug: "org",
          created_by: "user-1",
          logo_url: null,
          created_at: null,
          updated_at: null,
        }
      : null,
    switchOrganization: async () => {},
    refreshOrganizations: async () => {},
  };
}

describe("QuickAddMenu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all quick add intents", () => {
    render(
      <AuthContext.Provider value={createAuthContextValue("org-1")}>
        <QuickAddMenu />
      </AuthContext.Provider>,
    );

    expect(screen.getByText("Person")).toBeInTheDocument();
    expect(screen.getByText("Interaction")).toBeInTheDocument();
    expect(screen.getByText("Deal")).toBeInTheDocument();
    expect(screen.getByText("Campaign")).toBeInTheDocument();
    expect(screen.getByText("Template")).toBeInTheDocument();
  });

  it.each([
    ["Person", "/app/people", "person"],
    ["Interaction", "/app/people", "interaction"],
    ["Deal", "/app/deals", "deal"],
    ["Campaign", "/app/campaigns", "campaign"],
    ["Template", "/app/library/templates", "template"],
  ])("navigates to %s with org-aware quickAdd state", (label, expectedPath, intent) => {
    render(
      <AuthContext.Provider value={createAuthContextValue("org-1")}>
        <QuickAddMenu />
      </AuthContext.Provider>,
    );

    fireEvent.click(screen.getByText(label));

    expect(mockNavigate).toHaveBeenCalledWith(expectedPath, {
      state: {
        quickAdd: {
          intent,
          organization_id: "org-1",
        },
      },
    });
  });

  it("disables quick add when organization is not available", () => {
    render(
      <AuthContext.Provider value={createAuthContextValue(null)}>
        <QuickAddMenu />
      </AuthContext.Provider>,
    );

    expect(screen.getByRole("button", { name: "Quick Add" })).toBeDisabled();
  });
});
