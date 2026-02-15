import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProductsListView } from "@/features/library/products/components/ProductsListView";

export function LibraryProductsPage() {
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  return <ProductsListView organizationId={currentOrganization.id} userId={user.id} />;
}
