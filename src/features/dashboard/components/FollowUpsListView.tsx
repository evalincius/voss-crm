import { useEffect, useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowLeft, CalendarClock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useFollowUpsDue } from "@/features/dashboard/hooks/useDashboard";
import { DealDrawer } from "@/features/deals/components/DealDrawer";
import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";
import type { DealStage } from "@/features/deals/types";
import type { FollowUpsStatus } from "@/features/dashboard/types";

const FOLLOW_UPS_HORIZON_DAYS = 7;
const FOLLOW_UPS_PAGE_SIZE = 25;

const statusOptions: Array<{ value: FollowUpsStatus; label: string }> = [
  { value: "all", label: "All due" },
  { value: "overdue", label: "Overdue" },
  { value: "today", label: "Today" },
  { value: "upcoming", label: "Next 7 days" },
  { value: "custom", label: "Custom" },
];

function parseStatus(value: string | null): FollowUpsStatus {
  return statusOptions.some((option) => option.value === value)
    ? (value as FollowUpsStatus)
    : "all";
}

function parsePage(value: string | null): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

interface FollowUpsListViewProps {
  organizationId: string;
  userId: string;
}

export function FollowUpsListView({ organizationId, userId }: FollowUpsListViewProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [interactionTarget, setInteractionTarget] = useState<{
    dealId: string | null;
    personId: string;
  } | null>(null);

  const status = parseStatus(searchParams.get("status"));
  const page = parsePage(searchParams.get("page"));
  const customStart = searchParams.get("start");
  const customEnd = searchParams.get("end");

  const query = useFollowUpsDue(organizationId, {
    horizonDays: FOLLOW_UPS_HORIZON_DAYS,
    status,
    page,
    pageSize: FOLLOW_UPS_PAGE_SIZE,
    customStart: status === "custom" ? customStart : null,
    customEnd: status === "custom" ? customEnd : null,
  });

  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / FOLLOW_UPS_PAGE_SIZE));

  useEffect(() => {
    if (!query.data || page <= totalPages) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    if (totalPages <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(totalPages));
    }
    setSearchParams(next, { replace: true });
  }, [page, query.data, searchParams, setSearchParams, totalPages]);

  function updateSearch(updates: {
    status?: FollowUpsStatus;
    page?: number;
    start?: string | null;
    end?: string | null;
  }) {
    const next = new URLSearchParams(searchParams);

    if (updates.status) {
      next.set("status", updates.status);
      if (updates.status !== "custom") {
        next.delete("start");
        next.delete("end");
      }
    }

    if (updates.start !== undefined) {
      if (!updates.start) {
        next.delete("start");
      } else {
        next.set("start", updates.start);
      }
    }

    if (updates.end !== undefined) {
      if (!updates.end) {
        next.delete("end");
      } else {
        next.set("end", updates.end);
      }
    }

    if (updates.page !== undefined) {
      if (updates.page <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(updates.page));
      }
    }

    setSearchParams(next, { replace: true });
  }

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-text-primary text-2xl font-bold">Follow-ups</h2>
          <p className="text-text-secondary text-base">
            Prioritized follow-ups due from deals and interactions.
          </p>
        </div>

        {query.data ? (
          <Badge variant="outline" className="text-sm tabular-nums">
            {query.data.total}
          </Badge>
        ) : null}
      </div>

      <div className="card-surface bg-bg-surface space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={status === option.value ? "default" : "secondary"}
              onClick={() => updateSearch({ status: option.value, page: 1 })}
              className={cn(status === option.value ? "" : "text-text-secondary")}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {status === "custom" ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="followups-custom-start" className="text-text-secondary text-sm">
                Start date
              </label>
              <Input
                id="followups-custom-start"
                type="date"
                value={customStart ?? ""}
                onChange={(event) =>
                  updateSearch({ start: event.currentTarget.value || null, page: 1 })
                }
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="followups-custom-end" className="text-text-secondary text-sm">
                End date
              </label>
              <Input
                id="followups-custom-end"
                type="date"
                value={customEnd ?? ""}
                onChange={(event) =>
                  updateSearch({ end: event.currentTarget.value || null, page: 1 })
                }
              />
            </div>
          </div>
        ) : null}

        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-md" />
            ))}
          </div>
        ) : null}

        {query.isError ? (
          <p className="text-destructive text-base">
            {query.error instanceof Error ? query.error.message : "Failed to load follow-ups"}
          </p>
        ) : null}

        {query.data && query.data.total === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <CalendarClock className="text-text-muted mb-2 h-8 w-8" />
            <p className="text-text-secondary text-base">No follow-ups in this range.</p>
          </div>
        ) : null}

        {query.data && query.data.items.length > 0 ? (
          <>
            <div className="border-border-fintech overflow-x-auto rounded-md border">
              <table className="w-full min-w-[760px]">
                <thead className="bg-bg-surface-hover/60">
                  <tr className="text-left">
                    <th className="text-text-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                      Name
                    </th>
                    <th className="text-text-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                      Source
                    </th>
                    <th className="text-text-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                      Context
                    </th>
                    <th className="text-text-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                      Due
                    </th>
                    <th className="text-text-secondary px-3 py-2 text-xs font-semibold tracking-wide uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-border-fintech divide-y">
                  {query.data.items.map((item) => (
                    <tr key={`${item.source}-${item.id}`}>
                      <td className="px-3 py-2.5 align-top">
                        <Link
                          to={`${ROUTES.PEOPLE}/${item.person_id}`}
                          className="text-primary block truncate text-sm font-medium hover:underline"
                        >
                          {item.person_name}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <Badge variant="outline" className="text-xs capitalize">
                          {item.source}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        {item.source === "deal" ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {item.deal_product_name ? (
                              <Badge variant="secondary" className="text-xs">
                                {item.deal_product_name}
                              </Badge>
                            ) : null}
                            {item.deal_stage ? (
                              <Badge variant="outline" className="text-xs">
                                {DEAL_STAGE_LABELS[item.deal_stage as DealStage] ?? item.deal_stage}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            {item.interaction_type ? (
                              <Badge variant="outline" className="text-xs capitalize">
                                {item.interaction_type}
                              </Badge>
                            ) : null}
                            {item.interaction_summary ? (
                              <p className="text-text-muted max-w-[320px] truncate text-xs">
                                {item.interaction_summary}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="text-text-secondary text-xs tabular-nums">
                          <p>
                            {formatDistanceToNow(new Date(item.next_step_at), { addSuffix: true })}
                          </p>
                          <p>{format(new Date(item.next_step_at), "MMM d, yyyy HH:mm")}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          {item.deal_id ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedDealId(item.deal_id)}
                            >
                              Open deal
                            </Button>
                          ) : null}
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() =>
                              setInteractionTarget({
                                dealId: item.deal_id,
                                personId: item.person_id,
                              })
                            }
                          >
                            Log interaction
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-text-secondary text-sm tabular-nums">
                Page {page} of {totalPages} ({total} total)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => updateSearch({ page: Math.max(1, page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => updateSearch({ page: Math.min(totalPages, page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <DealDrawer
        open={selectedDealId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDealId(null);
          }
        }}
        organizationId={organizationId}
        dealId={selectedDealId}
        onAddInteraction={(dealId, personId) => {
          setInteractionTarget({ dealId, personId });
        }}
      />

      {interactionTarget ? (
        <InteractionFormDialog
          open
          onOpenChange={(open) => {
            if (!open) {
              setInteractionTarget(null);
            }
          }}
          organizationId={organizationId}
          userId={userId}
          personId={interactionTarget.personId}
          dealId={interactionTarget.dealId}
        />
      ) : null}
    </section>
  );
}
