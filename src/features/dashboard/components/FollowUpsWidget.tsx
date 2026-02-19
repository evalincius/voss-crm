import { Link } from "react-router";
import { format, formatDistanceToNow } from "date-fns";
import { BriefcaseBusiness, CalendarClock, MessageSquareText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { useFollowUpsDue } from "@/features/dashboard/hooks/useDashboard";
import type { DealStage } from "@/features/deals/types";

const PREVIEW_PAGE_SIZE = 5;

interface FollowUpsWidgetProps {
  organizationId: string;
  onSelectDeal: (dealId: string) => void;
}

export function FollowUpsWidget({ organizationId, onSelectDeal }: FollowUpsWidgetProps) {
  const query = useFollowUpsDue(organizationId, {
    horizonDays: 7,
    status: "all",
    page: 1,
    pageSize: PREVIEW_PAGE_SIZE,
    customStart: null,
    customEnd: null,
  });
  const count = query.data?.total ?? 0;
  const previewItems = query.data?.items.slice(0, PREVIEW_PAGE_SIZE) ?? [];

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
          {previewItems.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className="hover:bg-bg-surface-hover/70 grid grid-cols-[2rem_minmax(0,1fr)_auto] items-stretch gap-2.5 rounded-md py-2 transition-colors first:pt-0 last:pb-0"
            >
              <div className="flex w-8 items-center justify-center self-stretch">
                {item.source === "deal" ? (
                  <BriefcaseBusiness className="text-primary h-4 w-4" aria-hidden />
                ) : (
                  <MessageSquareText className="text-text-secondary h-4 w-4" aria-hidden />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Link
                    to={`${ROUTES.PEOPLE}/${item.person_id}`}
                    className="text-primary truncate text-sm font-medium hover:underline"
                  >
                    {item.person_name}
                  </Link>
                  <Badge variant="outline" className="shrink-0 text-[11px]">
                    {item.source === "deal" ? "Deal" : "Interaction"}
                  </Badge>
                </div>

                <div className="mt-0.5 flex flex-wrap items-center gap-1">
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

                {item.source === "interaction" && item.interaction_summary ? (
                  <p className="text-text-muted mt-0.5 truncate text-xs">
                    {item.interaction_summary}
                  </p>
                ) : null}
              </div>

              <div className="flex shrink-0 flex-col items-end text-right">
                <p className="text-text-secondary text-xs tabular-nums">
                  {formatDistanceToNow(new Date(item.next_step_at), { addSuffix: true })}
                </p>
                <p className="text-text-muted text-[11px] tabular-nums">
                  {format(new Date(item.next_step_at), "MMM d, HH:mm")}
                </p>
                {item.deal_id ? (
                  <button
                    type="button"
                    onClick={() => onSelectDeal(item.deal_id)}
                    className="text-primary hover:bg-bg-surface-hover focus-visible:outline-ring mt-1 inline-flex h-8 items-center rounded-md px-2 text-xs font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
                    aria-label={
                      item.source === "deal"
                        ? `View deal for ${item.person_name}`
                        : `View linked deal for ${item.person_name}`
                    }
                  >
                    View deal
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {query.data && count > PREVIEW_PAGE_SIZE ? (
        <div className="border-border-fintech mt-3 pt-3">
          <Link to={ROUTES.FOLLOW_UPS} className="text-primary text-sm font-medium hover:underline">
            View all follow-ups
          </Link>
        </div>
      ) : null}
    </div>
  );
}
