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
import { useCreateInteraction } from "@/features/interactions/hooks/useInteractions";

interface InteractionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  userId: string;
  personId: string;
  dealId?: string | null;
}

function toIsoDateTime(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function InteractionFormDialog({
  open,
  onOpenChange,
  organizationId,
  userId,
  personId,
  dealId = null,
}: InteractionFormDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const createInteractionMutation = useCreateInteraction();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InteractionFormInput, unknown, InteractionFormSchema>({
    resolver: zodResolver(interactionFormSchema),
    defaultValues: {
      person_id: personId,
      type: "note",
      summary: "",
      next_step_at: "",
      occurred_at: "",
      deal_id: dealId ?? "",
      campaign_id: "",
      template_id: "",
      product_id: "",
    },
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    setServerError(null);
    reset({
      person_id: personId,
      type: "note",
      summary: "",
      next_step_at: "",
      occurred_at: "",
      deal_id: dealId ?? "",
      campaign_id: "",
      template_id: "",
      product_id: "",
    });
  }, [open, personId, dealId, reset]);

  const type = watch("type");

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
        template_id: values.template_id,
        product_id: values.product_id,
        created_by: userId,
      });

      toast.success("Interaction added");
      reset({
        person_id: personId,
        type: "note",
        summary: "",
        next_step_at: "",
        occurred_at: "",
        deal_id: dealId ?? "",
        campaign_id: "",
        template_id: "",
        product_id: "",
      });
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="interaction-deal-id">Deal ID (optional)</Label>
              <Input id="interaction-deal-id" placeholder="GUID" {...register("deal_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-campaign-id">Campaign ID (optional)</Label>
              <Input id="interaction-campaign-id" placeholder="GUID" {...register("campaign_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-template-id">Template ID (optional)</Label>
              <Input id="interaction-template-id" placeholder="GUID" {...register("template_id")} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="interaction-product-id">Product ID (optional)</Label>
              <Input id="interaction-product-id" placeholder="GUID" {...register("product_id")} />
            </div>
          </div>

          {Object.keys(errors).length > 0 ? (
            <p className="text-destructive text-sm">Please review highlighted fields.</p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save interaction"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
