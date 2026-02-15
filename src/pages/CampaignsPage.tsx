import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { CampaignsListView } from "@/features/campaigns/components/CampaignsListView";

export function CampaignsPage() {
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  return <CampaignsListView organizationId={currentOrganization.id} userId={user.id} />;
}
