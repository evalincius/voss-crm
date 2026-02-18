import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
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
  campaignLeadConversionSchema,
  type CampaignLeadConversionInput,
  type CampaignLeadConversionSchema,
} from "@/features/campaigns/schemas/campaigns.schema";
import { useConvertCampaignLead } from "@/features/campaigns/hooks/useCampaigns";
import { listCampaignProductOptions } from "@/features/campaigns/services/campaignsService";
import type { CampaignType } from "@/features/campaigns/types";
import { campaignKeys } from "@/lib/queryKeys";

interface CampaignLeadConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  defaultProductId?: string | null;
  campaign: {
    id: string;
    name: string;
    type: CampaignType;
  };
  memberPrefill?: {
    id: string;
    full_name: string;
    email: string | null;
  } | null;
  onSuccess?: () => void;
}

function defaultModeFromCampaignType(type: CampaignType): "contact_only" | "contact_and_deal" {
  if (type === "cold_outreach" || type === "warm_outreach") {
    return "contact_and_deal";
  }

  return "contact_only";
}

export function CampaignLeadConversionDialog({
  open,
  onOpenChange,
  organizationId,
  defaultProductId,
  campaign,
  memberPrefill,
  onSuccess,
}: CampaignLeadConversionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const convertMutation = useConvertCampaignLead();
  const isMemberConversion = !!memberPrefill;

  const productOptionsQuery = useQuery({
    queryKey: [...campaignKeys.options(organizationId).queryKey, "product-options"],
    queryFn: async () => {
      const result = await listCampaignProductOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load products");
      }

      return result.data;
    },
    enabled: open,
  });

  const hasProducts = (productOptionsQuery.data ?? []).length > 0;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignLeadConversionInput, unknown, CampaignLeadConversionSchema>({
    resolver: zodResolver(campaignLeadConversionSchema),
    defaultValues: {
      mode: isMemberConversion ? "deal_only" : defaultModeFromCampaignType(campaign.type),
      personId: memberPrefill?.id ?? null,
      fullName: memberPrefill?.full_name ?? null,
      email: memberPrefill?.email ?? null,
      phone: null,
      notes: null,
      lifecycle: "new",
      productId: defaultProductId ?? null,
      value: null,
      currency: null,
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    },
  });

  const watchedMode = watch("mode");
  const mode: CampaignLeadConversionSchema["mode"] =
    watchedMode === "deal_only" ||
    watchedMode === "contact_and_deal" ||
    watchedMode === "contact_only"
      ? watchedMode
      : defaultModeFromCampaignType(campaign.type);
  const watchedProductId = watch("productId");
  const selectedProductId =
    typeof watchedProductId === "string" && watchedProductId.length > 0
      ? watchedProductId
      : "__none__";
  const watchedCurrency = watch("currency");
  const selectedCurrency =
    typeof watchedCurrency === "string" && watchedCurrency.length > 0
      ? watchedCurrency
      : "__none__";
  const isDealMode = mode === "contact_and_deal" || mode === "deal_only";

  const modeOptions = useMemo(() => {
    if (isMemberConversion) {
      return [{ value: "deal_only", label: "Deal only" as const }];
    }

    return [
      { value: "contact_only", label: "Contact only" as const },
      { value: "contact_and_deal", label: "Contact + Deal" as const },
    ];
  }, [isMemberConversion]);

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      mode: isMemberConversion ? "deal_only" : defaultModeFromCampaignType(campaign.type),
      personId: memberPrefill?.id ?? null,
      fullName: memberPrefill?.full_name ?? null,
      email: memberPrefill?.email ?? null,
      phone: null,
      notes: null,
      lifecycle: "new",
      productId: defaultProductId ?? null,
      value: null,
      currency: null,
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    });
    setServerError(null);
  }, [campaign.type, isMemberConversion, memberPrefill, open, reset]);

  useEffect(() => {
    if (
      !isMemberConversion &&
      productOptionsQuery.isSuccess &&
      !hasProducts &&
      mode === "contact_and_deal"
    ) {
      setValue("mode", "contact_only", { shouldValidate: true });
    }
  }, [hasProducts, isMemberConversion, mode, productOptionsQuery.isSuccess, setValue]);

  useEffect(() => {
    if (!open || !defaultProductId || !productOptionsQuery.isSuccess) {
      return;
    }

    const hasSelectedProduct = typeof watchedProductId === "string" && watchedProductId.length > 0;
    if (hasSelectedProduct) {
      return;
    }

    const hasDefaultOption = (productOptionsQuery.data ?? []).some(
      (product) => product.id === defaultProductId,
    );
    if (!hasDefaultOption) {
      return;
    }

    setValue("productId", defaultProductId, {
      shouldValidate: true,
      shouldDirty: false,
      shouldTouch: false,
    });
  }, [
    defaultProductId,
    open,
    productOptionsQuery.data,
    productOptionsQuery.isSuccess,
    setValue,
    watchedProductId,
  ]);

  async function onSubmit(values: CampaignLeadConversionSchema) {
    setServerError(null);

    try {
      const result = await convertMutation.mutateAsync({
        organizationId,
        campaignId: campaign.id,
        mode: values.mode,
        personId: values.personId,
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        notes: values.notes,
        lifecycle: values.lifecycle,
        productId: values.productId,
        value: values.value,
        currency: values.currency,
        nextStepAt: values.nextStepAt ? new Date(values.nextStepAt).toISOString() : null,
        dealNotes: values.dealNotes,
        interactionSummary: values.interactionSummary,
        interactionType: values.interactionType,
      });

      if (result.result.reused_existing_person) {
        toast.info("Existing contact reused");
      }

      if (result.result.created_deal && result.result.had_open_duplicate) {
        toast.warning("Deal created. Similar open deal already exists for this person + product.");
      }

      if (result.result.created_deal) {
        toast.success("Lead converted to deal");
      } else {
        toast.success("Lead converted to contact");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to convert lead");
    }
  }

  const submitDisabled = isSubmitting || convertMutation.isPending || (isDealMode && !hasProducts);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convert lead</DialogTitle>
          <DialogDescription>
            {isMemberConversion
              ? `Create a deal for this member in ${campaign.name}.`
              : `Capture a new lead in ${campaign.name} and optionally create a deal.`}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          {!isMemberConversion ? (
            <div className="space-y-2">
              <Label htmlFor="campaign-convert-mode">Conversion mode</Label>
              <Select
                value={mode}
                onValueChange={(value) =>
                  setValue("mode", value as CampaignLeadConversionSchema["mode"], {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="campaign-convert-mode">
                  <SelectValue placeholder="Select conversion mode" />
                </SelectTrigger>
                <SelectContent>
                  {modeOptions.map((option) => (
                    <SelectItem
                      key={option.value}
                      value={option.value}
                      disabled={option.value === "contact_and_deal" && !hasProducts}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="border-border-fintech bg-bg-app text-text-secondary rounded-md border px-3 py-2 text-base">
              Conversion mode: <span className="text-text-primary font-medium">Deal only</span>
            </div>
          )}

          {isMemberConversion ? (
            <div className="space-y-2">
              <Label htmlFor="member-name">Name</Label>
              <Input id="member-name" value={memberPrefill?.full_name ?? ""} disabled />
              <input type="hidden" {...register("personId")} />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="lead-full-name">Full name</Label>
                <Input id="lead-full-name" placeholder="Jane Doe" {...register("fullName")} />
                {errors.fullName ? (
                  <p className="text-destructive text-sm">{errors.fullName.message}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="lead-email">Email</Label>
                  <Input
                    id="lead-email"
                    type="email"
                    placeholder="jane@company.com"
                    {...register("email")}
                  />
                  <p className="text-text-muted text-xs">
                    If this email already exists, existing contact is reused.
                  </p>
                  {errors.email ? (
                    <p className="text-destructive text-sm">{errors.email.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lead-phone">Phone</Label>
                  <Input id="lead-phone" placeholder="+1 ..." {...register("phone")} />
                </div>
              </div>
            </>
          )}

          {isDealMode ? (
            <>
              {!hasProducts ? (
                <p className="text-warning text-sm">
                  No active products available. Create a product first to enable deal conversion.
                </p>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="deal-product">Product</Label>
                <Select
                  value={selectedProductId}
                  onValueChange={(value) =>
                    setValue("productId", value === "__none__" ? null : value, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger id="deal-product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
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

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="deal-value">Value</Label>
                  <Input id="deal-value" type="number" step="0.01" {...register("value")} />
                  {errors.value ? (
                    <p className="text-destructive text-sm">{errors.value.message}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deal-currency">Currency</Label>
                  <Select
                    value={selectedCurrency}
                    onValueChange={(value) =>
                      setValue("currency", value === "__none__" ? null : value, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <SelectTrigger id="deal-currency">
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">None</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-next-step">Next step at</Label>
                <Input id="deal-next-step" type="datetime-local" {...register("nextStepAt")} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deal-notes">Deal notes</Label>
                <textarea
                  id="deal-notes"
                  className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
                  {...register("dealNotes")}
                />
              </div>
            </>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="interaction-summary">Activity summary (optional)</Label>
            <textarea
              id="interaction-summary"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("interactionSummary")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitDisabled}>
            {isSubmitting || convertMutation.isPending ? "Converting..." : "Convert lead"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
