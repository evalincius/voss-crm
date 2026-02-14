import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useSendInvitation } from "@/features/organizations/hooks/useOrgSettings";
import {
  inviteMemberSchema,
  type InviteMemberSchema,
} from "@/features/organizations/schemas/orgSettings.schema";
import { ROUTES } from "@/lib/constants";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ open, onOpenChange }: InviteMemberDialogProps) {
  const { user, currentOrganization } = useAuth();
  const orgId = currentOrganization?.id ?? "";
  const sendInvitation = useSendInvitation(orgId);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InviteMemberSchema>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: { email: "", role: "member" },
  });

  const selectedRole = watch("role");

  function handleClose(isOpen: boolean) {
    if (!isOpen) {
      reset();
      setInviteLink(null);
      setServerError(null);
    }
    onOpenChange(isOpen);
  }

  async function onSubmit(data: InviteMemberSchema) {
    if (!user) return;
    setServerError(null);

    try {
      const invitation = await sendInvitation.mutateAsync({
        email: data.email,
        role: data.role,
        invitedBy: user.id,
      });

      if (invitation) {
        const link = `${window.location.origin}${ROUTES.ACCEPT_INVITATION}?token=${invitation.token}`;
        setInviteLink(link);
        toast.success("Invitation sent");
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to send invitation");
    }
  }

  async function copyLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }

  if (inviteLink) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitation link</DialogTitle>
            <DialogDescription>
              Share this link with the person you want to invite. The link expires in 7 days.
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2">
            <Input value={inviteLink} readOnly className="font-mono text-xs" />
            <Button variant="outline" size="icon" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button variant="outline" onClick={() => handleClose(false)}>
            Done
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>Invite someone to join this organization.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {serverError && (
            <div className="bg-destructive/10 text-destructive border-destructive/20 rounded-md border px-4 py-3 text-sm">
              {serverError}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              {...register("email")}
            />
            {errors.email && <p className="text-destructive text-sm">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setValue("role", value as "owner" | "member", { shouldValidate: true })
              }
            >
              <SelectTrigger id="invite-role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.role && <p className="text-destructive text-sm">{errors.role.message}</p>}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send invitation"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
