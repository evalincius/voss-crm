import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DropAnimation,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { DEAL_STAGE_VALUES } from "@/lib/constants";
import { DealColumn } from "./DealColumn";
import { DealCardPreview } from "./DealCard";
import type { DealCardData, DealStage } from "@/features/deals/types";

interface DealsBoardProps {
  deals: DealCardData[];
  onSelectDeal: (dealId: string) => void;
  onStageChange: (dealId: string, stage: DealStage) => Promise<void> | void;
}

const dropAnimation: DropAnimation = {
  duration: 200,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
};
const SELECT_SUPPRESSION_MS = 300;

export function DealsBoard({ deals, onSelectDeal, onStageChange }: DealsBoardProps) {
  const [activeDeal, setActiveDeal] = useState<DealCardData | null>(null);
  const [pendingStages, setPendingStages] = useState<Record<string, DealStage>>({});
  const suppressedSelectRef = useRef<{ dealId: string; expiresAt: number } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const displayDeals = useMemo(
    () =>
      deals.map((deal) => {
        const pendingStage = pendingStages[deal.id];
        return pendingStage ? { ...deal, stage: pendingStage } : deal;
      }),
    [deals, pendingStages],
  );

  const dealsByStage = useMemo(
    () =>
      Object.fromEntries(
        DEAL_STAGE_VALUES.map((stage) => [
          stage,
          displayDeals.filter((deal) => deal.stage === stage),
        ]),
      ) as Record<DealStage, DealCardData[]>,
    [displayDeals],
  );

  useEffect(() => {
    setPendingStages((current) => {
      if (Object.keys(current).length === 0) {
        return current;
      }

      const remaining: Record<string, DealStage> = {};
      let changed = false;

      for (const [dealId, pendingStage] of Object.entries(current)) {
        const currentDeal = deals.find((deal) => deal.id === dealId);

        if (!currentDeal || currentDeal.stage === pendingStage) {
          changed = true;
          continue;
        }

        remaining[dealId] = pendingStage;
      }

      return changed ? remaining : current;
    });
  }, [deals]);

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

    suppressedSelectRef.current = {
      dealId,
      expiresAt: Date.now() + SELECT_SUPPRESSION_MS,
    };

    const currentDeal = displayDeals.find((d) => d.id === dealId);
    if (currentDeal && currentDeal.stage !== targetStage) {
      setPendingStages((current) => ({ ...current, [dealId]: targetStage }));

      let result: Promise<void> | void;
      try {
        result = onStageChange(dealId, targetStage);
      } catch {
        setPendingStages((current) => {
          if (!(dealId in current)) {
            return current;
          }

          const next = { ...current };
          delete next[dealId];
          return next;
        });
        return;
      }

      void Promise.resolve(result)
        .catch(() => undefined)
        .finally(() => {
          setPendingStages((current) => {
            if (!(dealId in current)) {
              return current;
            }

            const next = { ...current };
            delete next[dealId];
            return next;
          });
        });
    }
  }

  function handleDragCancel(_: DragCancelEvent) {
    setActiveDeal(null);
  }

  function handleSelectDeal(dealId: string) {
    const suppressedSelect = suppressedSelectRef.current;
    if (
      suppressedSelect &&
      suppressedSelect.dealId === dealId &&
      Date.now() < suppressedSelect.expiresAt
    ) {
      return;
    }

    if (suppressedSelect && Date.now() >= suppressedSelect.expiresAt) {
      suppressedSelectRef.current = null;
    }

    onSelectDeal(dealId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
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
            onSelectDeal={handleSelectDeal}
            onStageChange={onStageChange}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={dropAnimation}>
        {activeDeal ? (
          <div className="w-60 rotate-1 opacity-95">
            <DealCardPreview deal={activeDeal} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
