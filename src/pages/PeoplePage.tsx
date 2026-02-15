import { useLocation } from "react-router";
import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PeopleListView } from "@/features/people/components/PeopleListView";
import {
  QUICK_ADD_INTENTS,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";

function readQuickAddIntent(state: unknown): QuickAddIntent | undefined {
  if (!state || typeof state !== "object" || !("quickAdd" in state)) {
    return undefined;
  }

  const quickAdd = (state as { quickAdd?: unknown }).quickAdd;
  if (!quickAdd || typeof quickAdd !== "object") {
    return undefined;
  }

  const intent = (quickAdd as { intent?: unknown }).intent;
  const organizationId = (quickAdd as { organization_id?: unknown }).organization_id;

  if (typeof intent !== "string" || typeof organizationId !== "string") {
    return undefined;
  }

  const intents = Object.values(QUICK_ADD_INTENTS);
  if (!intents.includes(intent as QuickAddIntent)) {
    return undefined;
  }

  return intent as QuickAddIntent;
}

export function PeoplePage() {
  const location = useLocation();
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  const state = location.state as QuickAddNavigationState | undefined;
  const quickAddIntent = readQuickAddIntent(state);
  const quickAddProps = quickAddIntent ? { quickAddIntent } : {};

  return (
    <PeopleListView organizationId={currentOrganization.id} userId={user.id} {...quickAddProps} />
  );
}
