import { useParams } from "react-router";
import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { ProductDetailView } from "@/features/library/products/components/ProductDetailView";

export function LibraryProductDetailPage() {
  const { id } = useParams();
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user || !id) {
    return <PageLoader />;
  }

  return (
    <ProductDetailView organizationId={currentOrganization.id} userId={user.id} productId={id} />
  );
}
