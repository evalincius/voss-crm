import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useDeleteOrganization } from "@/features/organizations/hooks/useOrgSettings";
import { ROUTES } from "@/lib/constants";

export function DangerZone() {
  const { currentOrganization, organizations, switchOrganization } = useAuth();
  const navigate = useNavigate();
  const deleteOrg = useDeleteOrganization();
  const [open, setOpen] = useState(false);
  const [confirmName, setConfirmName] = useState("");

  const orgName = currentOrganization?.name ?? "";
  const canDelete = confirmName === orgName;

  async function handleDelete() {
    if (!currentOrganization || !canDelete) return;

    try {
      await deleteOrg.mutateAsync(currentOrganization.id);

      const otherOrg = organizations.find((o) => o.id !== currentOrganization.id);
      if (otherOrg) {
        await switchOrganization(otherOrg.id);
      }

      toast.success("Organization deleted");
      setOpen(false);
      void navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete organization");
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive text-lg">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-secondary mb-4 text-sm">
            Deleting this organization is permanent and cannot be undone. All members will lose
            access.
          </p>
          <Button variant="destructive" onClick={() => setOpen(true)}>
            Delete organization
          </Button>
        </CardContent>
      </Card>

      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) setConfirmName("");
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete organization</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Please type{" "}
              <span className="text-text-primary font-semibold">{orgName}</span> to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-2">
            <Label htmlFor="confirm-name">Organization name</Label>
            <Input
              id="confirm-name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!canDelete || deleteOrg.isPending}
              onClick={handleDelete}
            >
              {deleteOrg.isPending ? "Deleting..." : "Delete organization"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
