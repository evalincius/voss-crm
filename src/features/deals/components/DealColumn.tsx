import { useDroppable } from "@dnd-kit/core";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { DEAL_STAGE_LABELS } from "@/lib/constants";
import { DealCard } from "./DealCard";
import type { DealCardData, DealStage } from "@/features/deals/types";

interface DealColumnProps {
  stage: DealStage;
  deals: DealCardData[];
  onSelectDeal: (dealId: string) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

export function DealColumn({ stage, deals, onSelectDeal, onStageChange }: DealColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <div
      ref={setNodeRef}
      className={`flex w-64 shrink-0 flex-col rounded-lg border p-2 ${
        isOver ? "border-primary/50 bg-primary/5" : "border-border bg-bg-app"
      }`}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-text-primary text-sm font-semibold">{DEAL_STAGE_LABELS[stage]}</h3>
        <Badge variant="outline" className="text-xs tabular-nums">
          {deals.length}
        </Badge>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 px-0.5 pb-1">
          {deals.length === 0 ? (
            <p className="text-text-secondary py-6 text-center text-xs">No deals</p>
          ) : (
            deals.map((deal) => (
              <DealCard
                key={deal.id}
                deal={deal}
                onSelect={onSelectDeal}
                onStageChange={onStageChange}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
