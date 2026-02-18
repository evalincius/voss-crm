import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";

const { mockMutateAsync, mockToastSuccess } = vi.hoisted(() => ({
  mockMutateAsync: vi.fn(),
  mockToastSuccess: vi.fn(),
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

vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectTrigger: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SelectValue: ({ placeholder }: { placeholder?: string }) => <span>{placeholder}</span>,
}));

vi.mock("@/features/interactions/hooks/useInteractions", () => ({
  useCreateInteraction: () => ({
    mutateAsync: mockMutateAsync,
  }),
}));

import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";

const ORG_ID = "00000000-0000-4000-8000-000000000001";
const USER_ID = "00000000-0000-4000-8000-000000000002";
const PERSON_ID = "00000000-0000-4000-8000-000000000003";
const DEAL_ID = "00000000-0000-4000-8000-000000000004";
const UPDATED_DEAL_ID = "00000000-0000-4000-8000-000000000005";

describe("InteractionFormDialog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockMutateAsync.mockResolvedValue({ id: "interaction-1" });
  });

  it("prefills deal id when deal context is provided", () => {
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

    expect(screen.getByLabelText("Deal ID (optional)")).toHaveValue(DEAL_ID);
  });

  it("submits deal id from deal context", async () => {
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

    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Created from deal drawer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          organization_id: ORG_ID,
          person_id: PERSON_ID,
          deal_id: DEAL_ID,
          summary: "Created from deal drawer",
          created_by: USER_ID,
        }),
      );
    });
  });

  it("keeps deal field editable and submits updated deal id", async () => {
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

    fireEvent.change(screen.getByLabelText("Deal ID (optional)"), {
      target: { value: UPDATED_DEAL_ID },
    });
    fireEvent.change(screen.getByLabelText("Summary"), {
      target: { value: "Updated linked deal" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save interaction" }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          deal_id: UPDATED_DEAL_ID,
          summary: "Updated linked deal",
        }),
      );
    });
  });
});
