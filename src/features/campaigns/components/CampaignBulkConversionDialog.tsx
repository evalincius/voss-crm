import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  campaignBulkConversionSchema,
  type CampaignBulkConversionInput,
  type CampaignBulkConversionSchema,
} from "@/features/campaigns/schemas/campaigns.schema";
import {
  useBulkCampaignDealDuplicatePreview,
  useBulkConvertCampaignMembersToDeals,
} from "@/features/campaigns/hooks/useCampaigns";
import { listCampaignProductOptions } from "@/features/campaigns/services/campaignsService";
import { campaignKeys } from "@/lib/queryKeys";

interface CampaignBulkConversionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  campaign: {
    id: string;
    name: string;
  };
  members: Array<{
    id: string;
    full_name: string;
    email: string | null;
  }>;
  onSuccess?: () => void;
}

export function CampaignBulkConversionDialog({
  open,
  onOpenChange,
  organizationId,
  campaign,
  members,
  onSuccess,
}: CampaignBulkConversionDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const convertMutation = useBulkConvertCampaignMembersToDeals();

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

  const memberIds = useMemo(() => members.map((member) => member.id), [members]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CampaignBulkConversionInput, unknown, CampaignBulkConversionSchema>({
    resolver: zodResolver(campaignBulkConversionSchema),
    defaultValues: {
      personIds: memberIds,
      productId: "",
      duplicateStrategy: "create_all",
      value: null,
      currency: null,
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    reset({
      personIds: memberIds,
      productId: "",
      duplicateStrategy: "create_all",
      value: null,
      currency: null,
      nextStepAt: null,
      dealNotes: null,
      interactionSummary: null,
      interactionType: null,
    });
    setServerError(null);
  }, [memberIds, open, reset]);

  const watchedProductId = watch("productId");
  const selectedProductId = typeof watchedProductId === "string" ? watchedProductId : "";
  const watchedDuplicateStrategy = watch("duplicateStrategy");
  const duplicateStrategy =
    watchedDuplicateStrategy === "skip_duplicates" ? "skip_duplicates" : "create_all";
  const watchedCurrency = watch("currency");
  const selectedCurrency =
    typeof watchedCurrency === "string" && watchedCurrency.length > 0
      ? watchedCurrency
      : "__none__";

  const previewInput =
    open && selectedProductId && selectedProductId.length > 0
      ? {
          organizationId,
          campaignId: campaign.id,
          personIds: memberIds,
          productId: selectedProductId,
        }
      : null;

  const duplicatePreviewQuery = useBulkCampaignDealDuplicatePreview(previewInput);
  const duplicateRows = duplicatePreviewQuery.data ?? [];

  async function onSubmit(values: CampaignBulkConversionSchema) {
    setServerError(null);

    try {
      const result = await convertMutation.mutateAsync({
        organizationId,
        campaignId: campaign.id,
        personIds: values.personIds,
        productId: values.productId,
        duplicateStrategy: values.duplicateStrategy,
        value: values.value,
        currency: values.currency,
        nextStepAt: values.nextStepAt ? new Date(values.nextStepAt).toISOString() : null,
        dealNotes: values.dealNotes,
        interactionSummary: values.interactionSummary,
        interactionType: values.interactionType,
      });

      toast.success(
        `Created ${result.result.created_deals} deal${result.result.created_deals === 1 ? "" : "s"}`,
      );

      if (result.result.skipped_duplicates > 0) {
        toast.info(`Skipped ${result.result.skipped_duplicates} duplicate conversion(s)`);
      }

      if (result.result.errors > 0) {
        toast.warning(
          `${result.result.errors} conversion(s) failed. See campaign activity for details.`,
        );
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to convert selected members");
    }
  }

  const submitDisabled =
    isSubmitting ||
    convertMutation.isPending ||
    memberIds.length === 0 ||
    !selectedProductId ||
    selectedProductId.length === 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Convert selected members</SheetTitle>
          <SheetDescription>
            Create deals in <span className="text-text-primary">{campaign.name}</span> for selected
            members.
          </SheetDescription>
        </SheetHeader>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="border-border-fintech bg-bg-app rounded-md border px-3 py-2">
            <p className="text-text-primary text-base font-medium">
              {memberIds.length} {memberIds.length === 1 ? "member" : "members"} selected
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-product">Product</Label>
            <Select
              value={
                selectedProductId && selectedProductId.length > 0 ? selectedProductId : "__none__"
              }
              onValueChange={(value) =>
                setValue("productId", value === "__none__" ? "" : value, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger id="bulk-product">
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

          {duplicatePreviewQuery.isLoading ? (
            <p className="text-text-secondary text-sm">Checking duplicates...</p>
          ) : null}

          {duplicateRows.length > 0 ? (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2">
              <p className="text-text-primary text-sm font-medium">
                {duplicateRows.length} selected member
                {duplicateRows.length === 1 ? " has" : "s have"} an open deal for this product.
              </p>
              <div className="mt-2 max-h-40 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-border-fintech border-b">
                      <th className="text-text-secondary pb-1 font-medium">Name</th>
                      <th className="text-text-secondary pb-1 text-right font-medium">Stage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {duplicateRows.map((row) => (
                      <tr
                        key={row.person_id}
                        className="border-border-fintech border-b last:border-0"
                      >
                        <td className="py-1.5">{row.full_name}</td>
                        <td className="py-1.5 text-right capitalize">{row.duplicate_stage}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="bulk-duplicate-strategy">Duplicate handling</Label>
            <Select
              value={duplicateStrategy}
              onValueChange={(value) =>
                setValue(
                  "duplicateStrategy",
                  value as CampaignBulkConversionSchema["duplicateStrategy"],
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              <SelectTrigger id="bulk-duplicate-strategy">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="create_all">Create all (including duplicates)</SelectItem>
                <SelectItem value="skip_duplicates">Skip duplicates</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bulk-value">Value</Label>
              <Input id="bulk-value" type="number" step="0.01" {...register("value")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-currency">Currency</Label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) =>
                  setValue("currency", value === "__none__" ? null : value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger id="bulk-currency">
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
            <Label htmlFor="bulk-next-step">Next step at</Label>
            <Input id="bulk-next-step" type="datetime-local" {...register("nextStepAt")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-deal-notes">Deal notes</Label>
            <textarea
              id="bulk-deal-notes"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("dealNotes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bulk-interaction-summary">Activity summary (optional)</Label>
            <textarea
              id="bulk-interaction-summary"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("interactionSummary")}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitDisabled}>
            {isSubmitting || convertMutation.isPending ? "Converting..." : "Convert selected"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
