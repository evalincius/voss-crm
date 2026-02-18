import { useEffect, useState } from "react";
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
  interactionFormSchema,
  interactionTypeValues,
  type InteractionFormInput,
  type InteractionFormSchema,
} from "@/features/interactions/schemas/interactions.schema";
import {
  useCreateInteraction,
  useInteractionAssociationOptions,
  useInteractionDealContext,
} from "@/features/interactions/hooks/useInteractions";

interface InteractionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  personId: string;
  dealId?: string | null;
}

const NONE_VALUE = "__none__";

function toIsoDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toSelectValue(value: string | null | undefined): string {
  return value && value.length > 0 ? value : NONE_VALUE;
}

function buildDefaultValues(personId: string, dealId: string | null): InteractionFormInput {
  return {
    person_id: personId,
    type: "note",
    summary: "",
    next_step_at: "",
    occurred_at: "",
    deal_id: dealId ?? "",
    campaign_id: "",
    template_id: "",
    product_id: "",
  };
}

export function InteractionFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  personId,
  dealId = null,
}: InteractionFormDialogProps) {
  const isDealContext = !!dealId;
  const [serverError, setServerError] = useState<string | null>(null);
  const createInteractionMutation = useCreateInteraction();
  const dealContextQuery = useInteractionDealContext(isDealContext ? organizationId : null, dealId);
  const associationOptionsQuery = useInteractionAssociationOptions(organizationId, personId);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InteractionFormInput, unknown, InteractionFormSchema>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: buildDefaultValues(personId, dealId),
  });

  const type = watch("type");
  const selectedDealId = watch("deal_id") as string | null | undefined;
  const selectedCampaignId = watch("campaign_id") as string | null | undefined;
  const selectedProductId = watch("product_id") as string | null | undefined;

  const associationOptions = associationOptionsQuery.data;
  const dealContextCampaignName = dealContextQuery.data?.campaign_name ?? null;
  const fixedDealLabel =
    dealContextQuery.data?.deal_label ?? (dealId ? `#${dealId.slice(0, 8)}` : "");
  const fixedProductName = dealContextQuery.data?.product_name ?? "Loading...";
  const fixedCampaignId = dealContextQuery.data?.campaign_id ?? null;

  const isBlockingAssociationLoad = isDealContext && dealContextQuery.isLoading;

  useEffect(() => {
    if (!open) {
      return;
    }

    setServerError(null);
    reset(buildDefaultValues(personId, dealId));
  }, [open, personId, dealId, reset]);

  useEffect(() => {
    if (!open || !isDealContext || !dealContextQuery.data) {
      return;
    }

    const currentDealId = getValues("deal_id") ?? "";
    const currentProductId = getValues("product_id") ?? "";
    const currentCampaignId = getValues("campaign_id") ?? "";
    const targetDealId = dealContextQuery.data.deal_id;
    const targetProductId = dealContextQuery.data.product_id;
    const targetCampaignId = dealContextQuery.data.campaign_id ?? "";

    if (currentDealId !== targetDealId) {
      setValue("deal_id", targetDealId, { shouldValidate: true });
    }

    if (currentProductId !== targetProductId) {
      setValue("product_id", targetProductId, { shouldValidate: true });
    }

    if (currentCampaignId !== targetCampaignId) {
      setValue("campaign_id", targetCampaignId, { shouldValidate: true });
    }
  }, [open, isDealContext, dealContextQuery.data, getValues, setValue]);

  function handleDealSelection(value: string) {
    const nextDealId = value === NONE_VALUE ? "" : value;
    setValue("deal_id", nextDealId, { shouldValidate: true });

    if (value === NONE_VALUE) {
      setValue("campaign_id", "", { shouldValidate: true });
      setValue("product_id", "", { shouldValidate: true });
      return;
    }

    const selectedDeal = associationOptions?.deals.find(
      (dealOption) => dealOption.id === nextDealId,
    );
    if (!selectedDeal) {
      return;
    }

    setValue("campaign_id", selectedDeal.campaign_id ?? "", { shouldValidate: true });
    setValue("product_id", selectedDeal.product_id, { shouldValidate: true });
  }

  function handleCampaignSelection(value: string) {
    const nextCampaignId = value === NONE_VALUE ? "" : value;
    setValue("campaign_id", nextCampaignId, { shouldValidate: true });
    if (!isDealContext) {
      setValue("deal_id", "", { shouldValidate: true });
    }

    if (value === NONE_VALUE) {
      return;
    }

    const selectedCampaign = associationOptions?.campaigns.find(
      (campaignOption) => campaignOption.id === nextCampaignId,
    );

    if (!selectedCampaign?.product_id) {
      return;
    }

    setValue("product_id", selectedCampaign.product_id, { shouldValidate: true });
  }

  function handleProductSelection(value: string) {
    setValue("product_id", value === NONE_VALUE ? "" : value, {
      shouldValidate: true,
    });
    if (!isDealContext) {
      setValue("campaign_id", "", { shouldValidate: true });
      setValue("deal_id", "", { shouldValidate: true });
    }
  }

  async function onSubmit(values: InteractionFormSchema) {
    setServerError(null);

    try {
      await createInteractionMutation.mutateAsync({
        organization_id: organizationId,
        person_id: values.person_id,
        type: values.type,
        summary: values.summary,
        next_step_at: toIsoDateTime(values.next_step_at),
        occurred_at: toIsoDateTime(values.occurred_at) ?? new Date().toISOString(),
        deal_id: values.deal_id,
        campaign_id: values.campaign_id,
        template_id: null,
        product_id: values.product_id,
        created_by: userId,
      });

      toast.success("Interaction added");
      reset(buildDefaultValues(personId, dealId));
      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to add interaction");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add interaction</DialogTitle>
          <DialogDescription>
            Log timeline activity with optional references and next-step tracking.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <input type="hidden" {...register("person_id")} />
          <input type="hidden" {...register("deal_id")} />
          <input type="hidden" {...register("campaign_id")} />
          <input type="hidden" {...register("template_id")} />
          <input type="hidden" {...register("product_id")} />

          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="interaction-type">Type</Label>
            <Select
              value={type}
              onValueChange={(value) =>
                setValue("type", value as InteractionFormSchema["type"], { shouldValidate: true })
              }
            >
              <SelectTrigger id="interaction-type">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {interactionTypeValues.map((value) => (
                  <SelectItem key={value} value={value}>
                    {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interaction-summary">Summary</Label>
            <textarea
              id="interaction-summary"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-24 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("summary")}
            />
            {errors.summary ? (
              <p className="text-destructive text-sm">{errors.summary.message}</p>
            ) : null}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interaction-occurred-at">Occurred at</Label>
              <Input
                id="interaction-occurred-at"
                type="datetime-local"
                {...register("occurred_at")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-next-step">Next step at</Label>
              <Input
                id="interaction-next-step"
                type="datetime-local"
                {...register("next_step_at")}
              />
            </div>
          </div>

          {isDealContext && dealContextQuery.isLoading ? (
            <p className="text-text-secondary text-sm">Loading deal associations...</p>
          ) : null}

          {isDealContext && dealContextQuery.isError ? (
            <p className="text-destructive text-sm">
              {dealContextQuery.error instanceof Error
                ? dealContextQuery.error.message
                : "Failed to load deal context"}
            </p>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interaction-deal">Deal</Label>
              {isDealContext ? (
                <Input id="interaction-deal" value={fixedDealLabel} disabled />
              ) : (
                <Select value={toSelectValue(selectedDealId)} onValueChange={handleDealSelection}>
                  <SelectTrigger id="interaction-deal">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {(associationOptions?.deals ?? []).map((dealOption) => (
                      <SelectItem key={dealOption.id} value={dealOption.id}>
                        {dealOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-campaign">Campaign</Label>
              {isDealContext && fixedCampaignId ? (
                <Input
                  id="interaction-campaign"
                  value={dealContextCampaignName ?? fixedCampaignId}
                  disabled
                />
              ) : (
                <Select
                  value={toSelectValue(selectedCampaignId)}
                  onValueChange={handleCampaignSelection}
                >
                  <SelectTrigger id="interaction-campaign">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {(associationOptions?.campaigns ?? []).map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-product">Product</Label>
              {isDealContext ? (
                <Input id="interaction-product" value={fixedProductName} disabled />
              ) : (
                <Select
                  value={toSelectValue(selectedProductId)}
                  onValueChange={handleProductSelection}
                >
                  <SelectTrigger id="interaction-product">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {(associationOptions?.products ?? []).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {!isDealContext && associationOptionsQuery.isLoading ? (
            <p className="text-text-secondary text-sm">Loading association options...</p>
          ) : null}

          {!isDealContext && associationOptionsQuery.isError ? (
            <p className="text-destructive text-sm">
              {associationOptionsQuery.error instanceof Error
                ? associationOptionsQuery.error.message
                : "Failed to load association options"}
            </p>
          ) : null}

          {Object.keys(errors).length > 0 ? (
            <p className="text-destructive text-sm">Please review highlighted fields.</p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || isBlockingAssociationLoad}
          >
            {isSubmitting ? "Saving..." : "Save interaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
