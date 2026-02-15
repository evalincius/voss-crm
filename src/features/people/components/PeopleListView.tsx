import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router";
import { Archive, FilePenLine, MessageSquarePlus, Undo2, Users } from "lucide-react";
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

  const peopleParams = useMemo(
    () => ({
      organizationId,
      search,
      lifecycle,
      archiveFilter,
      sort,
      page,
      pageSize,
    }),
    [organizationId, search, lifecycle, archiveFilter, sort, page, pageSize],
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

    setSearchParams(next, { replace: true });
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
        search={search}
        lifecycle={lifecycle}
        archiveFilter={archiveFilter}
        sort={sort}
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
