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
import {
  listCampaignProductOptions,
  listCampaignTemplateOptions,
} from "@/features/campaigns/services/campaignsService";
import { useQuery } from "@tanstack/react-query";
import { campaignKeys } from "@/lib/queryKeys";

const NONE_VALUE = "__none__";

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
    queryKey: [...campaignKeys.options(organizationId).queryKey, "product-options"],
    queryFn: async () => {
      const result = await listCampaignProductOptions(organizationId);
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
      productId: "",
      templateId: null,
    },
  });

  const selectedProductId = watch("productId");
  const selectedTemplateId = watch("templateId");
  const campaignType = watch("type");
  const projectSelectValue = selectedProductId.length > 0 ? selectedProductId : NONE_VALUE;
  const templateSelectValue =
    typeof selectedTemplateId === "string" && selectedTemplateId.length > 0
      ? selectedTemplateId
      : NONE_VALUE;

  const initialProductId = useMemo(() => {
    if (!campaign) {
      return "";
    }
    return linkedProductIdsQuery.data?.[0] ?? "";
  }, [campaign, linkedProductIdsQuery.data]);

  const initialTemplateId = useMemo(() => {
    if (!campaign) {
      return null;
    }
    return linkedTemplateIdsQuery.data?.[0] ?? null;
  }, [campaign, linkedTemplateIdsQuery.data]);

  useEffect(() => {
    if (campaign) {
      reset({
        name: campaign.name,
        type: campaign.type,
        productId: initialProductId,
        templateId: initialTemplateId,
      });
      return;
    }

    reset({
      name: "",
      type: "cold_outreach",
      productId: "",
      templateId: null,
    });
  }, [campaign, initialProductId, initialTemplateId, reset]);

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
          productIds: [values.productId],
          userId,
        });

        await syncTemplatesMutation.mutateAsync({
          organizationId,
          campaignId: updated.id,
          templateIds: values.templateId ? [values.templateId] : [],
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
          productIds: [values.productId],
          userId,
        });

        await syncTemplatesMutation.mutateAsync({
          organizationId,
          campaignId: created.id,
          templateIds: values.templateId ? [values.templateId] : [],
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
            <Label htmlFor="campaign-project">Project</Label>
            {productOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading projects...</p>
            ) : null}
            {!productOptionsQuery.isLoading && (productOptionsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No active projects available.</p>
            ) : null}
            <Select
              value={projectSelectValue}
              onValueChange={(value) =>
                setValue("productId", value === NONE_VALUE ? "" : value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="campaign-project">
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>Select a project</SelectItem>
                {(productOptionsQuery.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.productId ? (
              <p className="text-destructive text-sm">{errors.productId.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="campaign-template">Template (optional)</Label>
            {templateOptionsQuery.isLoading ? (
              <p className="text-text-secondary text-sm">Loading templates...</p>
            ) : null}
            {!templateOptionsQuery.isLoading && (templateOptionsQuery.data?.length ?? 0) === 0 ? (
              <p className="text-text-secondary text-sm">No active templates available.</p>
            ) : null}
            <Select
              value={templateSelectValue}
              onValueChange={(value) =>
                setValue("templateId", value === NONE_VALUE ? null : value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="campaign-template">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {(templateOptionsQuery.data ?? []).map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.templateId ? (
              <p className="text-destructive text-sm">{errors.templateId.message}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : isEditing ? "Save changes" : "Create campaign"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
