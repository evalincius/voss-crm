import { useState } from "react";
import { ArrowLeft, Archive, Undo2 } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  useArchiveProduct,
  useProductDetail,
  useProductPerformanceSummary,
  useUnarchiveProduct,
} from "@/features/library/products/hooks/useProducts";
import { ProductFormDialog } from "@/features/library/products/components/ProductFormDialog";
import { ROUTES } from "@/lib/constants";

interface ProductDetailViewProps {
  organizationId: string;
  userId: string;
  productId: string;
}

const stageLabels: Record<string, string> = {
  prospect: "Prospect",
  offer_sent: "Offer Sent",
  interested: "Interested",
  objection: "Objection",
  validated: "Validated",
  lost: "Lost",
};

export function ProductDetailView({ organizationId, userId, productId }: ProductDetailViewProps) {
  const navigate = useNavigate();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const detailQuery = useProductDetail(organizationId, productId);
  const performanceQuery = useProductPerformanceSummary(organizationId, productId);
  const archiveMutation = useArchiveProduct();
  const unarchiveMutation = useUnarchiveProduct();

  async function onArchiveToggle() {
    if (!detailQuery.data) {
      return;
    }

    try {
      if (detailQuery.data.is_archived) {
        await unarchiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Product restored");
      } else {
        await archiveMutation.mutateAsync(detailQuery.data.id);
        toast.success("Product archived");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update product");
    }
  }

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h2 className="font-heading text-text-primary text-2xl font-bold">
        Library - Product Detail
      </h2>

      {detailQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading product...</p>
      ) : null}
      {detailQuery.isError ? (
        <p className="text-destructive text-base">
          {detailQuery.error instanceof Error
            ? detailQuery.error.message
            : "Failed to load product"}
        </p>
      ) : null}

      {!detailQuery.isLoading && !detailQuery.isError && !detailQuery.data ? (
        <p className="text-text-secondary text-base">Product not found.</p>
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
                  {detailQuery.data.description ?? "No description"}
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
                <Button asChild type="button">
                  <Link
                    to={`${ROUTES.DEALS}?product_id=${encodeURIComponent(detailQuery.data.id)}`}
                  >
                    View on Deals board
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">
                Pipeline by stage
              </h3>
              {performanceQuery.isLoading ? (
                <p className="text-text-secondary text-base">Loading performance...</p>
              ) : null}
              {performanceQuery.isError ? (
                <p className="text-destructive text-base">
                  {performanceQuery.error instanceof Error
                    ? performanceQuery.error.message
                    : "Failed to load performance"}
                </p>
              ) : null}
              {performanceQuery.data ? (
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(performanceQuery.data.stageCounts).map(([stage, count]) => (
                    <div
                      key={stage}
                      className="border-border-fintech bg-bg-app rounded-md border px-3 py-2"
                    >
                      <p className="text-text-secondary text-sm">{stageLabels[stage] ?? stage}</p>
                      <p className="text-text-primary text-base font-semibold">{count}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="card-surface bg-bg-surface space-y-3 p-4">
              <h3 className="font-heading text-text-primary text-lg font-bold">
                Related campaigns
              </h3>
              {performanceQuery.data?.relatedCampaigns.length ? (
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-2 font-medium">Name</th>
                      <th className="text-text-secondary pb-2 text-right font-medium">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceQuery.data.relatedCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="border-border-fintech border-b last:border-0"
                      >
                        <td className="py-2.5">
                          <Link
                            className="text-primary hover:underline"
                            to={`${ROUTES.CAMPAIGNS}/${campaign.id}`}
                          >
                            {campaign.name}
                          </Link>
                        </td>
                        <td className="text-text-secondary py-2.5 text-right capitalize">
                          {campaign.type.replace(/_/g, " ")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-text-secondary text-base">No campaigns linked yet.</p>
              )}
            </div>
          </div>

          <div className="card-surface bg-bg-surface space-y-3 p-4">
            <h3 className="font-heading text-text-primary text-lg font-bold">Linked templates</h3>
            {performanceQuery.data?.linkedTemplates.length ? (
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-border-fintech border-b">
                    <th className="text-text-secondary pb-2 font-medium">Name</th>
                    <th className="text-text-secondary pb-2 font-medium">Category</th>
                    <th className="text-text-secondary pb-2 text-right font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {performanceQuery.data.linkedTemplates.map((template) => (
                    <tr key={template.id} className="border-border-fintech border-b last:border-0">
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
            ) : (
              <p className="text-text-secondary text-base">No templates linked yet.</p>
            )}
          </div>

          <ProductFormDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            organizationId={organizationId}
            userId={userId}
            product={detailQuery.data}
          />
        </>
      ) : null}
    </section>
  );
}
