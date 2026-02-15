import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { DashboardView } from "@/features/dashboard/components/DashboardView";

export function DashboardPage() {
  const { currentOrganization, user } = useAuth();

  if (!currentOrganization || !user) {
    return <PageLoader />;
  }

  return <DashboardView organizationId={currentOrganization.id} userId={user.id} />;
}
