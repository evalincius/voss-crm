import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { GripVertical, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { DEAL_STAGE_LABELS, DEAL_STAGE_VALUES } from "@/lib/constants";
import type { DealCardData, DealStage } from "@/features/deals/types";

interface DealCardProps {
  deal: DealCardData;
  onSelect: (dealId: string) => void;
  onStageChange: (dealId: string, stage: DealStage) => void;
}

interface DealCardMetaProps {
  deal: DealCardData;
}

function DealCardMeta({ deal }: DealCardMetaProps) {
  return (
    <>
      <Badge variant="secondary" className="text-xs">
        {deal.product_name}
      </Badge>

      <div className="flex items-center justify-between text-xs">
        {deal.value != null ? (
          <span className="text-text-primary font-medium tabular-nums">
            {deal.currency ?? ""} {Number(deal.value).toLocaleString()}
          </span>
        ) : (
          <span />
        )}

        {deal.next_step_at ? (
          <span className="text-text-secondary">
            Next: {formatDistanceToNow(new Date(deal.next_step_at), { addSuffix: true })}
          </span>
        ) : null}
      </div>

      <p className="text-text-secondary text-xs tabular-nums">
        {formatDistanceToNow(new Date(deal.updated_at), { addSuffix: true })}
      </p>
    </>
  );
}

export function DealCard({ deal, onSelect, onStageChange }: DealCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    data: { deal },
  });

  const style =
    isDragging || !transform ? undefined : { transform: CSS.Transform.toString(transform) };

  const otherStages = DEAL_STAGE_VALUES.filter((s) => s !== deal.stage);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-surface bg-bg-surface cursor-pointer space-y-2 rounded-md border p-3 transition-shadow ${
        isDragging ? "opacity-0" : ""
      }`}
      onClick={() => onSelect(deal.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(deal.id);
        }
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            className="text-text-secondary hover:text-text-primary shrink-0 cursor-grab touch-none"
            {...listeners}
            {...attributes}
            onClick={(e) => e.stopPropagation()}
            aria-label="Drag to move deal"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <span className="text-text-primary truncate text-sm font-medium">{deal.person_name}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
              <span className="sr-only">Move to stage</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {otherStages.map((stage) => (
              <DropdownMenuItem key={stage} onClick={() => onStageChange(deal.id, stage)}>
                Move to {DEAL_STAGE_LABELS[stage]}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <DealCardMeta deal={deal} />
    </div>
  );
}

interface DealCardPreviewProps {
  deal: DealCardData;
}

export function DealCardPreview({ deal }: DealCardPreviewProps) {
  return (
    <div className="card-surface bg-bg-surface shadow-soft-sm pointer-events-none space-y-2 rounded-md border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="text-text-secondary shrink-0" aria-hidden>
            <GripVertical className="h-4 w-4" />
          </span>
          <span className="text-text-primary truncate text-sm font-medium">{deal.person_name}</span>
        </div>
        <span className="h-6 w-6 shrink-0" aria-hidden />
      </div>

      <DealCardMeta deal={deal} />
    </div>
  );
}
