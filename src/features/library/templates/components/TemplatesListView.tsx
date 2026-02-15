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
import { ROUTES, QUICK_ADD_INTENTS, type QuickAddIntent } from "@/lib/constants";
import {
  useSetTemplateStatus,
  useTemplateProductOptions,
  useTemplatesList,
} from "@/features/library/templates/hooks/useTemplates";
import { TemplateFormDialog } from "@/features/library/templates/components/TemplateFormDialog";
import type {
  Template,
  TemplateSort,
  TemplateStatusFilter,
} from "@/features/library/templates/types";

interface TemplatesListViewProps {
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

const validStatusFilterValues: ReadonlyArray<TemplateStatusFilter> = ["active", "all", "archived"];
const validSortValues: ReadonlyArray<TemplateSort> = ["updated_desc", "created_desc", "title_asc"];

function parseStatusFilter(value: string | null): TemplateStatusFilter {
  if (value && validStatusFilterValues.includes(value as TemplateStatusFilter)) {
    return value as TemplateStatusFilter;
  }

  return "active";
}

function parseSort(value: string | null): TemplateSort {
  if (value && validSortValues.includes(value as TemplateSort)) {
    return value as TemplateSort;
  }

  return "updated_desc";
}

function parseProductFilter(value: string | null): string | null {
  if (!value || value === "all") {
    return null;
  }

  return value;
}

export function TemplatesListView({
  organizationId,
  userId,
  quickAddIntent,
}: TemplatesListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const statusFilter = parseStatusFilter(searchParams.get("status"));
  const sort = parseSort(searchParams.get("sort"));
  const productId = parseProductFilter(searchParams.get("product_id"));
  const [isCreateOpen, setIsCreateOpen] = useState(quickAddIntent === QUICK_ADD_INTENTS.TEMPLATE);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  const params = useMemo(
    () => ({ organizationId, search, statusFilter, sort, productId }),
    [organizationId, search, statusFilter, sort, productId],
  );

  const templatesQuery = useTemplatesList(params);
  const productOptionsQuery = useTemplateProductOptions(organizationId);
  const setStatusMutation = useSetTemplateStatus();

  function updateFilters(
    updates: Partial<{
      q: string;
      status: TemplateStatusFilter;
      sort: TemplateSort;
      productId: string;
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

    if ("status" in updates) {
      const value = updates.status ?? "active";
      if (value === "active") {
        next.delete("status");
      } else {
        next.set("status", value);
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

    if ("productId" in updates) {
      const value = updates.productId ?? "all";
      if (value === "all") {
        next.delete("product_id");
      } else {
        next.set("product_id", value);
      }
    }

    setSearchParams(next, { replace: true });
  }

  async function onArchiveToggle(template: Template) {
    try {
      const nextStatus = template.status === "archived" ? "draft" : "archived";
      await setStatusMutation.mutateAsync({ templateId: template.id, status: nextStatus });
      toast.success(nextStatus === "archived" ? "Template archived" : "Template restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update template status");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-text-primary text-2xl font-bold">Library - Templates</h2>
          <p className="text-text-secondary text-base">
            Manage reusable templates and product linkage.
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Add Template
        </Button>
      </div>

      {quickAddIntent === QUICK_ADD_INTENTS.TEMPLATE ? (
        <div className="card-surface bg-bg-surface p-4">
          <p className="text-text-secondary text-base">
            Quick Add intent detected. Template dialog opened for current organization context.
          </p>
        </div>
      ) : null}

      <div className="card-surface bg-bg-surface space-y-3 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={search}
            onChange={(event) => updateFilters({ q: event.target.value })}
            placeholder="Search templates"
            aria-label="Search templates"
            className="bg-bg-app border-border-fintech h-10 w-full text-base lg:max-w-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={statusFilter}
              onValueChange={(value) => updateFilters({ status: value as TemplateStatusFilter })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="archived">Archived only</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sort}
              onValueChange={(value) => updateFilters({ sort: value as TemplateSort })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[180px]">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_desc">Recently updated</SelectItem>
                <SelectItem value="created_desc">Newest</SelectItem>
                <SelectItem value="title_asc">Title A-Z</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={productId ?? "all"}
              onValueChange={(value) => updateFilters({ productId: value })}
            >
              <SelectTrigger className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[220px]">
                <SelectValue placeholder="Filter by product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All products</SelectItem>
                {(productOptionsQuery.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="card-surface bg-bg-surface p-4">
        {templatesQuery.isLoading ? (
          <p className="text-text-secondary text-base">Loading templates...</p>
        ) : null}
        {templatesQuery.isError ? (
          <p className="text-destructive text-base">
            {templatesQuery.error instanceof Error
              ? templatesQuery.error.message
              : "Failed to load templates"}
          </p>
        ) : null}

        {!templatesQuery.isLoading && !templatesQuery.isError ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templatesQuery.data?.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <Link
                        className="text-primary text-base"
                        to={`${ROUTES.LIBRARY_TEMPLATES}/${template.id}`}
                      >
                        {template.title}
                      </Link>
                    </TableCell>
                    <TableCell>{template.category}</TableCell>
                    <TableCell>{template.status}</TableCell>
                    <TableCell>
                      {template.updated_at
                        ? new Date(template.updated_at).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <RowActionIconButton
                          label="Edit template"
                          icon={FilePenLine}
                          onClick={() => setEditingTemplate(template)}
                        />
                        <RowActionIconButton
                          label={
                            template.status === "archived" ? "Restore template" : "Archive template"
                          }
                          icon={template.status === "archived" ? Undo2 : Archive}
                          onClick={() => void onArchiveToggle(template)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {templatesQuery.data?.length === 0 ? (
              <p className="text-text-secondary mt-4 text-base">No templates found.</p>
            ) : null}
          </>
        ) : null}
      </div>

      <TemplateFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={organizationId}
        userId={userId}
      />

      {editingTemplate ? (
        <TemplateFormDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingTemplate(null);
            }
          }}
          organizationId={organizationId}
          userId={userId}
          template={editingTemplate}
        />
      ) : null}
    </section>
  );
}
