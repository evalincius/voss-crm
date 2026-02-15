import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { Button } from "@/components/ui/button";
import { DealsBoard } from "@/features/deals/components/DealsBoard";
import { DealsFilters } from "@/features/deals/components/DealsFilters";
import { DealFormDialog } from "@/features/deals/components/DealFormDialog";
import { DealDrawer } from "@/features/deals/components/DealDrawer";
import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";
import { useDealsList, useUpdateDealStage } from "@/features/deals/hooks/useDeals";
import {
  QUICK_ADD_INTENTS,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";
import type { DealStage } from "@/features/deals/types";

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
    (dealId: string, stage: DealStage) => {
      if (!organizationId) return;
      updateStageMutation.mutate({ dealId, stage, organizationId });
    },
    [organizationId, updateStageMutation],
  );

  const handlePersonSearchChange = useCallback((search: string) => {
    setPersonSearch(search);
  }, []);

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
        <Button onClick={() => setIsDealDialogOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Deal
        </Button>
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
        />
      ) : null}
    </section>
  );
}
