import { act, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const dndState = vi.hoisted(() => ({
  contextProps: {} as {
    onDragStart?: (event: unknown) => void;
    onDragEnd?: (event: unknown) => void;
    onDragCancel?: (event: unknown) => void;
  },
}));

vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children, ...props }: { children: React.ReactNode }) => {
    dndState.contextProps = props;
    return <div data-testid="dnd-context">{children}</div>;
  },
  DragOverlay: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="drag-overlay">{children}</div>
  ),
  PointerSensor: class PointerSensor {},
  KeyboardSensor: class KeyboardSensor {},
  useSensor: vi.fn(() => ({})),
  useSensors: vi.fn((...sensors: unknown[]) => sensors),
  useDroppable: vi.fn(() => ({ setNodeRef: vi.fn(), isOver: false })),
  useDraggable: vi.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    transition: null,
    isDragging: false,
  })),
}));

import { DealsBoard } from "@/features/deals/components/DealsBoard";
import type { DealCardData } from "@/features/deals/types";

function createDeal(overrides: Partial<DealCardData> = {}): DealCardData {
  return {
    id: "deal-1",
    organization_id: "org-1",
    person_id: "person-1",
    product_id: "product-1",
    campaign_id: null,
    stage: "prospect",
    value: 1000,
    currency: "EUR",
    next_step_at: null,
    notes: null,
    created_at: "2026-02-01T09:00:00Z",
    updated_at: "2026-02-02T09:00:00Z",
    person_name: "Alice",
    product_name: "Starter",
    ...overrides,
  };
}

describe("DealsBoard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dndState.contextProps = {};
  });

  it("calls onStageChange exactly once when dropped on a valid stage", async () => {
    const deal = createDeal();
    const onStageChange = vi.fn(() => Promise.resolve());

    render(<DealsBoard deals={[deal]} onSelectDeal={vi.fn()} onStageChange={onStageChange} />);

    await act(async () => {
      dndState.contextProps.onDragEnd?.({
        active: { id: deal.id },
        over: { id: "interested" },
      });
      await Promise.resolve();
    });

    expect(onStageChange).toHaveBeenCalledTimes(1);
    expect(onStageChange).toHaveBeenCalledWith(deal.id, "interested");
  });

  it("projects card into target lane immediately while stage mutation is pending", async () => {
    const deal = createDeal({ person_name: "Pending Move" });
    let resolveStageUpdate: (() => void) | undefined;
    const onStageChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveStageUpdate = resolve;
        }),
    );

    render(<DealsBoard deals={[deal]} onSelectDeal={vi.fn()} onStageChange={onStageChange} />);

    act(() => {
      dndState.contextProps.onDragEnd?.({
        active: { id: deal.id },
        over: { id: "interested" },
      });
    });

    const prospectLane = screen.getByRole("group", { name: /Prospect stage/i });
    const interestedLane = screen.getByRole("group", { name: /Interested stage/i });

    expect(within(prospectLane).queryByText("Pending Move")).not.toBeInTheDocument();
    expect(within(interestedLane).getByText("Pending Move")).toBeInTheDocument();

    if (!resolveStageUpdate) {
      throw new Error("Expected pending stage resolver to be initialized");
    }

    await act(async () => {
      resolveStageUpdate?.();
      await Promise.resolve();
    });
  });

  it("reverts pending projection when stage mutation fails", async () => {
    const deal = createDeal({ person_name: "Rollback Move" });
    let rejectStageUpdate: ((error: Error) => void) | undefined;
    const onStageChange = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectStageUpdate = reject;
        }),
    );

    render(<DealsBoard deals={[deal]} onSelectDeal={vi.fn()} onStageChange={onStageChange} />);

    act(() => {
      dndState.contextProps.onDragEnd?.({
        active: { id: deal.id },
        over: { id: "interested" },
      });
    });

    const prospectLane = screen.getByRole("group", { name: /Prospect stage/i });
    const interestedLane = screen.getByRole("group", { name: /Interested stage/i });

    expect(within(prospectLane).queryByText("Rollback Move")).not.toBeInTheDocument();
    expect(within(interestedLane).getByText("Rollback Move")).toBeInTheDocument();

    if (!rejectStageUpdate) {
      throw new Error("Expected pending stage rejecter to be initialized");
    }

    act(() => {
      rejectStageUpdate?.(new Error("stage update failed"));
    });

    await waitFor(() => {
      expect(within(prospectLane).getByText("Rollback Move")).toBeInTheDocument();
      expect(within(interestedLane).queryByText("Rollback Move")).not.toBeInTheDocument();
    });
  });

  it("clears active overlay card on drag cancel", () => {
    const dragDeal = createDeal({ id: "deal-overlay", person_name: "Cancel Target" });

    render(<DealsBoard deals={[]} onSelectDeal={vi.fn()} onStageChange={vi.fn()} />);

    act(() => {
      dndState.contextProps.onDragStart?.({
        active: { data: { current: { deal: dragDeal } } },
      });
    });

    const overlay = screen.getByTestId("drag-overlay");
    expect(within(overlay).getByText("Cancel Target")).toBeInTheDocument();

    act(() => {
      dndState.contextProps.onDragCancel?.({});
    });

    expect(within(overlay).queryByText("Cancel Target")).not.toBeInTheDocument();
  });
});
