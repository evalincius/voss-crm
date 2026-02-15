import { useSearchParams } from "react-router";
import { CrmPlaceholderPage } from "./CrmPlaceholderPage";

export function DealsPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("product_id");

  return (
    <section className="space-y-4">
      <CrmPlaceholderPage
        title="Deals"
        description="Deals board placeholder. Manual deal creation and kanban behavior will be added in D4."
        expectedIntent="deal"
      />

      {productId ? (
        <div className="card-surface bg-bg-surface p-4">
          <p className="text-text-secondary text-base">
            Product filter received from Library deep link: <code>{productId}</code>
          </p>
        </div>
      ) : null}
    </section>
  );
}
