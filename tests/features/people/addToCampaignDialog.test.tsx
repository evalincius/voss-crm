import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { AddToCampaignDialog } from "@/features/people/components/AddToCampaignDialog";

const { mockInvalidateDashboardForOrg, mockToastSuccess } = vi.hoisted(() => ({
  mockInvalidateDashboardForOrg: vi.fn(),
  mockToastSuccess: vi.fn(),
}));

const { mockSupabaseFrom } = vi.hoisted(() => ({
  mockSupabaseFrom: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
}));

vi.mock("@/lib/dashboardInvalidation", () => ({
  invalidateDashboardForOrg: mockInvalidateDashboardForOrg,
}));

vi.mock("@/components/ui/select", () => {
  let onValueChangeRef: ((value: string) => void) | null = null;

  return {
    Select: ({
      onValueChange,
      children,
    }: {
      onValueChange: (value: string) => void;
      children: ReactNode;
    }) => {
      onValueChangeRef = onValueChange;
      return <div>{children}</div>;
    },
    SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
    SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: ReactNode }) => (
      <button type="button" onClick={() => onValueChangeRef?.(value)}>
        {children}
      </button>
    ),
  };
});

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: mockSupabaseFrom,
  },
}));

function createCampaignsBuilder() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() =>
            Promise.resolve({
              data: [{ id: "camp-1", name: "Campaign A" }],
              error: null,
            }),
          ),
        })),
      })),
    })),
  };
}

function createCampaignPeopleBuilder() {
  return {
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        eq: vi.fn(() => ({
          in: vi.fn(() =>
            Promise.resolve({
              data: [],
              error: null,
            }),
          ),
        })),
      })),
    })),
    insert: vi.fn(() => Promise.resolve({ error: null })),
  };
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { wrapper };
}

describe("AddToCampaignDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInvalidateDashboardForOrg.mockResolvedValue(undefined);
    mockSupabaseFrom.mockImplementation((table: string) => {
      if (table === "campaigns") {
        return createCampaignsBuilder();
      }

      if (table === "campaign_people") {
        return createCampaignPeopleBuilder();
      }

      throw new Error(`Unexpected table ${table}`);
    });
  });

  it("invalidates dashboard on successful insertion", async () => {
    const onOpenChange = vi.fn();
    const { wrapper } = createWrapper();

    render(
      <AddToCampaignDialog
        open
        onOpenChange={onOpenChange}
        organizationId="org-1"
        userId="user-1"
        personIds={["p-1"]}
      />,
      { wrapper },
    );

    await screen.findByText("Campaign A");
    fireEvent.click(screen.getByRole("button", { name: "Campaign A" }));
    fireEvent.click(screen.getByRole("button", { name: "Add to campaign" }));

    await waitFor(() => {
      expect(mockInvalidateDashboardForOrg).toHaveBeenCalledWith(expect.anything(), "org-1");
    });
  });
});
