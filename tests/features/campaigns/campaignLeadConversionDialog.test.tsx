import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { mockUseConvertCampaignLead, mockListCampaignProductOptions } = vi.hoisted(() => ({
  mockUseConvertCampaignLead: vi.fn(),
  mockListCampaignProductOptions: vi.fn(),
}));

vi.mock("@/features/campaigns/hooks/useCampaigns", () => ({
  useConvertCampaignLead: mockUseConvertCampaignLead,
}));

vi.mock("@/features/campaigns/services/campaignsService", () => ({
  listCampaignProductOptions: mockListCampaignProductOptions,
}));

import { CampaignLeadConversionDialog } from "@/features/campaigns/components/CampaignLeadConversionDialog";

function createDialogTree(
  queryClient: QueryClient,
  props: Partial<ComponentProps<typeof CampaignLeadConversionDialog>> = {},
) {
  return (
    <QueryClientProvider client={queryClient}>
      <CampaignLeadConversionDialog
        open
        onOpenChange={vi.fn()}
        organizationId="org-1"
        campaign={{ id: "camp-1", name: "Campaign", type: "cold_outreach" }}
        {...props}
      />
    </QueryClientProvider>
  );
}

function renderDialog(props: Partial<ComponentProps<typeof CampaignLeadConversionDialog>> = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return {
    queryClient,
    ...render(createDialogTree(queryClient, props)),
  };
}

function getProductNativeSelect() {
  const select = Array.from(document.querySelectorAll("select[aria-hidden='true']")).find(
    (element) =>
      Array.from(element.querySelectorAll("option")).some((option) =>
        option.getAttribute("value")?.startsWith("prod-"),
      ),
  );

  if (!select) {
    throw new Error("Product select not found");
  }

  return select as HTMLSelectElement;
}

describe("CampaignLeadConversionDialog", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("defaults to contact + deal mode for cold/warm campaigns", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter" }],
      error: null,
    });

    renderDialog({ campaign: { id: "camp-1", name: "Cold Campaign", type: "cold_outreach" } });

    expect(await screen.findByRole("combobox", { name: /conversion mode/i })).toHaveTextContent(
      "Contact + Deal",
    );
  });

  it("defaults to contact only mode for content campaigns", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter" }],
      error: null,
    });

    renderDialog({ campaign: { id: "camp-1", name: "Content Campaign", type: "content" } });

    expect(await screen.findByRole("combobox", { name: /conversion mode/i })).toHaveTextContent(
      "Contact only",
    );
  });

  it("uses deal-only mode for member conversion", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter" }],
      error: null,
    });

    renderDialog({
      memberPrefill: {
        id: "person-1",
        full_name: "Alice",
        email: "alice@example.com",
      },
    });

    expect(await screen.findByText(/Conversion mode:/i)).toBeInTheDocument();
    expect(screen.getByText("Deal only")).toBeInTheDocument();
  });

  it("preselects product for new lead conversion when defaultProductId is provided", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [
        { id: "prod-1", name: "Starter" },
        { id: "prod-2", name: "Pro" },
      ],
      error: null,
    });

    renderDialog({
      defaultProductId: "prod-1",
      campaign: { id: "camp-1", name: "Cold Campaign", type: "cold_outreach" },
    });

    await waitFor(() => {
      expect(screen.queryByText(/No active products available/i)).not.toBeInTheDocument();
    });
    expect(getProductNativeSelect().value).toBe("prod-1");
  });

  it("preselects product for member conversion when defaultProductId is provided", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [{ id: "prod-1", name: "Starter" }],
      error: null,
    });

    renderDialog({
      defaultProductId: "prod-1",
      memberPrefill: {
        id: "person-1",
        full_name: "Alice",
        email: "alice@example.com",
      },
    });

    await waitFor(() => {
      expect(screen.queryByText(/No active products available/i)).not.toBeInTheDocument();
    });
    expect(getProductNativeSelect().value).toBe("prod-1");
  });

  it("does not overwrite user-selected product when defaultProductId changes after open", async () => {
    mockUseConvertCampaignLead.mockReturnValue({ mutateAsync: vi.fn(), isPending: false });
    mockListCampaignProductOptions.mockResolvedValue({
      data: [
        { id: "prod-1", name: "Starter" },
        { id: "prod-2", name: "Pro" },
        { id: "prod-3", name: "Enterprise" },
      ],
      error: null,
    });

    const { queryClient, rerender } = renderDialog({
      defaultProductId: "prod-1",
      campaign: { id: "camp-1", name: "Cold Campaign", type: "cold_outreach" },
    });

    await waitFor(() => {
      expect(screen.queryByText(/No active products available/i)).not.toBeInTheDocument();
    });

    fireEvent.change(getProductNativeSelect(), {
      target: { value: "prod-2" },
    });
    expect(getProductNativeSelect().value).toBe("prod-2");

    rerender(
      createDialogTree(queryClient, {
        defaultProductId: "prod-3",
        campaign: { id: "camp-1", name: "Cold Campaign", type: "cold_outreach" },
      }),
    );

    await waitFor(() => {
      expect(getProductNativeSelect().value).toBe("prod-2");
    });
  });
});
