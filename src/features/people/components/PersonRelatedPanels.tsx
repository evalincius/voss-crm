import { Link } from "react-router";
import { usePersonCampaignMemberships } from "@/features/campaigns/hooks/useCampaigns";
import { useDealsByPerson } from "@/features/deals/hooks/useDeals";
import { DEAL_STAGE_LABELS, ROUTES } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

function PlaceholderBlock({ title, description }: { title: string; description: string }) {
  return (
    <section className="card-surface bg-bg-surface space-y-2 p-6">
      <h4 className="text-text-primary text-lg font-semibold">{title}</h4>
      <p className="text-text-secondary text-base">{description}</p>
    </section>
  );
}

interface PersonRelatedPanelsProps {
  organizationId: string;
  personId: string;
}

export function PersonRelatedPanels({ organizationId, personId }: PersonRelatedPanelsProps) {
  const membershipsQuery = usePersonCampaignMemberships(organizationId, personId);
  const dealsQuery = useDealsByPerson(organizationId, personId);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <section className="card-surface bg-bg-surface space-y-2 p-6">
        <h4 className="text-text-primary text-lg font-semibold">Deals</h4>
        {dealsQuery.isLoading ? <p className="text-text-secondary text-base">Loading...</p> : null}
        {dealsQuery.isError ? (
          <p className="text-destructive text-base">Failed to load deals</p>
        ) : null}
        {!dealsQuery.isLoading && !dealsQuery.isError ? (
          <>
            {(dealsQuery.data ?? []).length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border-fintech border-b">
                    <th className="text-text-secondary pb-2 font-medium">Product</th>
                    <th className="text-text-secondary pb-2 font-medium">Stage</th>
                    <th className="text-text-secondary pb-2 text-right font-medium">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {dealsQuery.data?.map((deal) => (
                    <tr key={deal.id} className="border-border-fintech border-b last:border-0">
                      <td className="py-2.5">
                        <Link
                          className="text-primary hover:underline"
                          to={`${ROUTES.DEALS}?product_id=${deal.product_id}`}
                        >
                          {deal.product_name}
                        </Link>
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-xs">
                          {DEAL_STAGE_LABELS[deal.stage]}
                        </Badge>
                      </td>
                      <td className="text-text-secondary py-2.5 text-right tabular-nums">
                        {deal.value != null
                          ? `${deal.currency ?? ""} ${Number(deal.value).toLocaleString()}`
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-secondary text-base">No deals yet.</p>
            )}
          </>
        ) : null}
      </section>
      <section className="card-surface bg-bg-surface space-y-2 p-6">
        <h4 className="text-text-primary text-lg font-semibold">Campaign Memberships</h4>
        {membershipsQuery.isLoading ? (
          <p className="text-text-secondary text-base">Loading...</p>
        ) : null}
        {membershipsQuery.isError ? (
          <p className="text-destructive text-base">Failed to load memberships</p>
        ) : null}
        {!membershipsQuery.isLoading && !membershipsQuery.isError ? (
          <>
            {(membershipsQuery.data ?? []).length > 0 ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border-fintech border-b">
                    <th className="text-text-secondary pb-2 font-medium">Name</th>
                    <th className="text-text-secondary pb-2 font-medium">Type</th>
                    <th className="text-text-secondary pb-2 text-right font-medium">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {membershipsQuery.data?.map((membership) => (
                    <tr
                      key={membership.id}
                      className="border-border-fintech border-b last:border-0"
                    >
                      <td className="py-2.5">
                        <Link
                          className="text-primary hover:underline"
                          to={`${ROUTES.CAMPAIGNS}/${membership.campaign_id}`}
                        >
                          {membership.campaign_name}
                        </Link>
                      </td>
                      <td className="text-text-secondary py-2.5 capitalize">
                        {membership.campaign_type.replace(/_/g, " ")}
                      </td>
                      <td className="text-text-secondary py-2.5 text-right tabular-nums">
                        {new Date(membership.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-text-secondary text-base">Not a member of any campaigns.</p>
            )}
          </>
        ) : null}
      </section>
      <PlaceholderBlock
        title="Templates Used"
        description="Template usage visibility is introduced once templates and campaign links are implemented."
      />
    </div>
  );
}
