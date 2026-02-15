import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { DEAL_STAGE_VALUES } from "@/lib/constants";
import { DealColumn } from "./DealColumn";
import { DealCard } from "./DealCard";
import type { DealCardData, DealStage } from "@/features/deals/types";

interface DealsBoardProps {
  deals: DealCardData[];
  onSelectDeal: (dealId: string) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

export function DealsBoard({ deals, onSelectDeal, onStageChange }: DealsBoardProps) {
  const [activeDeal, setActiveDeal] = useState<DealCardData | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const dealsByStage = Object.fromEntries(
    DEAL_STAGE_VALUES.map((stage) => [stage, deals.filter((d) => d.stage === stage)]),
  ) as Record<DealStage, DealCardData[]>;

  function handleDragStart(event: DragStartEvent) {
    const deal = (event.active.data.current as { deal?: DealCardData })?.deal;
    if (deal) {
      setActiveDeal(deal);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDeal(null);

    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const targetStage = over.id as DealStage;

    if (!DEAL_STAGE_VALUES.includes(targetStage)) return;

    const currentDeal = deals.find((d) => d.id === dealId);
    if (currentDeal && currentDeal.stage !== targetStage) {
      onStageChange(dealId, targetStage);
    }
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ minHeight: "calc(100vh - 220px)" }}
        role="region"
        aria-label="Deals pipeline board"
      >
        {DEAL_STAGE_VALUES.map((stage) => (
          <DealColumn
            key={stage}
            stage={stage}
            deals={dealsByStage[stage]}
            onSelectDeal={onSelectDeal}
            onStageChange={onStageChange}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal ? (
          <div className="w-60 rotate-2 opacity-90">
            <DealCard deal={activeDeal} onSelect={() => {}} onStageChange={() => {}} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
