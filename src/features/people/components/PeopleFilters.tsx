import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { personLifecycleValues } from "@/features/people/schemas/people.schema";
import { useProductOptions } from "@/features/library/products/hooks/useProducts";
import { useCampaignOptions } from "@/features/campaigns/hooks/useCampaigns";
import type { PeopleArchiveFilter, PeopleSort } from "@/features/people/types";

interface PeopleFiltersProps {
  organizationId: string;
  search: string;
  lifecycle: "all" | (typeof personLifecycleValues)[number];
  archiveFilter: PeopleArchiveFilter;
  sort: PeopleSort;
  productInterest: string | null;
  sourceCampaign: string | null;
  hasOpenDeal: boolean | null;
  onSearchChange: (value: string) => void;
  onLifecycleChange: (value: "all" | (typeof personLifecycleValues)[number]) => void;
  onArchiveFilterChange: (value: PeopleArchiveFilter) => void;
  onSortChange: (value: PeopleSort) => void;
  onProductInterestChange: (value: string | null) => void;
  onSourceCampaignChange: (value: string | null) => void;
  onHasOpenDealChange: (value: boolean | null) => void;
  onReset: () => void;
}

export function PeopleFilters({
  organizationId,
  search,
  lifecycle,
  archiveFilter,
  sort,
  productInterest,
  sourceCampaign,
  hasOpenDeal,
  onSearchChange,
  onLifecycleChange,
  onArchiveFilterChange,
  onSortChange,
  onProductInterestChange,
  onSourceCampaignChange,
  onHasOpenDealChange,
  onReset,
}: PeopleFiltersProps) {
  const productOptionsQuery = useProductOptions(organizationId);
  const campaignOptionsQuery = useCampaignOptions(organizationId);

  const hasSearch = search.trim().length > 0;
  const hasLifecycleFilter = lifecycle !== "all";
  const hasArchiveFilter = archiveFilter !== "active";
  const hasSortFilter = sort !== "updated_desc";
  const hasProductFilter = productInterest !== null;
  const hasCampaignFilter = sourceCampaign !== null;
  const hasOpenDealFilter = hasOpenDeal !== null;
  const activeFilterCount = [
    hasSearch,
    hasLifecycleFilter,
    hasArchiveFilter,
    hasSortFilter,
    hasProductFilter,
    hasCampaignFilter,
    hasOpenDealFilter,
  ].filter(Boolean).length;

  const activeFilterLabels: string[] = [];
  if (hasSearch) activeFilterLabels.push("Search");
  if (hasLifecycleFilter) activeFilterLabels.push(`Lifecycle: ${lifecycle}`);
  if (hasArchiveFilter) activeFilterLabels.push(`Visibility: ${archiveFilter}`);
  if (hasSortFilter) activeFilterLabels.push("Custom sort");
  if (hasProductFilter) {
    const name = productOptionsQuery.data?.find((p) => p.id === productInterest)?.name;
    activeFilterLabels.push(`Product: ${name ?? "..."}`);
  }
  if (hasCampaignFilter) {
    const name = campaignOptionsQuery.data?.find((c) => c.id === sourceCampaign)?.name;
    activeFilterLabels.push(`Campaign: ${name ?? "..."}`);
  }
  if (hasOpenDealFilter) {
    activeFilterLabels.push(`Open deal: ${hasOpenDeal ? "Yes" : "No"}`);
  }

  return (
    <div className="card-surface bg-bg-surface space-y-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-text-secondary text-base">
          Refine results
          {activeFilterCount > 0 ? ` · ${activeFilterCount} active` : ""}
        </p>
        {activeFilterCount > 0 ? (
          <Button
            type="button"
            variant="secondary"
            className="h-9 px-3 text-base"
            onClick={onReset}
          >
            Clear filters
          </Button>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative w-full lg:flex-1">
          <Search className="text-text-muted pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search name, email, or phone"
            aria-label="Search people"
            className="bg-bg-app border-border-fintech h-10 pr-10 pl-9 text-base"
          />
          {hasSearch ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              className="text-text-muted hover:text-text-primary absolute top-1/2 right-3 -translate-y-1/2 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap lg:w-auto">
          <Select value={lifecycle} onValueChange={onLifecycleChange}>
            <SelectTrigger
              aria-label="Filter by lifecycle"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]"
            >
              <SelectValue placeholder="Lifecycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lifecycle</SelectItem>
              {personLifecycleValues.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={archiveFilter}
            onValueChange={(value) => onArchiveFilterChange(value as PeopleArchiveFilter)}
          >
            <SelectTrigger
              aria-label="Archive filter"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]"
            >
              <SelectValue placeholder="Archive filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="archived">Archived only</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(value) => onSortChange(value as PeopleSort)}>
            <SelectTrigger
              aria-label="Sort people"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[180px]"
            >
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="updated_desc">Recently updated</SelectItem>
              <SelectItem value="created_desc">Newest</SelectItem>
              <SelectItem value="name_asc">Name A-Z</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={productInterest ?? "all"}
            onValueChange={(value) => onProductInterestChange(value === "all" ? null : value)}
          >
            <SelectTrigger
              aria-label="Filter by product interest"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[180px]"
            >
              <SelectValue placeholder="Product interest" />
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

          <Select
            value={sourceCampaign ?? "all"}
            onValueChange={(value) => onSourceCampaignChange(value === "all" ? null : value)}
          >
            <SelectTrigger
              aria-label="Filter by source campaign"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[180px]"
            >
              <SelectValue placeholder="Source campaign" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All campaigns</SelectItem>
              {(campaignOptionsQuery.data ?? []).map((campaign) => (
                <SelectItem key={campaign.id} value={campaign.id}>
                  {campaign.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={hasOpenDeal === null ? "any" : hasOpenDeal ? "yes" : "no"}
            onValueChange={(value) => {
              if (value === "any") onHasOpenDealChange(null);
              else if (value === "yes") onHasOpenDealChange(true);
              else onHasOpenDealChange(false);
            }}
          >
            <SelectTrigger
              aria-label="Filter by open deal"
              className="bg-bg-app border-border-fintech h-10 w-full text-base sm:w-[170px]"
            >
              <SelectValue placeholder="Has open deal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any deal status</SelectItem>
              <SelectItem value="yes">Has open deal</SelectItem>
              <SelectItem value="no">No open deal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {activeFilterLabels.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeFilterLabels.map((label) => (
            <span
              key={label}
              className="border-border-fintech bg-bg-app text-text-secondary rounded-md border px-2 py-1 text-sm"
            >
              {label}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
