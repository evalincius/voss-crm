import { Link } from "react-router";
import { usePersonCampaignMemberships } from "@/features/campaigns/hooks/useCampaigns";
import { ROUTES } from "@/lib/constants";

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

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <PlaceholderBlock
        title="Deals"
        description="Manual deal creation is available from this page. Full deal board integration lands in D4."
      />
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
