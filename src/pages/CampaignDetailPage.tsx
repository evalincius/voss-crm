import { useParams } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { CampaignDetailView } from "@/features/campaigns/components/CampaignDetailView";

export function CampaignDetailPage() {
  const { id } = useParams();
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user || !id) {
    return <PageLoader />;
  }

  return (
    <CampaignDetailView organizationId={currentOrganization.id} userId={user.id} campaignId={id} />
  );
}
