import { useEffect, useState } from "react";
import { Link } from "react-router";
import { formatDistanceToNow } from "date-fns";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEAL_STAGE_LABELS, DEAL_STAGE_VALUES, ROUTES } from "@/lib/constants";
import { useDealDetail, useDealInteractions, useUpdateDeal } from "@/features/deals/hooks/useDeals";
import type { DealStage } from "@/features/deals/types";
import { toast } from "sonner";

interface DealDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  dealId: string | null;
  onAddInteraction: (dealId: string, personId: string) => void;
}

export function DealDrawer({
  open,
  onOpenChange,
  organizationId,
  dealId,
  onAddInteraction,
}: DealDrawerProps) {
  const dealQuery = useDealDetail(open ? organizationId : null, open ? dealId : null);
  const interactionsQuery = useDealInteractions(open ? organizationId : null, open ? dealId : null);
  const updateDealMutation = useUpdateDeal();

  const deal = dealQuery.data;

  const [stage, setStage] = useState<DealStage>("prospect");
  const [value, setValue] = useState("");
  const [currency, setCurrency] = useState("");
  const [nextStepAt, setNextStepAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (deal) {
      setStage(deal.stage);
      setValue(deal.value != null ? String(deal.value) : "");
      setCurrency(deal.currency ?? "");
      setNextStepAt(
        deal.next_step_at ? new Date(deal.next_step_at).toISOString().slice(0, 16) : "",
      );
      setNotes(deal.notes ?? "");
    }
  }, [deal]);

  async function handleSave() {
    if (!dealId) return;

    try {
      await updateDealMutation.mutateAsync({
        id: dealId,
        stage,
        value: value.trim() ? Number(value) : null,
        currency: currency.trim() || null,
        next_step_at: nextStepAt ? new Date(nextStepAt).toISOString() : null,
        notes: notes.trim() || null,
      });
      toast.success("Deal updated");
    } catch {
      toast.error("Failed to update deal");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {deal ? (
              <Link
                to={`${ROUTES.PEOPLE}/${deal.person_id}`}
                className="text-primary hover:underline"
              >
                {deal.person_name}
              </Link>
            ) : (
              "Loading..."
            )}
          </SheetTitle>
          <SheetDescription>
            {deal ? (
              <span className="flex items-center gap-2">
                <Badge variant="secondary">{deal.product_name}</Badge>
                <Badge variant="outline">{DEAL_STAGE_LABELS[deal.stage]}</Badge>
              </span>
            ) : null}
          </SheetDescription>
        </SheetHeader>

        {deal ? (
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="drawer-stage">Stage</Label>
              <Select value={stage} onValueChange={(v) => setStage(v as DealStage)}>
                <SelectTrigger id="drawer-stage">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEAL_STAGE_VALUES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEAL_STAGE_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="drawer-value">Value</Label>
                <Input
                  id="drawer-value"
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="drawer-currency">Currency</Label>
                <Select
                  value={currency || "__none__"}
                  onValueChange={(v) => setCurrency(v === "__none__" ? "" : v)}
                >
                  <SelectTrigger id="drawer-currency">
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
              <Label htmlFor="drawer-next-step">Next step at</Label>
              <Input
                id="drawer-next-step"
                type="datetime-local"
                value={nextStepAt}
                onChange={(e) => setNextStepAt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="drawer-notes">Notes</Label>
              <textarea
                id="drawer-notes"
                className="border-input bg-background placeholder:text-muted-foreground focus:ring-ring min-h-20 w-full rounded-md border px-3 py-2 text-base focus:ring-2 focus:outline-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button onClick={handleSave} className="w-full" disabled={updateDealMutation.isPending}>
              {updateDealMutation.isPending ? "Saving..." : "Save changes"}
            </Button>

            <div className="border-border space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-text-primary text-sm font-semibold">Interactions</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddInteraction(deal.id, deal.person_id)}
                >
                  Add interaction
                </Button>
              </div>

              {interactionsQuery.isLoading ? (
                <p className="text-text-secondary text-sm">Loading...</p>
              ) : null}

              {(interactionsQuery.data ?? []).length === 0 && !interactionsQuery.isLoading ? (
                <p className="text-text-secondary text-sm">No interactions linked to this deal.</p>
              ) : null}

              <div className="space-y-2">
                {(interactionsQuery.data ?? []).map((interaction) => (
                  <div key={interaction.id} className="border-border rounded border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs capitalize">
                        {interaction.type}
                      </Badge>
                      <span className="text-text-secondary text-xs tabular-nums">
                        {formatDistanceToNow(new Date(interaction.occurred_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p className="text-text-secondary mt-1 line-clamp-2">{interaction.summary}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
