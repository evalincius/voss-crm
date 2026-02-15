import { Link } from "react-router";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { useStaleDeals } from "@/features/dashboard/hooks/useDashboard";
import type { DealStage } from "@/features/deals/types";

interface StaleDealsWidgetProps {
  organizationId: string;
  threshold: number;
  onThresholdChange: (value: number) => void;
  onSelectDeal: (dealId: string) => void;
}

export function StaleDealsWidget({
  organizationId,
  threshold,
  onThresholdChange,
  onSelectDeal,
}: StaleDealsWidgetProps) {
  const query = useStaleDeals(organizationId, threshold);
  const count = query.data?.length ?? 0;

  return (
    <div className="card-surface bg-bg-surface h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <h3 className="font-heading text-text-primary text-base font-semibold">Stale Deals</h3>
          {query.data ? (
            <Badge variant="outline" className="text-xs tabular-nums">
              {count}
            </Badge>
          ) : null}
        </div>
        <Select
          value={String(threshold)}
          onValueChange={(value) => onThresholdChange(Number(value))}
        >
          <SelectTrigger
            className="bg-bg-app border-border-fintech h-7 w-[90px] text-xs"
            aria-label="Stale days threshold"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="21">21 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-md" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <p className="text-destructive text-sm">
          {query.error instanceof Error ? query.error.message : "Failed to load stale deals"}
        </p>
      ) : null}

      {query.data && count === 0 ? (
        <div className="flex flex-col items-center justify-center py-6">
          <AlertTriangle className="text-text-muted mb-2 h-8 w-8" />
          <p className="text-text-secondary text-sm">No stale deals</p>
          <p className="text-text-muted text-xs">All deals are active.</p>
        </div>
      ) : null}

      {query.data && count > 0 ? (
        <div className="divide-border-fintech divide-y">
          {query.data.map((deal) => (
            <button
              key={deal.id}
              type="button"
              onClick={() => onSelectDeal(deal.id)}
              className="hover:bg-bg-surface-hover flex w-full items-center gap-3 rounded-sm py-2.5 text-left transition-colors first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <Link
                  to={`${ROUTES.PEOPLE}/${deal.person_id}`}
                  className="text-primary truncate text-sm font-medium hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {deal.person_name}
                </Link>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="text-text-secondary text-xs">{deal.product_name}</span>
                  <Badge variant="outline" className="text-xs">
                    {DEAL_STAGE_LABELS[deal.stage as DealStage] ?? deal.stage}
                  </Badge>
                </div>
              </div>
              <span className="text-xs font-medium text-amber-500 tabular-nums">
                {deal.days_stale}d
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
