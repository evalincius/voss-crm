import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useInvitations, useRevokeInvitation } from "@/features/organizations/hooks/useOrgSettings";

export function InvitationsTab() {
  const { currentOrganization } = useAuth();
  const orgId = currentOrganization?.id ?? "";
  const { data: invitations, isLoading } = useInvitations(orgId);
  const revokeInvitation = useRevokeInvitation(orgId);
  const [revokeId, setRevokeId] = useState<string | null>(null);

  async function handleRevoke() {
    if (!revokeId) return;

    try {
      await revokeInvitation.mutateAsync(revokeId);
      toast.success("Invitation revoked");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revoke invitation");
    } finally {
      setRevokeId(null);
    }
  }

  function isExpired(expiresAt: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  }

  function formatDate(dateStr: string | null): string {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString();
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pending Invitations</CardTitle>
          <CardDescription>Manage outstanding invitations to your organization.</CardDescription>
        </CardHeader>
        <CardContent>
          {!invitations?.length ? (
            <p className="text-text-secondary py-6 text-center text-sm">No pending invitations</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const expired = isExpired(invitation.expires_at);

                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="text-sm">{invitation.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{invitation.role}</Badge>
                      </TableCell>
                      <TableCell>
                        {expired ? (
                          <span className="text-destructive text-sm font-medium">Expired</span>
                        ) : (
                          <span className="text-text-secondary text-sm">
                            {formatDate(invitation.expires_at)}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setRevokeId(invitation.id)}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!revokeId} onOpenChange={(open) => !open && setRevokeId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
            <AlertDialogDescription>
              This invitation link will no longer work. You can always send a new one.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleRevoke}
            >
              Revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
