import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useLeaveOrganization,
} from "@/features/organizations/hooks/useOrgSettings";
import { ROUTES } from "@/lib/constants";
import type { OrganizationRole } from "@/features/organizations/types";
import { MembersList } from "./MembersList";
import { InviteMemberDialog } from "./InviteMemberDialog";

export function MembersTab() {
  const { user, currentOrganization, switchOrganization, organizations } = useAuth();
  const navigate = useNavigate();
  const orgId = currentOrganization?.id ?? "";
  const { data: members, isLoading } = useMembers(orgId);
  const updateRole = useUpdateMemberRole(orgId);
  const removeMember = useRemoveMember(orgId);
  const leaveOrg = useLeaveOrganization();
  const [inviteOpen, setInviteOpen] = useState(false);

  const ownerCount = members?.filter((m) => m.role === "owner").length ?? 0;

  async function handleRoleChange(memberId: string, role: OrganizationRole) {
    try {
      await updateRole.mutateAsync({ memberId, role });
      toast.success("Role updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    }
  }

  async function handleRemoveMember(memberId: string) {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    }
  }

  async function handleLeave() {
    if (!user || !currentOrganization) return;

    try {
      await leaveOrg.mutateAsync({ orgId: currentOrganization.id, userId: user.id });
      const otherOrg = organizations.find((o) => o.id !== currentOrganization.id);
      if (otherOrg) {
        await switchOrganization(otherOrg.id);
      }
      toast.success("You left the organization");
      void navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to leave organization");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg">Members</CardTitle>
          <CardDescription>Manage who has access to this organization.</CardDescription>
        </div>
        <Button onClick={() => setInviteOpen(true)} size="sm">
          Invite member
        </Button>
      </CardHeader>
      <CardContent>
        <MembersList
          members={members ?? []}
          currentUserId={user?.id ?? ""}
          ownerCount={ownerCount}
          onRoleChange={handleRoleChange}
          onRemove={handleRemoveMember}
          onLeave={handleLeave}
        />
      </CardContent>
      <InviteMemberDialog open={inviteOpen} onOpenChange={setInviteOpen} />
    </Card>
  );
}
