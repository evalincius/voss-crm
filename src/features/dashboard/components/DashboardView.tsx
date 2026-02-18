import { useState } from "react";
import { DealDrawer } from "@/features/deals/components/DealDrawer";
import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";
import { FollowUpsWidget } from "@/features/dashboard/components/FollowUpsWidget";
import { StaleDealsWidget } from "@/features/dashboard/components/StaleDealsWidget";
import { PipelineSnapshotWidget } from "@/features/dashboard/components/PipelineSnapshotWidget";
import { TopRankingsWidget } from "@/features/dashboard/components/TopRankingsWidget";

interface DashboardViewProps {
  organizationId: string;
  userId: string;
}

export function DashboardView({ organizationId, userId }: DashboardViewProps) {
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [staleThreshold, setStaleThreshold] = useState(14);
  const [interactionTarget, setInteractionTarget] = useState<{
    dealId: string;
    personId: string;
  } | null>(null);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Dashboard</h2>
        <p className="text-text-secondary text-base">Your daily execution overview.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <FollowUpsWidget organizationId={organizationId} onSelectDeal={setSelectedDealId} />
        </div>
        <div className="lg:col-span-5">
          <StaleDealsWidget
            organizationId={organizationId}
            threshold={staleThreshold}
            onThresholdChange={setStaleThreshold}
            onSelectDeal={setSelectedDealId}
          />
        </div>
        <div className="lg:col-span-5">
          <PipelineSnapshotWidget organizationId={organizationId} />
        </div>
        <div className="lg:col-span-7">
          <TopRankingsWidget organizationId={organizationId} />
        </div>
      </div>

      <DealDrawer
        open={selectedDealId !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedDealId(null);
        }}
        organizationId={organizationId}
        dealId={selectedDealId}
        onAddInteraction={(dealId, personId) => {
          setInteractionTarget({ dealId, personId });
        }}
      />

      {interactionTarget ? (
        <InteractionFormDialog
          open
          onOpenChange={(open) => {
            if (!open) setInteractionTarget(null);
          }}
          organizationId={organizationId}
          userId={userId}
          personId={interactionTarget.personId}
          dealId={interactionTarget.dealId}
        />
      ) : null}
    </section>
  );
}
