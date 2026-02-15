import { useParams } from "react-router";
import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { TemplateDetailView } from "@/features/library/templates/components/TemplateDetailView";

export function LibraryTemplateDetailPage() {
  const { id } = useParams();
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user || !id) {
    return <PageLoader />;
  }

  return (
    <TemplateDetailView organizationId={currentOrganization.id} userId={user.id} templateId={id} />
  );
}
