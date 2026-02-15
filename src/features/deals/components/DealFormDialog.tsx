import { useEffect, useState } from "react";
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
  dealFormSchema,
  type DealFormInput,
  type DealFormSchema,
} from "@/features/deals/schemas/deals.schema";
import { useCheckDuplicateDeal, useCreateDeal } from "@/features/deals/hooks/useDeals";
import { useProductOptions } from "@/features/library/products/hooks/useProducts";
import { searchPeopleForDeal } from "@/features/deals/services/dealsService";
import { listCampaignOptions } from "@/features/campaigns/services/campaignsService";
import { DEAL_STAGE_LABELS } from "@/lib/constants";

interface DealFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  personPrefill?: { id: string; full_name: string } | null;
  campaignPrefill?: { id: string; name: string } | null;
}

export function DealFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  personPrefill,
  campaignPrefill,
}: DealFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [personSearch, setPersonSearch] = useState("");
  const [debouncedPersonSearch, setDebouncedPersonSearch] = useState("");
  const [duplicateConfirmed, setDuplicateConfirmed] = useState(false);

  const createDealMutation = useCreateDeal();
  const productOptionsQuery = useProductOptions(organizationId);

  const campaignOptionsQuery = useQuery({
    queryKey: ["campaigns", "options", organizationId],
    queryFn: async () => {
      const result = await listCampaignOptions(organizationId);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to load campaigns");
      }
      return result.data;
    },
  });

  const peopleSearchQuery = useQuery({
    queryKey: ["people", "search-for-deal", organizationId, debouncedPersonSearch],
    queryFn: async () => {
      const result = await searchPeopleForDeal(organizationId, debouncedPersonSearch);
      if (result.error || !result.data) {
        throw new Error(result.error ?? "Failed to search people");
      }
      return result.data;
    },
    enabled: !personPrefill,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPersonSearch(personSearch), 300);
    return () => clearTimeout(timer);
  }, [personSearch]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DealFormInput, unknown, DealFormSchema>({
    resolver: zodResolver(dealFormSchema),
    defaultValues: {
      person_id: personPrefill?.id ?? "",
      product_id: "",
      campaign_id: campaignPrefill?.id ?? "",
      value: "",
      currency: "",
      next_step_at: "",
      notes: "",
      stage: "prospect",
    },
  });

  const selectedPersonId = watch("person_id");
  const selectedProductId = watch("product_id");
  const watchedCampaignId = watch("campaign_id");
  const campaignSelectValue =
    typeof watchedCampaignId === "string" && watchedCampaignId.length > 0
      ? watchedCampaignId
      : "__none__";

  const duplicateQuery = useCheckDuplicateDeal(
    selectedPersonId && selectedProductId ? organizationId : null,
    selectedPersonId || null,
    selectedProductId || null,
  );

  useEffect(() => {
    if (open) {
      reset({
        person_id: personPrefill?.id ?? "",
        product_id: "",
        campaign_id: campaignPrefill?.id ?? "",
        value: "",
        currency: "",
        next_step_at: "",
        notes: "",
        stage: "prospect",
      });
      setServerError(null);
      setDuplicateConfirmed(false);
      setPersonSearch("");
    }
  }, [open, personPrefill, campaignPrefill, reset]);

  async function onSubmit(values: DealFormSchema) {
    setServerError(null);

    if (duplicateQuery.data && !duplicateConfirmed) {
      return;
    }

    try {
      await createDealMutation.mutateAsync({
        organization_id: organizationId,
        person_id: values.person_id,
        product_id: values.product_id,
        campaign_id: values.campaign_id,
        value: values.value,
        currency: values.currency,
        next_step_at: values.next_step_at ? new Date(values.next_step_at).toISOString() : null,
        notes: values.notes,
        created_by: userId,
      });

      toast.success("Deal created");
      onOpenChange(false);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Failed to create deal");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create deal</DialogTitle>
          <DialogDescription>Create a new deal for a person and product.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          {serverError ? (
            <p className="text-destructive border-destructive/30 rounded-md border px-3 py-2 text-base">
              {serverError}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="deal-person">Person</Label>
            {personPrefill ? (
              <>
                <Input id="deal-person" value={personPrefill.full_name} disabled />
                <input type="hidden" {...register("person_id")} />
              </>
            ) : (
              <Select
                value={selectedPersonId}
                onValueChange={(value) => setValue("person_id", value, { shouldValidate: true })}
              >
                <SelectTrigger id="deal-person">
                  <SelectValue placeholder="Search and select person..." />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-1">
                    <Input
                      placeholder="Type to search..."
                      value={personSearch}
                      onChange={(e) => setPersonSearch(e.target.value)}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="h-8 text-sm"
                    />
                  </div>
                  {peopleSearchQuery.isLoading ? (
                    <p className="text-text-secondary px-2 py-3 text-center text-sm">
                      Searching...
                    </p>
                  ) : (peopleSearchQuery.data ?? []).length === 0 ? (
                    <p className="text-text-secondary px-2 py-3 text-center text-sm">
                      {personSearch.trim() ? "No people found" : "Start typing to search"}
                    </p>
                  ) : (
                    (peopleSearchQuery.data ?? []).map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.full_name} {person.email ? `(${person.email})` : ""}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {errors.person_id ? (
              <p className="text-destructive text-sm">{errors.person_id.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-product">Product</Label>
            <Select
              value={selectedProductId}
              onValueChange={(value) => {
                setValue("product_id", value, { shouldValidate: true });
                setDuplicateConfirmed(false);
              }}
            >
              <SelectTrigger id="deal-product">
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {(productOptionsQuery.data ?? []).map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.product_id ? (
              <p className="text-destructive text-sm">{errors.product_id.message}</p>
            ) : null}
          </div>

          {duplicateQuery.data && !duplicateConfirmed ? (
            <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-sm">
              <p className="text-text-primary font-medium">Duplicate deal found</p>
              <p className="text-text-secondary">
                An open deal already exists for this person + product (stage:{" "}
                {DEAL_STAGE_LABELS[duplicateQuery.data.stage]}).
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setDuplicateConfirmed(true)}
              >
                Create anyway
              </Button>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="deal-campaign">Campaign (optional)</Label>
            <Select
              value={campaignSelectValue}
              onValueChange={(value) =>
                setValue("campaign_id", value === "__none__" ? "" : value, { shouldValidate: true })
              }
            >
              <SelectTrigger id="deal-campaign">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {(campaignOptionsQuery.data ?? []).map((campaign) => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                value={(() => {
                  const v = watch("currency");
                  return typeof v === "string" && v.length > 0 ? v : "__none__";
                })()}
                onValueChange={(value) =>
                  setValue("currency", value === "__none__" ? "" : value, { shouldValidate: true })
                }
              >
                <SelectTrigger id="deal-currency">
                  <SelectValue placeholder="Select currency" />
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
            <Input id="deal-next-step" type="datetime-local" {...register("next_step_at")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="deal-notes">Notes</Label>
            <textarea
              id="deal-notes"
              className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-16 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
              {...register("notes")}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || (!!duplicateQuery.data && !duplicateConfirmed)}
          >
            {isSubmitting ? "Creating..." : "Create deal"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
