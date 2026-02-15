import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  campaignFormSchema,
  campaignTypeValues,
  type CampaignFormInput,
  type CampaignFormSchema,
} from "@/features/campaigns/schemas/campaigns.schema";
import {
  useCampaignLinkedProductIds,
  useCampaignLinkedTemplateIds,
  useCreateCampaign,
  useSyncCampaignProducts,
  useSyncCampaignTemplates,
  useUpdateCampaign,
} from "@/features/campaigns/hooks/useCampaigns";
import type { Campaign } from "@/features/campaigns/types";
import { listCampaignTemplateOptions } from "@/features/campaigns/services/campaignsService";
import { useQuery } from "@tanstack/react-query";
import { listProductOptions } from "@/features/library/products/services/productsService";
import { productKeys } from "@/lib/queryKeys";

interface CampaignFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  campaign?: Campaign;
}

export function CampaignFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  campaign,
}: CampaignFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createCampaignMutation = useCreateCampaign();
  const updateCampaignMutation = useUpdateCampaign();
  const syncProductsMutation = useSyncCampaignProducts();
  const syncTemplatesMutation = useSyncCampaignTemplates();

  const productOptionsQuery = useQuery({
    queryKey: productKeys.options(organizationId).queryKey,
    queryFn: async () => {
      const result = await listProductOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load products");
      }
      return result.data;
    },
  });

  const templateOptionsQuery = useQuery({
    queryKey: ["campaigns", "template-options", organizationId],
    queryFn: async () => {
      const result = await listCampaignTemplateOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load templates");
      }
      return result.data;
    },
  });

  const linkedProductIdsQuery = useCampaignLinkedProductIds(
    campaign ? organizationId : null,
    campaign?.id ?? null,
  );

  const linkedTemplateIdsQuery = useCampaignLinkedTemplateIds(
    campaign ? organizationId : null,
    campaign?.id ?? null,
  );

  const isEditing = !!campaign;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignFormInput, unknown, CampaignFormSchema>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: campaign?.name ?? "",
      type: campaign?.type ?? "cold_outreach",
      productIds: [],
      templateIds: [],
    },
  });

  const selectedProductIds = watch("productIds");
  const selectedTemplateIds = watch("templateIds");
  const campaignType = watch("type");

  const initialProductIds = useMemo(() => {
    if (!campaign) {
      return [];
    }
    return linkedProductIdsQuery.data ?? [];
  }, [campaign, linkedProductIdsQuery.data]);

  const initialTemplateIds = useMemo(() => {
    if (!campaign) {
      return [];
    }
    return linkedTemplateIdsQuery.data ?? [];
  }, [campaign, linkedTemplateIdsQuery.data]);

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        type: campaign.type,
        productIds: initialProductIds,
        templateIds: initialTemplateIds,
      });
      return;
    }

    reset({
      name: "",
      type: "cold_outreach",
      productIds: [],
      templateIds: [],
    });
  }, [campaign, initialProductIds, initialTemplateIds, reset]);

  function toggleProduct(productId: string, checked: boolean) {
    const current = new Set(selectedProductIds ?? []);
    if (checked) {
      current.add(productId);
    } else {
      current.delete(productId);
    }
    setValue("productIds", Array.from(current), { shouldValidate: true });
  }

  function toggleTemplate(templateId: string, checked: boolean) {
    const current = new Set(selectedTemplateIds ?? []);
    if (checked) {
      current.add(templateId);
    } else {
      current.delete(templateId);
    }
    setValue("templateIds", Array.from(current), { shouldValidate: true });
  }

  async function onSubmit(values: CampaignFormSchema) {
    setServerError(null);

    try {
      if (isEditing && campaign) {
        const updated = await updateCampaignMutation.mutateAsync({
          id: campaign.id,
          name: values.name,
          type: values.type,
        });

        await syncProductsMutation.mutateAsync({
          organizationId,
          campaignId: updated.id,
          productIds: values.productIds,
          userId,
        });

        await syncTemplatesMutation.mutateAsync({
          organizationId,
          campaignId: updated.id,
          templateIds: values.templateIds,
          userId,
        });

        toast.success("Campaign updated");
      } else {
        const created = await createCampaignMutation.mutateAsync({
          organization_id: organizationId,
          name: values.name,
          type: values.type,
          created_by: userId,
        });

        await syncProductsMutation.mutateAsync({
          organizationId,
          campaignId: created.id,
          productIds: values.productIds,
          userId,
        });

        await syncTemplatesMutation.mutateAsync({
          organizationId,
          campaignId: created.id,
          templateIds: values.templateIds,
          userId,
        });

        toast.success("Campaign created");
      }

      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to save campaign");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit campaign" : "Create campaign"}</DialogTitle>
          <DialogDescription>
            Set up campaigns to organize outreach and track engagement.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="campaign-name">Name</Label>
            <Input id="campaign-name" {...register("name")} />
            {errors.name ? <p className="text-destructive text-sm">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-type">Type</Label>
            <Select
              value={campaignType}
              onValueChange={(value) =>
                setValue("type", value as CampaignFormSchema["type"], { shouldValidate: true })
              }
            >
              <SelectTrigger id="campaign-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {campaignTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Linked products</Label>
            {productOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading products...</p>
            ) : null}
            {!productOptionsQuery.isLoading && (productOptionsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No active products available.</p>
            ) : null}
            <div className="max-h-36 space-y-2 overflow-auto pr-1">
              {(productOptionsQuery.data ?? []).map((product) => {
                const checked = (selectedProductIds ?? []).includes(product.id);
                return (
                  <label key={product.id} className="flex items-center gap-2 text-base">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleProduct(product.id, event.target.checked)}
                    />
                    <span>{product.name}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Linked templates</Label>
            {templateOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading templates...</p>
            ) : null}
            {!templateOptionsQuery.isLoading && (templateOptionsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No active templates available.</p>
            ) : null}
            <div className="max-h-36 space-y-2 overflow-auto pr-1">
              {(templateOptionsQuery.data ?? []).map((template) => {
                const checked = (selectedTemplateIds ?? []).includes(template.id);
                return (
                  <label key={template.id} className="flex items-center gap-2 text-base">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleTemplate(template.id, event.target.checked)}
                    />
                    <span>{template.title}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create campaign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
