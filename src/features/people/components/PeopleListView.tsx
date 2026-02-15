import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Archive, Download, FilePenLine, MessageSquarePlus, Undo2, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ROUTES, QUICK_ADD_INTENTS, type QuickAddIntent } from "@/lib/constants";
import {
  useArchivePerson,
  usePeopleList,
  useUnarchivePerson,
} from "@/features/people/hooks/usePeople";
import { PeopleFilters } from "@/features/people/components/PeopleFilters";
import { PersonFormDialog } from "@/features/people/components/PersonFormDialog";
import { PeopleCsvImportDialog } from "@/features/people/components/PeopleCsvImportDialog";
import { AddToCampaignDialog } from "@/features/people/components/AddToCampaignDialog";
import { listAllPeopleForExport } from "@/features/people/services/peopleService";
import { generateCsv, downloadCsv, type CsvColumn } from "@/lib/csvExport";
import type {
  PeopleArchiveFilter,
  PeopleSort,
  Person,
  PersonLifecycle,
} from "@/features/people/types";

interface PeopleListViewProps {
  organizationId: string;
  userId: string;
  quickAddIntent?: QuickAddIntent;
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

const peopleCsvColumns: CsvColumn<Person>[] = [
  { header: "Name", accessor: (r) => r.full_name },
  { header: "Email", accessor: (r) => r.email ?? "" },
  { header: "Phone", accessor: (r) => r.phone ?? "" },
  { header: "Lifecycle", accessor: (r) => r.lifecycle },
  { header: "Notes", accessor: (r) => r.notes ?? "" },
  { header: "Created", accessor: (r) => r.created_at },
  { header: "Updated", accessor: (r) => r.updated_at },
];

const validLifecycleValues: ReadonlyArray<PersonLifecycle | "all"> = [
  "all",
  "new",
  "contacted",
  "engaged",
  "customer",
];
const validArchiveValues: ReadonlyArray<PeopleArchiveFilter> = ["active", "all", "archived"];
const validSortValues: ReadonlyArray<PeopleSort> = ["updated_desc", "created_desc", "name_asc"];

function parseLifecycle(value: string | null): PersonLifecycle | "all" {
  if (value && validLifecycleValues.includes(value as PersonLifecycle | "all")) {
    return value as PersonLifecycle | "all";
  }

  return "all";
}

function parseArchiveFilter(value: string | null): PeopleArchiveFilter {
  if (value && validArchiveValues.includes(value as PeopleArchiveFilter)) {
    return value as PeopleArchiveFilter;
  }

  return "active";
}

function parseSort(value: string | null): PeopleSort {
  if (value && validSortValues.includes(value as PeopleSort)) {
    return value as PeopleSort;
  }

  return "updated_desc";
}

function parsePage(value: string | null): number {
  const parsed = Number(value ?? "1");

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

export function PeopleListView({ organizationId, userId, quickAddIntent }: PeopleListViewProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const lifecycle = parseLifecycle(searchParams.get("lifecycle"));
  const archiveFilter = parseArchiveFilter(searchParams.get("archive"));
  const sort = parseSort(searchParams.get("sort"));
  const page = parsePage(searchParams.get("page"));
  const pageSize = 20;
  const [isCreateOpen, setIsCreateOpen] = useState(quickAddIntent === QUICK_ADD_INTENTS.PERSON);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [isCsvOpen, setIsCsvOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const productInterest = searchParams.get("product_interest") || null;
  const sourceCampaign = searchParams.get("source_campaign") || null;
  const hasOpenDealParam = searchParams.get("has_open_deal");
  const hasOpenDeal: boolean | null =
    hasOpenDealParam === "yes" ? true : hasOpenDealParam === "no" ? false : null;

  const peopleParams = useMemo(
    () => ({
      organizationId,
      search,
      lifecycle,
      archiveFilter,
      sort,
      page,
      pageSize,
      productInterest,
      sourceCampaign,
      hasOpenDeal,
    }),
    [
      organizationId,
      search,
      lifecycle,
      archiveFilter,
      sort,
      page,
      pageSize,
      productInterest,
      sourceCampaign,
      hasOpenDeal,
    ],
  );

  const peopleQuery = usePeopleList(peopleParams);
  const archivePersonMutation = useArchivePerson();
  const unarchivePersonMutation = useUnarchivePerson();

  const totalPages = Math.max(1, Math.ceil((peopleQuery.data?.total ?? 0) / pageSize));

  function updateFilters(
    updates: Partial<{
      q: string;
      lifecycle: PersonLifecycle | "all";
      archive: PeopleArchiveFilter;
      sort: PeopleSort;
      page: number;
      product_interest: string | null;
      source_campaign: string | null;
      has_open_deal: boolean | null;
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

    if ("lifecycle" in updates) {
      const value = updates.lifecycle ?? "all";
      if (value === "all") {
        next.delete("lifecycle");
      } else {
        next.set("lifecycle", value);
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

    if ("page" in updates) {
      const value = updates.page ?? 1;
      if (value <= 1) {
        next.delete("page");
      } else {
        next.set("page", String(value));
      }
    }

    if ("product_interest" in updates) {
      if (updates.product_interest === null) {
        next.delete("product_interest");
      } else {
        next.set("product_interest", updates.product_interest);
      }
    }

    if ("source_campaign" in updates) {
      if (updates.source_campaign === null) {
        next.delete("source_campaign");
      } else {
        next.set("source_campaign", updates.source_campaign);
      }
    }

    if ("has_open_deal" in updates) {
      if (updates.has_open_deal === null) {
        next.delete("has_open_deal");
      } else {
        next.set("has_open_deal", updates.has_open_deal ? "yes" : "no");
      }
    }

    setSearchParams(next, { replace: true });
  }

  async function onExport() {
    setIsExporting(true);
    try {
      const result = await listAllPeopleForExport(organizationId);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to export people");
        return;
      }
      const csv = generateCsv(peopleCsvColumns, result.data);
      downloadCsv(csv, `people-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${result.data.length} people`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  async function onArchive(person: Person) {
    try {
      if (person.is_archived) {
        await unarchivePersonMutation.mutateAsync(person.id);
        toast.success("Person restored");
      } else {
        await archivePersonMutation.mutateAsync(person.id);
        toast.success("Person archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update archive state");
    }
  }

  const currentPageIds = (peopleQuery.data?.items ?? []).map((p) => p.id);
  const allOnPageSelected =
    currentPageIds.length > 0 && currentPageIds.every((id) => selectedIds.has(id));

  function togglePerson(personId: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(personId);
      } else {
        next.delete(personId);
      }
      return next;
    });
  }

  function toggleAll(checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of currentPageIds) {
        if (checked) {
          next.add(id);
        } else {
          next.delete(id);
        }
      }
      return next;
    });
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-text-primary text-2xl font-bold">People</h2>
          <p className="text-text-secondary text-base">
            Capture leads, manage lifecycle, and log interactions.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onExport()}
            disabled={isExporting}
          >
            <Download className="mr-1 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button type="button" variant="secondary" onClick={() => setIsCsvOpen(true)}>
            Import CSV
          </Button>
          <Button type="button" onClick={() => setIsCreateOpen(true)}>
            Add Person
          </Button>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div className="card-surface bg-bg-surface flex items-center justify-between p-3">
          <p className="text-text-primary text-base">
            {selectedIds.size} {selectedIds.size === 1 ? "person" : "people"} selected
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsCampaignDialogOpen(true)}
            >
              <Users className="mr-1 h-4 w-4" />
              Add to Campaign
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      {quickAddIntent === QUICK_ADD_INTENTS.INTERACTION ? (
        <div className="card-surface bg-bg-surface p-4">
          <p className="text-text-secondary text-base">
            Quick Add interaction: choose a person and use "Add interaction".
          </p>
        </div>
      ) : null}

      <PeopleFilters
        organizationId={organizationId}
        search={search}
        lifecycle={lifecycle}
        archiveFilter={archiveFilter}
        sort={sort}
        productInterest={productInterest}
        sourceCampaign={sourceCampaign}
        hasOpenDeal={hasOpenDeal}
        onSearchChange={(value) => {
          updateFilters({ q: value, page: 1 });
        }}
        onLifecycleChange={(value) => {
          updateFilters({ lifecycle: value, page: 1 });
        }}
        onArchiveFilterChange={(value) => {
          updateFilters({ archive: value, page: 1 });
        }}
        onSortChange={(value) => {
          updateFilters({ sort: value, page: 1 });
        }}
        onProductInterestChange={(value) => {
          updateFilters({ product_interest: value, page: 1 });
        }}
        onSourceCampaignChange={(value) => {
          updateFilters({ source_campaign: value, page: 1 });
        }}
        onHasOpenDealChange={(value) => {
          updateFilters({ has_open_deal: value, page: 1 });
        }}
        onReset={() => {
          setSearchParams({}, { replace: true });
        }}
      />

      <div className="card-surface bg-bg-surface p-4">
        {peopleQuery.isLoading ? (
          <p className="text-text-secondary text-base">Loading people...</p>
        ) : null}
        {peopleQuery.isError ? (
          <p className="text-destructive text-base">
            {peopleQuery.error instanceof Error
              ? peopleQuery.error.message
              : "Failed to load people"}
          </p>
        ) : null}

        {!peopleQuery.isLoading && !peopleQuery.isError ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={(event) => toggleAll(event.target.checked)}
                      aria-label="Select all on page"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Lifecycle</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {peopleQuery.data?.items.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(person.id)}
                        onChange={(event) => togglePerson(person.id, event.target.checked)}
                        aria-label={`Select ${person.full_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Link
                        className="text-primary text-base"
                        to={`${ROUTES.PEOPLE}/${person.id}${location.search}`}
                      >
                        {person.full_name}
                      </Link>
                    </TableCell>
                    <TableCell>{person.email ?? "-"}</TableCell>
                    <TableCell>{person.phone ?? "-"}</TableCell>
                    <TableCell>{person.lifecycle}</TableCell>
                    <TableCell>
                      {person.updated_at ? new Date(person.updated_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <RowActionIconButton
                          label="Edit person"
                          icon={FilePenLine}
                          onClick={() => setEditingPerson(person)}
                        />
                        <RowActionIconButton
                          label={person.is_archived ? "Restore person" : "Archive person"}
                          icon={person.is_archived ? Undo2 : Archive}
                          onClick={() => void onArchive(person)}
                        />
                        <RowActionIconButton
                          label="Add interaction"
                          icon={MessageSquarePlus}
                          onClick={() =>
                            void navigate(`${ROUTES.PEOPLE}/${person.id}${location.search}`, {
                              state: { openInteractionDialog: true },
                            })
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {peopleQuery.data?.items.length === 0 ? (
              <p className="text-text-secondary mt-4 text-base">No people found.</p>
            ) : null}

            <div className="mt-4 flex items-center justify-between">
              <p className="text-text-secondary text-base">
                Page {page} of {totalPages} ({peopleQuery.data?.total ?? 0} total)
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => updateFilters({ page: Math.max(1, page - 1) })}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => updateFilters({ page: Math.min(totalPages, page + 1) })}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <PersonFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={organizationId}
        userId={userId}
      />

      {editingPerson ? (
        <PersonFormDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingPerson(null);
            }
          }}
          organizationId={organizationId}
          userId={userId}
          person={editingPerson}
        />
      ) : null}

      <PeopleCsvImportDialog
        open={isCsvOpen}
        onOpenChange={setIsCsvOpen}
        organizationId={organizationId}
        userId={userId}
      />

      <AddToCampaignDialog
        open={isCampaignDialogOpen}
        onOpenChange={setIsCampaignDialogOpen}
        organizationId={organizationId}
        userId={userId}
        personIds={Array.from(selectedIds)}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </section>
  );
}
