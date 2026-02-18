import { PageLoader } from "@/components/shared/PageLoader";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FollowUpsListView } from "@/features/dashboard/components/FollowUpsListView";

export function FollowUpsPage() {
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  return <FollowUpsListView organizationId={currentOrganization.id} userId={user.id} />;
}
