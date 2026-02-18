import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { Button } from "@/components/ui/button";
import { DealsBoard } from "@/features/deals/components/DealsBoard";
import { DealsFilters } from "@/features/deals/components/DealsFilters";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DealDrawer } from "@/features/deals/components/DealDrawer";
import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";
import { listAllDealsForExport } from "@/features/deals/services/dealsService";
import { useDealsList, useUpdateDealStage } from "@/features/deals/hooks/useDeals";
import { generateCsv, downloadCsv, type CsvColumn } from "@/lib/csvExport";
import {
  DEAL_STAGE_LABELS,
  QUICK_ADD_INTENTS,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";
import type { DealCardData, DealStage } from "@/features/deals/types";

const dealsCsvColumns: CsvColumn<DealCardData>[] = [
  { header: "Person", accessor: (r) => r.person_name },
  { header: "Product", accessor: (r) => r.product_name },
  { header: "Stage", accessor: (r) => DEAL_STAGE_LABELS[r.stage] },
  { header: "Value", accessor: (r) => (r.value != null ? String(r.value) : "") },
  { header: "Currency", accessor: (r) => r.currency ?? "" },
  { header: "Next Step At", accessor: (r) => r.next_step_at ?? "" },
  { header: "Notes", accessor: (r) => r.notes ?? "" },
  { header: "Created", accessor: (r) => r.created_at },
  { header: "Updated", accessor: (r) => r.updated_at },
];

function readQuickAddState(state: unknown): QuickAddNavigationState["quickAdd"] | null {
  if (!state || typeof state !== "object") return null;
  if (!("quickAdd" in state)) return null;

  const quickAdd = (state as { quickAdd?: unknown }).quickAdd;
  if (!quickAdd || typeof quickAdd !== "object") return null;

  const intent = (quickAdd as { intent?: unknown }).intent;
  const organizationId = (quickAdd as { organization_id?: unknown }).organization_id;

  if (typeof intent !== "string" || typeof organizationId !== "string") return null;

  const validIntents = Object.values(QUICK_ADD_INTENTS);
  if (!validIntents.includes(intent as QuickAddIntent)) return null;

  return { intent: intent as QuickAddIntent, organization_id: organizationId };
}

export function DealsPage() {
  const { currentOrganization, user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [productId, setProductId] = useState<string | null>(searchParams.get("product_id"));
  const [personSearch, setPersonSearch] = useState("");
  const [isDealDialogOpen, setIsDealDialogOpen] = useState(false);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const [interactionContext, setInteractionContext] = useState<{
    dealId: string;
    personId: string;
  } | null>(null);

  const organizationId = currentOrganization?.id ?? null;

  const dealsQuery = useDealsList(
    organizationId ? { organizationId, productId, personSearch } : null,
  );

  const updateStageMutation = useUpdateDealStage();

  // Quick Add detection
  useEffect(() => {
    const quickAdd = readQuickAddState(location.state);
    if (quickAdd?.intent === QUICK_ADD_INTENTS.DEAL) {
      setIsDealDialogOpen(true);
      window.history.replaceState({}, "");
    }
  }, [location.state]);

  const handleSelectDeal = useCallback((dealId: string) => {
    setSelectedDealId(dealId);
  }, []);

  const handleStageChange = useCallback(
    async (dealId: string, stage: DealStage) => {
      if (!organizationId) return;

      try {
        await updateStageMutation.mutateAsync({ dealId, stage, organizationId });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update deal stage");
        throw error;
      }
    },
    [organizationId, updateStageMutation],
  );

  const handlePersonSearchChange = useCallback((search: string) => {
    setPersonSearch(search);
  }, []);

  async function handleExport() {
    if (!organizationId) return;
    setIsExporting(true);
    try {
      const result = await listAllDealsForExport(organizationId);
      if (result.error || !result.data) {
        toast.error(result.error ?? "Failed to export deals");
        return;
      }
      const csv = generateCsv(dealsCsvColumns, result.data);
      downloadCsv(csv, `deals-${new Date().toISOString().slice(0, 10)}.csv`);
      toast.success(`Exported ${result.data.length} deals`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
  }

  const handleAddInteraction = useCallback((dealId: string, personId: string) => {
    setInteractionContext({ dealId, personId });
    setIsInteractionDialogOpen(true);
  }, []);

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-text-primary text-2xl font-bold">Deals</h2>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void handleExport()} disabled={isExporting}>
            <Download className="mr-1.5 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
          <Button onClick={() => setIsDealDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Deal
          </Button>
        </div>
      </div>

      <DealsFilters
        organizationId={currentOrganization.id}
        productId={productId}
        personSearch={personSearch}
        onProductChange={setProductId}
        onPersonSearchChange={handlePersonSearchChange}
      />

      {dealsQuery.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-text-secondary text-base">Loading deals...</p>
        </div>
      ) : dealsQuery.isError ? (
        <div className="card-surface bg-bg-surface p-6">
          <p className="text-destructive text-base">Failed to load deals.</p>
        </div>
      ) : (
        <DealsBoard
          deals={dealsQuery.data ?? []}
          onSelectDeal={handleSelectDeal}
          onStageChange={handleStageChange}
        />
      )}

      <DealFormDialog
        open={isDealDialogOpen}
        onOpenChange={setIsDealDialogOpen}
        organizationId={currentOrganization.id}
        userId={user.id}
      />

      <DealDrawer
        open={!!selectedDealId}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
        organizationId={currentOrganization.id}
        dealId={selectedDealId}
        onAddInteraction={handleAddInteraction}
      />

      {interactionContext ? (
        <InteractionFormDialog
          open={isInteractionDialogOpen}
          onOpenChange={(open) => {
            setIsInteractionDialogOpen(open);
            if (!open) setInteractionContext(null);
          }}
          organizationId={currentOrganization.id}
          userId={user.id}
          personId={interactionContext.personId}
          dealId={interactionContext.dealId}
        />
      ) : null}
    </section>
  );
}
