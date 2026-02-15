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
  useArchiveProduct,
  useProductsList,
  useUnarchiveProduct,
} from "@/features/library/products/hooks/useProducts";
import { ProductFormDialog } from "@/features/library/products/components/ProductFormDialog";
import type { Product, ProductArchiveFilter, ProductSort } from "@/features/library/products/types";

interface ProductsListViewProps {
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

const validArchiveValues: ReadonlyArray<ProductArchiveFilter> = ["active", "all", "archived"];
const validSortValues: ReadonlyArray<ProductSort> = ["updated_desc", "created_desc", "name_asc"];

function parseArchiveFilter(value: string | null): ProductArchiveFilter {
  if (value && validArchiveValues.includes(value as ProductArchiveFilter)) {
    return value as ProductArchiveFilter;
  }

  return "active";
}

function parseSort(value: string | null): ProductSort {
  if (value && validSortValues.includes(value as ProductSort)) {
    return value as ProductSort;
  }

  return "updated_desc";
}

export function ProductsListView({ organizationId, userId }: ProductsListViewProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const archiveFilter = parseArchiveFilter(searchParams.get("archive"));
  const sort = parseSort(searchParams.get("sort"));
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const params = useMemo(
    () => ({ organizationId, search, archiveFilter, sort }),
    [organizationId, search, archiveFilter, sort],
  );

  const productsQuery = useProductsList(params);
  const archiveProductMutation = useArchiveProduct();
  const unarchiveProductMutation = useUnarchiveProduct();

  function updateFilters(
    updates: Partial<{ q: string; archive: ProductArchiveFilter; sort: ProductSort }>,
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

    setSearchParams(next, { replace: true });
  }

  async function onArchive(product: Product) {
    try {
      if (product.is_archived) {
        await unarchiveProductMutation.mutateAsync(product.id);
        toast.success("Product restored");
      } else {
        await archiveProductMutation.mutateAsync(product.id);
        toast.success("Product archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-text-primary text-2xl font-bold">Library - Products</h2>
          <p className="text-text-secondary text-base">
            Manage product catalog entries used by deals and templates.
          </p>
        </div>

        <Button type="button" onClick={() => setIsCreateOpen(true)}>
          Add Product
        </Button>
      </div>

      <div className="card-surface bg-bg-surface space-y-3 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <Input
            value={search}
            onChange={(event) => updateFilters({ q: event.target.value })}
            placeholder="Search products"
            aria-label="Search products"
            className="bg-bg-app border-border-fintech h-10 w-full text-base lg:max-w-sm"
          />

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              value={archiveFilter}
              onValueChange={(value) => updateFilters({ archive: value as ProductArchiveFilter })}
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
              onValueChange={(value) => updateFilters({ sort: value as ProductSort })}
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
        {productsQuery.isLoading ? (
          <p className="text-text-secondary text-base">Loading products...</p>
        ) : null}
        {productsQuery.isError ? (
          <p className="text-destructive text-base">
            {productsQuery.error instanceof Error
              ? productsQuery.error.message
              : "Failed to load products"}
          </p>
        ) : null}

        {!productsQuery.isLoading && !productsQuery.isError ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsQuery.data?.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Link
                        className="text-primary text-base"
                        to={`${ROUTES.LIBRARY_PRODUCTS}/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product.description ?? "-"}</TableCell>
                    <TableCell>{product.is_archived ? "archived" : "active"}</TableCell>
                    <TableCell>
                      {product.updated_at ? new Date(product.updated_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <RowActionIconButton
                          label="Edit product"
                          icon={FilePenLine}
                          onClick={() => setEditingProduct(product)}
                        />
                        <RowActionIconButton
                          label={product.is_archived ? "Restore product" : "Archive product"}
                          icon={product.is_archived ? Undo2 : Archive}
                          onClick={() => void onArchive(product)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {productsQuery.data?.length === 0 ? (
              <p className="text-text-secondary mt-4 text-base">No products found.</p>
            ) : null}
          </>
        ) : null}
      </div>

      <ProductFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        organizationId={organizationId}
        userId={userId}
      />

      {editingProduct ? (
        <ProductFormDialog
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) {
              setEditingProduct(null);
            }
          }}
          organizationId={organizationId}
          userId={userId}
          product={editingProduct}
        />
      ) : null}
    </section>
  );
}
