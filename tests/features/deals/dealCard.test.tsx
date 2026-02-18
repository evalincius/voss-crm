import type { HTMLAttributes, ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUseDraggable } = vi.hoisted(() => ({
  mockUseDraggable: vi.fn(),
}));

vi.mock("@dnd-kit/core", () => ({
  useDraggable: mockUseDraggable,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({
    children,
    ...props
  }: { children: ReactNode } & HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { DealCard, DealCardPreview } from "@/features/deals/components/DealCard";
import type { DealCardData } from "@/features/deals/types";

function createDeal(overrides: Partial<DealCardData> = {}): DealCardData {
  return {
    id: "deal-1",
    organization_id: "org-1",
    person_id: "person-1",
    product_id: "product-1",
    campaign_id: null,
    stage: "prospect",
    value: 1200,
    currency: "EUR",
    next_step_at: null,
    notes: null,
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-02T10:00:00Z",
    person_name: "Alice Example",
    product_name: "Starter Plan",
    ...overrides,
  };
}

describe("DealCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });
  });

  it("hides the source card movement while dragging to avoid duplicate moving visuals", () => {
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: {},
      setNodeRef: vi.fn(),
      transform: { x: 24, y: 12, scaleX: 1, scaleY: 1 },
      transition: "transform 200ms ease",
      isDragging: true,
    });

    const { container } = render(
      <DealCard deal={createDeal()} onSelect={vi.fn()} onStageChange={vi.fn()} />,
    );

    const card = container.firstElementChild as HTMLElement;
    expect(card.style.transform).toBe("");
    expect(card.className).toContain("opacity-0");
  });

  it("activates dragging from card body pointer down", () => {
    const onPointerDown = vi.fn();
    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: { onPointerDown },
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    const { container } = render(
      <DealCard deal={createDeal()} onSelect={vi.fn()} onStageChange={vi.fn()} />,
    );

    const card = container.firstElementChild as HTMLElement;
    fireEvent.pointerDown(card);

    expect(onPointerDown).toHaveBeenCalledTimes(1);
  });

  it("opens details when clicking card content", () => {
    const onSelect = vi.fn();

    render(<DealCard deal={createDeal()} onSelect={onSelect} onStageChange={vi.fn()} />);

    fireEvent.click(screen.getByText("Alice Example"));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("deal-1");
  });

  it("does not trigger drag or selection when interacting with overflow trigger", () => {
    const onPointerDown = vi.fn();
    const onSelect = vi.fn();

    mockUseDraggable.mockReturnValue({
      attributes: {},
      listeners: { onPointerDown },
      setNodeRef: vi.fn(),
      transform: null,
      transition: null,
      isDragging: false,
    });

    render(<DealCard deal={createDeal()} onSelect={onSelect} onStageChange={vi.fn()} />);

    const overflowTrigger = screen.getByRole("button", { name: "Move to stage" });
    fireEvent.pointerDown(overflowTrigger);
    fireEvent.click(overflowTrigger);

    expect(onPointerDown).not.toHaveBeenCalled();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("keeps stage menu as non-drag path for moving deals", () => {
    const onStageChange = vi.fn();

    render(<DealCard deal={createDeal()} onSelect={vi.fn()} onStageChange={onStageChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Move to Interested" }));

    expect(onStageChange).toHaveBeenCalledTimes(1);
    expect(onStageChange).toHaveBeenCalledWith("deal-1", "interested");
  });

  it("renders a non-interactive preview shell for drag overlay", () => {
    render(<DealCardPreview deal={createDeal({ person_name: "Overlay Person" })} />);

    expect(screen.getByText("Overlay Person")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drag to move deal" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Move to stage" })).not.toBeInTheDocument();
  });
});
