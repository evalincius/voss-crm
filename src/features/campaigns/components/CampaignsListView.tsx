import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { Archive, FilePenLine, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { ROUTES } from "@/lib/constants";
import {
  useArchiveCampaign,
  useCampaignsList,
  useUnarchiveCampaign,
} from "@/features/campaigns/hooks/useCampaigns";
import { CampaignFormDialog } from "@/features/campaigns/components/CampaignFormDialog";
import type {
  Campaign,
  CampaignArchiveFilter,
  CampaignSort,
  CampaignType,
} from "@/features/campaigns/types";

interface CampaignsListViewProps {
  organizationId: string;
  userId: string;
}

interface RowActionIconButtonProps {
  label: string;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

function RowActionIconButton({ label, onClick, icon: Icon }: RowActionIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="text-text-secondary hover:text-text-primary h-8 w-8"
          onClick={onClick}
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

const validArchiveValues: ReadonlyArray<CampaignArchiveFilter> = ["active", "all", "archived"];
const validSortValues: ReadonlyArray<CampaignSort> = ["updated_desc", "created_desc", "name_asc"];
const validTypeValues: ReadonlyArray<CampaignType | "all"> = [
  "all",
  "cold_outreach",
  "warm_outreach",
  "content",
  "paid_ads",
];

function parseArchiveFilter(value: string | null): CampaignArchiveFilter {
  if (value && validArchiveValues.includes(value as CampaignArchiveFilter)) {
    return value as CampaignArchiveFilter;
  }

  return "active";
}

function parseSort(value: string | null): CampaignSort {
  if (value && validSortValues.includes(value as CampaignSort)) {
    return value as CampaignSort;
  }

  return "updated_desc";
}

function parseTypeFilter(value: string | null): CampaignType | "all" {
  if (value && validTypeValues.includes(value as CampaignType | "all")) {
    return value as CampaignType | "all";
  }

  return "all";
}

export function CampaignsListView({ organizationId, userId }: CampaignsListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const archiveFilter = parseArchiveFilter(searchParams.get("archive"));
  const sort = parseSort(searchParams.get("sort"));
  const typeFilter = parseTypeFilter(searchParams.get("type"));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const params = useMemo(
    () => ({ organizationId, search, archiveFilter, typeFilter, sort }),
    [organizationId, search, archiveFilter, typeFilter, sort],
  );

  const campaignsQuery = useCampaignsList(params);
  const archiveMutation = useArchiveCampaign();
  const unarchiveMutation = useUnarchiveCampaign();

  function updateFilters(
    updates: Partial<{
      q: string;
      archive: CampaignArchiveFilter;
      sort: CampaignSort;
      type: CampaignType | "all";
    }>,
  ) {
    const next = new URLSearchParams(searchParams);

    if ("q" in updates) {
      const value = updates.q?.trim() ?? "";
      if (value.length === 0) {
        next.delete("q");
      } else {
        next.set("q", value);
      }
    }

    if ("archive" in updates) {
      const value = updates.archive ?? "active";
      if (value === "active") {
        next.delete("archive");
      } else {
        next.set("archive", value);
      }
    }

    if ("sort" in updates) {
      const value = updates.sort ?? "updated_desc";
      if (value === "updated_desc") {
        next.delete("sort");
      } else {
        next.set("sort", value);
      }
    }

    if ("type" in updates) {
      const value = updates.type ?? "all";
      if (value === "all") {
        next.delete("type");
      } else {
        next.set("type", value);
      }
    }

    setSearchParams(next, { replace: true });
  }

  async function onArchive(campaign: Campaign) {
    try {
      if (campaign.is_archived) {
        await unarchiveMutation.mutateAsync(campaign.id);
        toast.success("Campaign restored");
      } else {
        await archiveMutation.mutateAsync(campaign.id);
        toast.success("Campaign archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-text-primary text-2xl font-bold">Campaigns</h2>
          <p className="text-text-secondary text-base">
            Organize outreach, track membership and engagement.
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Create Campaign
        </Button>
      </div>

      <div className="card-surface bg-bg-surface space-y-3 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={search}
            onChange={(event) => updateFilters({ q: event.target.value })}
            placeholder="Search campaigns"
            aria-label="Search campaigns"
            className="bg-bg-app border-border-fintech h-10 w-full text-base lg:max-w-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={typeFilter}
              onValueChange={(value) => updateFilters({ type: value as CampaignType | "all" })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="cold_outreach">cold outreach</SelectItem>
                <SelectItem value="warm_outreach">warm outreach</SelectItem>
                <SelectItem value="content">content</SelectItem>
                <SelectItem value="paid_ads">paid ads</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={archiveFilter}
              onValueChange={(value) => updateFilters({ archive: value as CampaignArchiveFilter })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]">
                <SelectValue placeholder="Archive filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => updateFilters({ sort: value as CampaignSort })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Recently updated</SelectItem>
                <SelectItem value="created_desc">Newest</SelectItem>
                <SelectItem value="name_asc">Name A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-surface bg-bg-surface p-4">
        {campaignsQuery.isLoading ? (
          <p className="text-text-secondary text-base">Loading campaigns...</p>
        ) : null}
        {campaignsQuery.isError ? (
          <p className="text-destructive text-base">
            {campaignsQuery.error instanceof Error
              ? campaignsQuery.error.message
              : "Failed to load campaigns"}
          </p>
        ) : null}

        {!campaignsQuery.isLoading && !campaignsQuery.isError ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaignsQuery.data?.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell>
                      <Link
                        className="text-primary text-base"
                        to={`${ROUTES.CAMPAIGNS}/${campaign.id}`}
                      >
                        {campaign.name}
                      </Link>
                    </TableCell>
                    <TableCell>{campaign.type.replace(/_/g, " ")}</TableCell>
                    <TableCell>{campaign.is_archived ? "archived" : "active"}</TableCell>
                    <TableCell>
                      {campaign.updated_at
                        ? new Date(campaign.updated_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <RowActionIconButton
                          label="Edit campaign"
                          icon={FilePenLine}
                          onClick={() => setEditingCampaign(campaign)}
                        />
                        <RowActionIconButton
                          label={campaign.is_archived ? "Restore campaign" : "Archive campaign"}
                          icon={campaign.is_archived ? Undo2 : Archive}
                          onClick={() => void onArchive(campaign)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {campaignsQuery.data?.length === 0 ? (
              <p className="text-text-secondary mt-4 text-base">No campaigns found.</p>
            ) : null}
          </>
        ) : null}
      </div>

      <CampaignFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={organizationId}
        userId={userId}
      />

      {editingCampaign ? (
        <CampaignFormDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingCampaign(null);
            }
          }}
          organizationId={organizationId}
          userId={userId}
          campaign={editingCampaign}
        />
      ) : null}
    </section>
  );
}
