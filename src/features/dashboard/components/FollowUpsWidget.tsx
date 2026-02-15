import { Link } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { useFollowUpsDue } from "@/features/dashboard/hooks/useDashboard";
import type { DealStage } from "@/features/deals/types";

interface FollowUpsWidgetProps {
  organizationId: string;
  onSelectDeal: (dealId: string) => void;
}

export function FollowUpsWidget({ organizationId, onSelectDeal }: FollowUpsWidgetProps) {
  const query = useFollowUpsDue(organizationId);
  const count = query.data?.length ?? 0;

  return (
    <div className="card-surface bg-bg-surface h-full p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="text-primary h-4 w-4" />
          <h3 className="font-heading text-text-primary text-base font-semibold">Follow-ups Due</h3>
          {query.data ? (
            <Badge variant="outline" className="text-xs tabular-nums">
              {count}
            </Badge>
          ) : null}
        </div>
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
          {query.error instanceof Error ? query.error.message : "Failed to load follow-ups"}
        </p>
      ) : null}

      {query.data && count === 0 ? (
        <div className="flex flex-col items-center justify-center py-6">
          <CalendarClock className="text-text-muted mb-2 h-8 w-8" />
          <p className="text-text-secondary text-sm">No upcoming follow-ups</p>
          <p className="text-text-muted text-xs">You're all caught up.</p>
        </div>
      ) : null}

      {query.data && count > 0 ? (
        <div className="divide-border-fintech divide-y">
          {query.data.slice(0, 8).map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    to={`${ROUTES.PEOPLE}/${item.person_id}`}
                    className="text-primary truncate text-sm font-medium hover:underline"
                  >
                    {item.person_name}
                  </Link>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.source === "deal" && item.deal_product_name ? (
                      <Badge variant="secondary" className="text-xs">
                        {item.deal_product_name}
                      </Badge>
                    ) : null}
                    {item.source === "deal" && item.deal_stage ? (
                      <Badge variant="outline" className="text-xs">
                        {DEAL_STAGE_LABELS[item.deal_stage as DealStage] ?? item.deal_stage}
                      </Badge>
                    ) : null}
                    {item.source === "interaction" && item.interaction_type ? (
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.interaction_type}
                      </Badge>
                    ) : null}
                  </div>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  {item.source === "interaction" && item.interaction_summary ? (
                    <span className="text-text-muted truncate text-xs">
                      {item.interaction_summary}
                    </span>
                  ) : null}
                  {item.source === "deal" && item.deal_id ? (
                    <button
                      type="button"
                      onClick={() => onSelectDeal(item.deal_id!)}
                      className="text-primary text-xs hover:underline"
                      aria-label={`View deal for ${item.person_name}`}
                    >
                      View deal
                    </button>
                  ) : null}
                </div>
              </div>
              <span className="text-text-muted shrink-0 text-xs tabular-nums">
                {formatDistanceToNow(new Date(item.next_step_at), { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
