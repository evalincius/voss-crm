import { useMemo } from "react";
import { useLocation, useSearchParams } from "react-router";
import { PageLoader } from "@/components/shared/PageLoader";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProductsListView } from "@/features/library/products/components/ProductsListView";
import { TemplatesListView } from "@/features/library/templates/components/TemplatesListView";
import {
  QUICK_ADD_INTENTS,
  type QuickAddIntent,
  type QuickAddNavigationState,
} from "@/lib/constants";

type LibraryTab = "products" | "templates";

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

function resolveTab(value: string | null): LibraryTab {
  return value === "templates" ? "templates" : "products";
}

export function LibraryView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  const explicitTab = searchParams.get("tab");
  const quickAddIntent = readQuickAddIntent(
    (location.state as QuickAddNavigationState | undefined) ?? null,
  );

  const currentTab = useMemo<LibraryTab>(() => {
    if (explicitTab === "products" || explicitTab === "templates") {
      return explicitTab;
    }

    if (quickAddIntent === QUICK_ADD_INTENTS.TEMPLATE) {
      return "templates";
    }

    return "products";
  }, [explicitTab, quickAddIntent]);

  function handleTabChange(nextTab: string) {
    const normalized = resolveTab(nextTab);
    const next = new URLSearchParams(searchParams);
    next.set("tab", normalized);
    setSearchParams(next, { replace: true });
  }

  const templateQuickAddProps = quickAddIntent ? { quickAddIntent } : {};

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-heading text-text-primary text-2xl font-bold">Library</h2>
        <p className="text-text-secondary text-base">
          Manage products and templates from one workspace.
        </p>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange}>
        <TabsList className="bg-bg-surface border-border-fintech h-10 justify-start border p-1">
          <TabsTrigger value="products" className="text-base">
            Products
          </TabsTrigger>
          <TabsTrigger value="templates" className="text-base">
            Templates
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {currentTab === "products" ? (
        <ProductsListView organizationId={currentOrganization.id} userId={user.id} />
      ) : (
        <TemplatesListView
          organizationId={currentOrganization.id}
          userId={user.id}
          {...templateQuickAddProps}
        />
      )}
    </section>
  );
}
