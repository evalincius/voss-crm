import { useState } from "react";
import { ArrowLeft, Archive, Undo2, X } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";
import {
  useArchiveCampaign,
  useCampaignDetail,
  useCampaignMembers,
  useRemovePersonFromCampaign,
  useUnarchiveCampaign,
} from "@/features/campaigns/hooks/useCampaigns";
import {
  getCampaignLinkedProducts,
  getCampaignLinkedTemplates,
} from "@/features/campaigns/services/campaignsService";
import { CampaignFormDialog } from "@/features/campaigns/components/CampaignFormDialog";
import { CampaignMetricsPanel } from "@/features/campaigns/components/CampaignMetricsPanel";
import { CampaignMemberSearch } from "@/features/campaigns/components/CampaignMemberSearch";
import { useQuery } from "@tanstack/react-query";
import { campaignKeys } from "@/lib/queryKeys";

interface CampaignDetailViewProps {
  organizationId: string;
  userId: string;
  campaignId: string;
}

export function CampaignDetailView({
  organizationId,
  userId,
  campaignId,
}: CampaignDetailViewProps) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const detailQuery = useCampaignDetail(organizationId, campaignId);
  const membersQuery = useCampaignMembers(organizationId, campaignId);
  const archiveMutation = useArchiveCampaign();
  const unarchiveMutation = useUnarchiveCampaign();
  const removeMemberMutation = useRemovePersonFromCampaign();

  const linkedProductsQuery = useQuery({
    queryKey: [...campaignKeys.productLinks(organizationId, campaignId).queryKey, "summaries"],
    queryFn: async () => {
      const result = await getCampaignLinkedProducts(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked products");
      }
      return result.data;
    },
  });

  const linkedTemplatesQuery = useQuery({
    queryKey: [...campaignKeys.templateLinks(organizationId, campaignId).queryKey, "summaries"],
    queryFn: async () => {
      const result = await getCampaignLinkedTemplates(organizationId, campaignId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load linked templates");
      }
      return result.data;
    },
  });

  async function onArchiveToggle() {
    if (!detailQuery.data) {
      return;
    }

    try {
      if (detailQuery.data.is_archived) {
        await unarchiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Campaign restored");
      } else {
        await archiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Campaign archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update campaign");
    }
  }

  async function onRemoveMember(personId: string) {
    try {
      await removeMemberMutation.mutateAsync({
        organizationId,
        campaignId,
        personId,
      });
      toast.success("Member removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove member");
    }
  }

  const existingMemberIds = (membersQuery.data ?? []).map((m) => m.person_id);

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h2 className="font-heading text-text-primary text-2xl font-bold">Campaign Detail</h2>

      {detailQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading campaign...</p>
      ) : null}
      {detailQuery.isError ? (
        <p className="text-destructive text-base">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : "Failed to load campaign"}
        </p>
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && !detailQuery.data ? (
        <p className="text-text-secondary text-base">Campaign not found.</p>
      ) : null}

      {detailQuery.data ? (
        <>
          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-text-primary text-xl font-bold">
                  {detailQuery.data.name}
                </p>
                <p className="text-text-secondary text-base">
                  Type: {detailQuery.data.type.replace(/_/g, " ")}
                </p>
                <p className="text-text-secondary mt-1 text-sm">
                  Status: {detailQuery.data.is_archived ? "archived" : "active"}
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => void onArchiveToggle()}>
                  {detailQuery.data.is_archived ? (
                    <>
                      <Undo2 className="h-4 w-4" />
                      Restore
                    </>
                  ) : (
                    <>
                      <Archive className="h-4 w-4" />
                      Archive
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <h3 className="font-heading text-text-primary text-lg font-bold">Metrics</h3>
            <CampaignMetricsPanel organizationId={organizationId} campaignId={campaignId} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Linked products</h3>
              {linkedProductsQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading...</p>
              ) : null}
              {linkedProductsQuery.data?.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProductsQuery.data.map((product) => (
                      <tr key={product.id} className="border-border-fintech border-b last:border-0">
                        <td className="py-2.5">
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.LIBRARY_PRODUCTS}/${product.id}`}
                          >
                            {product.name}
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : !linkedProductsQuery.isLoading ? (
                <p className="text-text-secondary text-base">No products linked.</p>
              ) : null}
            </div>

            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Linked templates</h3>
              {linkedTemplatesQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading...</p>
              ) : null}
              {linkedTemplatesQuery.data?.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                      <th className="text-text-secondary pb-2 font-medium">Category</th>
                      <th className="text-text-secondary pb-2 text-right font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedTemplatesQuery.data.map((template) => (
                      <tr
                        key={template.id}
                        className="border-border-fintech border-b last:border-0"
                      >
                        <td className="py-2.5">
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.LIBRARY_TEMPLATES}/${template.id}`}
                          >
                            {template.title}
                          </Link>
                        </td>
                        <td className="text-text-secondary py-2.5 capitalize">
                          {template.category.replace(/_/g, " ")}
                        </td>
                        <td className="text-text-secondary py-2.5 text-right capitalize">
                          {template.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : !linkedTemplatesQuery.isLoading ? (
                <p className="text-text-secondary text-base">No templates linked.</p>
              ) : null}
            </div>
          </div>

          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <h3 className="font-heading text-text-primary text-lg font-bold">Members</h3>

            <CampaignMemberSearch
              organizationId={organizationId}
              campaignId={campaignId}
              userId={userId}
              existingMemberIds={existingMemberIds}
            />

            {membersQuery.isLoading ? (
              <p className="text-text-secondary text-base">Loading members...</p>
            ) : null}
            {membersQuery.isError ? (
              <p className="text-destructive text-base">
                {membersQuery.error instanceof Error
                  ? membersQuery.error.message
                  : "Failed to load members"}
              </p>
            ) : null}

            {!membersQuery.isLoading && !membersQuery.isError ? (
              <>
                {(membersQuery.data ?? []).length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-border-fintech border-b">
                        <th className="text-text-secondary pb-2 font-medium">Name</th>
                        <th className="text-text-secondary pb-2 font-medium">Email</th>
                        <th className="text-text-secondary pb-2 font-medium">Lifecycle</th>
                        <th className="text-text-secondary pb-2 text-right font-medium">Added</th>
                        <th className="w-10 pb-2">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersQuery.data?.map((member) => (
                        <tr
                          key={member.id}
                          className="border-border-fintech border-b last:border-0"
                        >
                          <td className="py-2.5">
                            <Link
                              className="text-primary hover:underline"
                              to={`${ROUTES.PEOPLE}/${member.person_id}`}
                            >
                              {member.full_name}
                            </Link>
                          </td>
                          <td className="text-text-secondary py-2.5">{member.email ?? "-"}</td>
                          <td className="text-text-secondary py-2.5 capitalize">
                            {member.lifecycle}
                          </td>
                          <td className="text-text-secondary py-2.5 text-right tabular-nums">
                            {new Date(member.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-2.5 text-right">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="text-text-secondary hover:text-destructive h-7 w-7"
                              onClick={() => void onRemoveMember(member.person_id)}
                              aria-label={`Remove ${member.full_name}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="text-text-secondary text-base">No members yet.</p>
                )}
              </>
            ) : null}
          </div>

          <CampaignFormDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            organizationId={organizationId}
            userId={userId}
            campaign={detailQuery.data}
          />
        </>
      ) : null}
    </section>
  );
}
