import { Link } from "react-router";
import { Trophy, Package, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ROUTES } from "@/lib/constants";
import { useTopProducts, useTopCampaigns } from "@/features/dashboard/hooks/useDashboard";

interface TopRankingsWidgetProps {
  organizationId: string;
}

export function TopRankingsWidget({ organizationId }: TopRankingsWidgetProps) {
  const productsQuery = useTopProducts(organizationId);
  const campaignsQuery = useTopCampaigns(organizationId);

  return (
    <div className="card-surface bg-bg-surface h-full p-4">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-4 w-4 text-violet-500" />
        <h3 className="font-heading text-text-primary text-base font-semibold">Top Rankings</h3>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Top Products */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Package className="text-text-muted h-3.5 w-3.5" />
            <h4 className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              Products
            </h4>
          </div>

          {productsQuery.isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          ) : null}

          {productsQuery.isError ? (
            <p className="text-destructive text-xs">Failed to load</p>
          ) : null}

          {productsQuery.data && productsQuery.data.length === 0 ? (
            <p className="text-text-muted text-xs">No products yet</p>
          ) : null}

          {productsQuery.data && productsQuery.data.length > 0 ? (
            <div className="divide-border-fintech divide-y">
              {productsQuery.data.map((product, index) => (
                <div
                  key={product.product_id}
                  className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="text-text-muted w-4 shrink-0 text-xs tabular-nums">
                      {index + 1}.
                    </span>
                    <Link
                      to={`${ROUTES.LIBRARY_PRODUCTS}/${product.product_id}`}
                      className="text-primary truncate text-sm hover:underline"
                    >
                      {product.product_name}
                    </Link>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                    {product.deal_count} {product.deal_count === 1 ? "deal" : "deals"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Top Campaigns */}
        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <Megaphone className="text-text-muted h-3.5 w-3.5" />
            <h4 className="text-text-secondary text-xs font-semibold tracking-wider uppercase">
              Campaigns
            </h4>
          </div>

          {campaignsQuery.isLoading ? (
            <div className="space-y-1.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-full rounded-md" />
              ))}
            </div>
          ) : null}

          {campaignsQuery.isError ? (
            <p className="text-destructive text-xs">Failed to load</p>
          ) : null}

          {campaignsQuery.data && campaignsQuery.data.length === 0 ? (
            <p className="text-text-muted text-xs">No campaigns yet</p>
          ) : null}

          {campaignsQuery.data && campaignsQuery.data.length > 0 ? (
            <div className="divide-border-fintech divide-y">
              {campaignsQuery.data.map((campaign, index) => (
                <div
                  key={campaign.campaign_id}
                  className="flex items-center justify-between gap-2 py-1.5 first:pt-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="text-text-muted w-4 shrink-0 text-xs tabular-nums">
                      {index + 1}.
                    </span>
                    <Link
                      to={`${ROUTES.CAMPAIGNS}/${campaign.campaign_id}`}
                      className="text-primary truncate text-sm hover:underline"
                    >
                      {campaign.campaign_name}
                    </Link>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                    {campaign.member_count} {campaign.member_count === 1 ? "member" : "members"}
                  </Badge>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
