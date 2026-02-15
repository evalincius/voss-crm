import { useLocation } from "react-router";
import {
  QUICK_ADD_INTENTS,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";

interface CrmPlaceholderPageProps {
  title: string;
  description: string;
  expectedIntent?: QuickAddIntent;
}

function readQuickAddState(state: unknown): QuickAddNavigationState["quickAdd"] | null {
  if (!state || typeof state !== "object") {
    return null;
  }

  if (!("quickAdd" in state)) {
    return null;
  }

  const quickAdd = (state as { quickAdd?: unknown }).quickAdd;

  if (!quickAdd || typeof quickAdd !== "object") {
    return null;
  }

  const intent = (quickAdd as { intent?: unknown }).intent;
  const organizationId = (quickAdd as { organization_id?: unknown }).organization_id;

  if (typeof intent !== "string" || typeof organizationId !== "string") {
    return null;
  }

  const validIntents = Object.values(QUICK_ADD_INTENTS);
  if (!validIntents.includes(intent as QuickAddIntent)) {
    return null;
  }

  return { intent: intent as QuickAddIntent, organization_id: organizationId };
}

export function CrmPlaceholderPage({
  title,
  description,
  expectedIntent,
}: CrmPlaceholderPageProps) {
  const location = useLocation();
  const quickAdd = readQuickAddState(location.state);
  const isExpectedIntent = expectedIntent ? quickAdd?.intent === expectedIntent : false;

  return (
    <section className="space-y-4">
      <div className="card-surface bg-bg-surface p-6">
        <h2 className="font-heading text-text-primary mb-2 text-2xl font-bold">{title}</h2>
        <p className="text-text-secondary text-base">{description}</p>
      </div>

      {isExpectedIntent && quickAdd && (
        <div className="card-surface bg-bg-surface p-4">
          <p className="text-text-secondary text-base">
            Quick Add intent detected for organization <code>{quickAdd.organization_id}</code>.
          </p>
        </div>
      )}
    </section>
  );
}
