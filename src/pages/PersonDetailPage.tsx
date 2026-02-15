import { useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Button } from "@/components/ui/button";
import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { usePersonDetail } from "@/features/people/hooks/usePeople";
import { PersonDetailHeader } from "@/features/people/components/PersonDetailHeader";
import { PersonRelatedPanels } from "@/features/people/components/PersonRelatedPanels";
import { InteractionsTimeline } from "@/features/interactions/components/InteractionsTimeline";
import { InteractionFormDialog } from "@/features/interactions/components/InteractionFormDialog";

function shouldOpenInteractionDialog(state: unknown): boolean {
  if (!state || typeof state !== "object") {
    return false;
  }

  return (state as { openInteractionDialog?: unknown }).openInteractionDialog === true;
}

export function PersonDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const { currentOrganization, user } = useAuth();
  const navigate = useNavigate();
  const [isInteractionDialogOpen, setIsInteractionDialogOpen] = useState(false);
  const personQuery = usePersonDetail(currentOrganization?.id ?? null, id ?? null);

  useEffect(() => {
    if (shouldOpenInteractionDialog(location.state)) {
      setIsInteractionDialogOpen(true);
    }
  }, [location.state]);

  if (!currentOrganization || !user || !id) {
    return <PageLoader />;
  }

  return (
    <section className="space-y-4">
      <Button type="button" variant="secondary" className="w-fit" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      <h2 className="font-heading text-text-primary text-2xl font-bold">Person Detail</h2>

      {personQuery.isLoading ? (
        <p className="text-text-secondary text-base">Loading person...</p>
      ) : null}

      {personQuery.isError ? (
        <p className="text-destructive text-base">
          {personQuery.error instanceof Error ? personQuery.error.message : "Failed to load person"}
        </p>
      ) : null}

      {!personQuery.isLoading && !personQuery.isError && !personQuery.data ? (
        <p className="text-text-secondary text-base">Person not found.</p>
      ) : null}

      {personQuery.data ? (
        <>
          <PersonDetailHeader
            person={personQuery.data}
            onAddInteraction={() => setIsInteractionDialogOpen(true)}
          />
          <InteractionsTimeline
            organizationId={currentOrganization.id}
            personId={personQuery.data.id}
          />
          <PersonRelatedPanels
            organizationId={currentOrganization.id}
            personId={personQuery.data.id}
          />
          <InteractionFormDialog
            open={isInteractionDialogOpen}
            onOpenChange={setIsInteractionDialogOpen}
            organizationId={currentOrganization.id}
            userId={user.id}
            personId={personQuery.data.id}
          />
        </>
      ) : null}
    </section>
  );
}
