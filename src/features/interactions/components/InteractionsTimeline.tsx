import { useEffect, useMemo, useState } from "react";
import {
  CircleDot,
  Mail,
  MessageCircle,
  NotebookPen,
  PhoneCall,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  useDeleteInteraction,
  usePersonInteractions,
} from "@/features/interactions/hooks/useInteractions";
import type { InteractionOrderBy, InteractionType } from "@/features/interactions/types";

interface InteractionsTimelineProps {
  organizationId: string;
  personId: string;
}

const INTERACTIONS_PAGE_SIZE = 5;

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleString();
}

function formatRelativeTime(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  const secondsDiff = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(secondsDiff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (absSeconds < 60) {
    return rtf.format(secondsDiff, "second");
  }

  const minutesDiff = Math.round(secondsDiff / 60);
  if (Math.abs(minutesDiff) < 60) {
    return rtf.format(minutesDiff, "minute");
  }

  const hoursDiff = Math.round(minutesDiff / 60);
  if (Math.abs(hoursDiff) < 24) {
    return rtf.format(hoursDiff, "hour");
  }

  const daysDiff = Math.round(hoursDiff / 24);
  return rtf.format(daysDiff, "day");
}

function formatInteractionTypeLabel(type: InteractionType) {
  if (type === "form_submission") {
    return "Form Submission";
  }

  return type
    .split("_")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function getInteractionTypeIcon(type: InteractionType) {
  if (type === "email") return Mail;
  if (type === "call") return PhoneCall;
  if (type === "dm") return MessageCircle;
  if (type === "meeting") return Users;
  if (type === "note") return NotebookPen;
  if (type === "form_submission") return CircleDot;
  return CircleDot;
}

function getNextStepStatus(nextStepAt: string | null) {
  if (!nextStepAt) {
    return null;
  }

  const next = new Date(nextStepAt).getTime();
  if (Number.isNaN(next)) {
    return null;
  }

  const diffMs = next - Date.now();
  if (diffMs < 0) {
    return { label: "Overdue", className: "text-red-400" };
  }

  if (diffMs <= 24 * 60 * 60 * 1000) {
    return { label: "Due soon", className: "text-yellow-400" };
  }

  return { label: "Scheduled", className: "text-green-400" };
}

function formatDealReference(dealId: string | null, dealProductName: string | null) {
  if (!dealId) {
    return null;
  }

  if (dealProductName) {
    return dealProductName;
  }

  return `#${dealId.slice(0, 8)}`;
}

export function InteractionsTimeline({ organizationId, personId }: InteractionsTimelineProps) {
  const [orderBy, setOrderBy] = useState<InteractionOrderBy>("created_desc");
  const interactionsQuery = usePersonInteractions(organizationId, personId, orderBy);
  const deleteInteractionMutation = useDeleteInteraction();
  const [page, setPage] = useState(1);
  const interactionsCount = interactionsQuery.data?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(interactionsCount / INTERACTIONS_PAGE_SIZE));

  const paginatedInteractions = useMemo(() => {
    const items = interactionsQuery.data ?? [];
    const from = (page - 1) * INTERACTIONS_PAGE_SIZE;
    const to = from + INTERACTIONS_PAGE_SIZE;
    return items.slice(from, to);
  }, [interactionsQuery.data, page]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [organizationId, personId, orderBy]);

  async function handleDeleteInteraction(interactionId: string) {
    try {
      await deleteInteractionMutation.mutateAsync({
        interactionId,
        organizationId,
        personId,
      });
      toast.success("Interaction deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete interaction");
    }
  }

  return (
    <section className="card-surface bg-bg-surface space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-text-primary text-lg font-semibold">Timeline</h4>
        <div className="flex items-center gap-3">
          {!interactionsQuery.isLoading && !interactionsQuery.isError ? (
            <p className="text-text-muted text-sm">
              {interactionsCount} {interactionsCount === 1 ? "interaction" : "interactions"}
            </p>
          ) : null}
          <Select
            value={orderBy}
            onValueChange={(value) => setOrderBy(value as InteractionOrderBy)}
          >
            <SelectTrigger className="bg-bg-app border-border-fintech h-9 w-[210px] text-base">
              <SelectValue placeholder="Created order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_desc">Created date (newest first)</SelectItem>
              <SelectItem value="created_asc">Created date (oldest first)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {interactionsQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading timeline...</p>
      ) : null}

      {interactionsQuery.isError ? (
        <p className="text-destructive text-base">
          {interactionsQuery.error instanceof Error
            ? interactionsQuery.error.message
            : "Failed to load timeline"}
        </p>
      ) : null}

      {!interactionsQuery.isLoading &&
      !interactionsQuery.isError &&
      interactionsQuery.data?.length === 0 ? (
        <p className="text-text-secondary text-base">No interactions yet.</p>
      ) : null}

      {!interactionsQuery.isLoading &&
      !interactionsQuery.isError &&
      interactionsQuery.data?.length ? (
        <div className="border-border-fintech overflow-hidden rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Occurred</TableHead>
                <TableHead>Next Step</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInteractions.map((interaction) => {
                const Icon = getInteractionTypeIcon(interaction.type);
                const nextStepStatus = getNextStepStatus(interaction.next_step_at);

                return (
                  <TableRow key={interaction.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="bg-bg-app border-border-fintech text-text-secondary inline-flex h-7 w-7 items-center justify-center rounded-sm border">
                          <Icon className="h-4 w-4" />
                        </span>
                        <p className="text-text-primary text-base font-medium">
                          {formatInteractionTypeLabel(interaction.type)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[520px]">
                      <div className="space-y-1">
                        <p className="text-text-secondary text-base whitespace-pre-wrap">
                          {interaction.summary}
                        </p>
                        {interaction.deal_id ? (
                          <p className="text-text-muted text-sm" title={interaction.deal_id}>
                            Deal:{" "}
                            <span className="text-text-secondary">
                              {formatDealReference(
                                interaction.deal_id,
                                interaction.deal_product_name,
                              )}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-0.5">
                        <time
                          className="text-text-secondary block text-sm"
                          dateTime={interaction.occurred_at}
                          title={formatDateTime(interaction.occurred_at)}
                        >
                          {formatDateTime(interaction.occurred_at)}
                        </time>
                        <p className="text-text-muted text-sm">
                          {formatRelativeTime(interaction.occurred_at)}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {interaction.next_step_at ? (
                        <div className="space-y-0.5">
                          <p className="text-text-secondary text-sm">
                            {formatDateTime(interaction.next_step_at)}
                          </p>
                          {nextStepStatus ? (
                            <p className={`text-sm font-medium ${nextStepStatus.className}`}>
                              {nextStepStatus.label}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-text-muted text-sm">-</p>
                      )}
                    </TableCell>

                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="text-text-muted hover:text-destructive h-8 w-8"
                            aria-label="Delete interaction"
                            disabled={deleteInteractionMutation.isPending}
                            onClick={() => void handleDeleteInteraction(interaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete interaction</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div className="border-border-fintech bg-bg-app flex items-center justify-between border-t px-4 py-3">
            <p className="text-text-secondary text-sm">
              Page {page} of {totalPages} ({interactionsCount} total)
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
