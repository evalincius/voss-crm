import { createContext, type ReactNode, useContext } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockMutateAsync,
  mockToastSuccess,
  mockUseInteractionDealContext,
  mockUseInteractionAssociationOptions,
} = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockUseInteractionDealContext: vi.fn(),
  mockUseInteractionAssociationOptions: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: mockToastSuccess,
  },
}));

vi.mock("@/components/ui/dialog", () => ({
  Dialog: ({ open, children }: { open: boolean; children: ReactNode }) =>
    open ? <>{children}</> : null,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <p>{children}</p>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

const SelectContext = createContext<((value: string) => void) | null>(null);

vi.mock("@/components/ui/select", () => ({
  Select: ({
    onValueChange,
    children,
  }: {
    onValueChange?: (value: string) => void;
    children: ReactNode;
  }) => <SelectContext.Provider value={onValueChange ?? null}>{children}</SelectContext.Provider>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ value, children }: { value: string; children: ReactNode }) => {
    const onValueChange = useContext(SelectContext);
    return (
      <button type="button" onClick={() => onValueChange?.(value)}>
        {children}
      </button>
    );
  },
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("@/features/interactions/hooks/useInteractions", () => ({
  useCreateInteraction: () => ({
    mutateAsync: mockMutateAsync,
  }),
  useInteractionDealContext: mockUseInteractionDealContext,
  useInteractionAssociationOptions: mockUseInteractionAssociationOptions,
}));

import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const USER_ID = "00000000-0000-4000-8000-000000000002";
const PERSON_ID = "00000000-0000-4000-8000-000000000003";
const DEAL_ID = "aaaaaaaa-0000-4000-8000-000000000004";
const PERSON_DEAL_ID = "11111111-1111-4111-8111-111111111111";
const CAMPAIGN_ONE_ID = "22222222-2222-4222-8222-222222222222";
const CAMPAIGN_TWO_ID = "33333333-3333-4333-8333-333333333333";
const PRODUCT_ONE_ID = "44444444-4444-4444-8444-444444444444";
const PRODUCT_TWO_ID = "55555555-5555-4555-8555-555555555555";

function mockDefaultOptionHooks() {
  mockUseInteractionDealContext.mockReturnValue({
    isLoading: false,
    isError: false,
    error: null,
    data: null,
  });
  mockUseInteractionAssociationOptions.mockReturnValue({
    isLoading: false,
    isError: false,
    error: null,
    data: {
      deals: [
        {
          id: PERSON_DEAL_ID,
          label: "Starter Plan (prospect)",
          product_id: PRODUCT_ONE_ID,
          campaign_id: null,
        },
      ],
      campaigns: [
        { id: CAMPAIGN_ONE_ID, name: "Campaign One", product_id: PRODUCT_ONE_ID },
        { id: CAMPAIGN_TWO_ID, name: "Campaign Two", product_id: PRODUCT_TWO_ID },
      ],
      products: [
        { id: PRODUCT_ONE_ID, name: "Starter Plan" },
        { id: PRODUCT_TWO_ID, name: "Growth Plan" },
      ],
      templates: [],
    },
  });
}

describe("InteractionFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "interaction-1" });
    mockDefaultOptionHooks();
  });

  it("locks deal and product prefilled in deal context", async () => {
    mockUseInteractionDealContext.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        deal_id: DEAL_ID,
        product_id: PRODUCT_ONE_ID,
        campaign_id: CAMPAIGN_ONE_ID,
        deal_label: "#aaaaaaaa",
        product_name: "Starter Plan",
        campaign_name: "Campaign One",
      },
    });
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
        dealId={DEAL_ID}
      />,
    );

    await waitFor(() => {
      expect(screen.getByLabelText("Deal")).toHaveValue("#aaaaaaaa");
      expect(screen.getByLabelText("Product")).toHaveValue("Starter Plan");
      expect(screen.getByLabelText("Campaign")).toHaveValue("Campaign One");
      expect(screen.queryByLabelText("Template")).not.toBeInTheDocument();
    });
  });

  it("shows campaign select in deal context when deal has no campaign", async () => {
    mockUseInteractionDealContext.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        deal_id: DEAL_ID,
        product_id: PRODUCT_ONE_ID,
        campaign_id: null,
        deal_label: "#aaaaaaaa",
        product_name: "Starter Plan",
        campaign_name: null,
      },
    });
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
        dealId={DEAL_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Campaign One" }));
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Deal interaction without source campaign" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deal_id: DEAL_ID,
          product_id: PRODUCT_ONE_ID,
          campaign_id: CAMPAIGN_ONE_ID,
          template_id: null,
        }),
      );
    });
  });

  it("does not show template field in deal context", async () => {
    mockUseInteractionDealContext.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        deal_id: DEAL_ID,
        product_id: PRODUCT_ONE_ID,
        campaign_id: CAMPAIGN_ONE_ID,
        deal_label: "#aaaaaaaa",
        product_name: "Starter Plan",
        campaign_name: "Campaign One",
      },
    });

    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
        dealId={DEAL_ID}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByLabelText("Template")).not.toBeInTheDocument();
    });
  });

  it("allows selecting all associations in person context", async () => {
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Starter Plan (prospect)" }));
    fireEvent.click(screen.getByRole("button", { name: "Campaign Two" }));
    fireEvent.click(screen.getByRole("button", { name: "Growth Plan" }));
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Person detail interaction" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: PERSON_ID,
          deal_id: null,
          campaign_id: null,
          product_id: PRODUCT_TWO_ID,
          template_id: null,
          summary: "Person detail interaction",
        }),
      );
    });
  });

  it("clears selected deal when campaign is manually selected", async () => {
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Starter Plan (prospect)" }));
    fireEvent.click(screen.getByRole("button", { name: "Campaign Two" }));
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Campaign should override deal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deal_id: null,
          campaign_id: CAMPAIGN_TWO_ID,
          product_id: PRODUCT_TWO_ID,
        }),
      );
    });
  });

  it("prefills campaign and product when selecting a deal in person context", async () => {
    mockUseInteractionAssociationOptions.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      data: {
        deals: [
          {
            id: PERSON_DEAL_ID,
            label: "Starter Plan (prospect)",
            product_id: PRODUCT_ONE_ID,
            campaign_id: CAMPAIGN_ONE_ID,
          },
        ],
        campaigns: [{ id: CAMPAIGN_ONE_ID, name: "Campaign One", product_id: PRODUCT_ONE_ID }],
        products: [
          { id: PRODUCT_ONE_ID, name: "Starter Plan" },
          { id: PRODUCT_TWO_ID, name: "Growth Plan" },
        ],
        templates: [],
      },
    });

    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Starter Plan (prospect)" }));
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Deal-linked prefill check" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deal_id: PERSON_DEAL_ID,
          campaign_id: CAMPAIGN_ONE_ID,
          product_id: PRODUCT_ONE_ID,
        }),
      );
    });
  });

  it("prefills product when selecting a campaign in person context", async () => {
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Campaign Two" }));
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Campaign-linked prefill check" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deal_id: null,
          campaign_id: CAMPAIGN_TWO_ID,
          product_id: PRODUCT_TWO_ID,
        }),
      );
    });
  });

  it("submits null associations in person context when none selected", async () => {
    render(
      <InteractionFormDialog
        open
        onOpenChange={vi.fn()}
        organizationId={ORG_ID}
        userId={USER_ID}
        personId={PERSON_ID}
      />,
    );

    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "No associations selected" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          person_id: PERSON_ID,
          deal_id: null,
          campaign_id: null,
          product_id: null,
          template_id: null,
        }),
      );
    });
  });
});
