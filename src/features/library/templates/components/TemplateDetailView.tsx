import { useState } from "react";
import { ArrowLeft, Archive, Undo2 } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useSetTemplateStatus,
  useTemplateDetail,
  useTemplateLinkedProductIds,
  useTemplateProductOptions,
  useTemplateUsedInSummary,
} from "@/features/library/templates/hooks/useTemplates";
import { TemplateFormDialog } from "@/features/library/templates/components/TemplateFormDialog";

interface TemplateDetailViewProps {
  organizationId: string;
  userId: string;
  templateId: string;
}

export function TemplateDetailView({
  organizationId,
  userId,
  templateId,
}: TemplateDetailViewProps) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const detailQuery = useTemplateDetail(organizationId, templateId);
  const usedInQuery = useTemplateUsedInSummary(organizationId, templateId);
  const linkedProductIdsQuery = useTemplateLinkedProductIds(organizationId, templateId);
  const productOptionsQuery = useTemplateProductOptions(organizationId);
  const setStatusMutation = useSetTemplateStatus();

  async function onArchiveToggle() {
    if (!detailQuery.data) {
      return;
    }

    try {
      const nextStatus = detailQuery.data.status === "archived" ? "draft" : "archived";
      await setStatusMutation.mutateAsync({
        templateId: detailQuery.data.id,
        status: nextStatus,
      });
      toast.success(nextStatus === "archived" ? "Template archived" : "Template restored");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update template status");
    }
  }

  const linkedProductNames = (productOptionsQuery.data ?? [])
    .filter((product) => (linkedProductIdsQuery.data ?? []).includes(product.id))
    .map((product) => product.name);

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h2 className="font-heading text-text-primary text-2xl font-bold">
        Library - Template Detail
      </h2>

      {detailQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading template...</p>
      ) : null}
      {detailQuery.isError ? (
        <p className="text-destructive text-base">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : "Failed to load template"}
        </p>
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && !detailQuery.data ? (
        <p className="text-text-secondary text-base">Template not found.</p>
      ) : null}

      {detailQuery.data ? (
        <>
          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-text-primary text-xl font-bold">
                  {detailQuery.data.title}
                </p>
                <p className="text-text-secondary text-base">
                  {detailQuery.data.category} · {detailQuery.data.status}
                </p>
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="secondary" onClick={() => setIsEditOpen(true)}>
                  Edit
                </Button>
                <Button type="button" variant="secondary" onClick={() => void onArchiveToggle()}>
                  {detailQuery.data.status === "archived" ? (
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

            <div className="border-border-fintech bg-bg-app rounded-md border p-3">
              <p className="text-text-primary text-base whitespace-pre-wrap">
                {detailQuery.data.body}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Linked products</h3>
              {linkedProductIdsQuery.isLoading || productOptionsQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading linked products...</p>
              ) : null}
              {linkedProductNames.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {linkedProductNames.map((name) => (
                      <tr key={name} className="border-border-fintech border-b last:border-0">
                        <td className="text-text-primary py-2.5">{name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-text-secondary text-base">No linked products.</p>
              )}
            </div>

            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">Used In</h3>
              {usedInQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading usage...</p>
              ) : null}
              {usedInQuery.isError ? (
                <p className="text-destructive text-base">
                  {usedInQuery.error instanceof Error
                    ? usedInQuery.error.message
                    : "Failed to load usage summary"}
                </p>
              ) : null}
              {usedInQuery.data ? (
                <div className="space-y-2">
                  <p className="text-text-secondary text-base">
                    Interactions:{" "}
                    <span className="text-text-primary">{usedInQuery.data.interactionsCount}</span>
                  </p>
                  <p className="text-text-secondary text-base">
                    Interactions linked to deals:{" "}
                    <span className="text-text-primary">
                      {usedInQuery.data.interactionsWithDealCount}
                    </span>
                  </p>
                  <p className="text-text-secondary text-base">
                    Campaign links (D3):{" "}
                    <span className="text-text-primary">{usedInQuery.data.campaignCount}</span>
                  </p>
                  <p className="text-text-secondary text-base">
                    Deals indirect (via interactions):{" "}
                    <span className="text-text-primary">{usedInQuery.data.dealsIndirectCount}</span>
                  </p>
                </div>
              ) : null}
            </div>
          </div>

          <TemplateFormDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            organizationId={organizationId}
            userId={userId}
            template={detailQuery.data}
          />
        </>
      ) : null}
    </section>
  );
}
