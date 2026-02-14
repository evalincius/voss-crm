import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMembers } from "@/features/organizations/hooks/useOrgSettings";
import { OrgSettingsView } from "@/features/organizations/components/OrgSettingsView";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export function OrgSettingsPage() {
  const { user, currentOrganization } = useAuth();
  const orgId = currentOrganization?.id ?? "";
  const { data: members, isLoading } = useMembers(orgId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const currentMember = members?.find((m) => m.user_id === user?.id);
  const isOwner = currentMember?.role === "owner";

  if (!isOwner) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-heading text-text-primary mb-2 text-xl font-semibold">Access Denied</h2>
        <p className="text-text-secondary text-sm">Only organization owners can access settings.</p>
      </div>
    );
  }

  return <OrgSettingsView />;
}
