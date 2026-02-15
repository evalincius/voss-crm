import { Link } from "react-router";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { usePipelineSnapshot } from "@/features/dashboard/hooks/useDashboard";
import type { DealStage } from "@/features/deals/types";

interface PipelineSnapshotWidgetProps {
  organizationId: string;
}

export function PipelineSnapshotWidget({ organizationId }: PipelineSnapshotWidgetProps) {
  const query = usePipelineSnapshot(organizationId);
  const totalDeals = query.data?.reduce((sum, s) => sum + s.count, 0) ?? 0;

  return (
    <div className="card-surface bg-bg-surface h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-emerald-500" />
          <h3 className="font-heading text-text-primary text-base font-semibold">Pipeline</h3>
          {query.data ? (
            <Badge variant="outline" className="text-xs tabular-nums">
              {totalDeals}
            </Badge>
          ) : null}
        </div>
        <Link to={ROUTES.DEALS} className="text-primary text-xs hover:underline">
          View board
        </Link>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded-md" />
          ))}
        </div>
      ) : null}

      {query.isError ? (
        <p className="text-destructive text-sm">
          {query.error instanceof Error ? query.error.message : "Failed to load pipeline"}
        </p>
      ) : null}

      {query.data ? (
        <>
          <div className="text-text-muted mb-2 flex items-center justify-between text-[11px]">
            <span>Stage</span>
            <span>Deals / Value</span>
          </div>
          <div className="divide-border-fintech divide-y">
            {query.data.map((stage) => (
              <div
                key={stage.stage}
                className="flex items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
              >
                <span className="text-text-primary text-sm">
                  {DEAL_STAGE_LABELS[stage.stage as DealStage] ?? stage.stage}
                </span>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs tabular-nums">
                    {stage.count} {stage.count === 1 ? "deal" : "deals"}
                  </Badge>
                  {stage.total_value > 0 ? (
                    <span className="text-text-muted text-xs tabular-nums">
                      ${stage.total_value.toLocaleString()}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
