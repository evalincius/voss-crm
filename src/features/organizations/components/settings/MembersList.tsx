import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { OrganizationMember, OrganizationRole } from "@/features/organizations/types";

interface MembersListProps {
  members: OrganizationMember[];
  currentUserId: string;
  ownerCount: number;
  onRoleChange: (memberId: string, role: OrganizationRole) => void;
  onRemove: (memberId: string) => void;
  onLeave: () => void;
}

export function MembersList({
  members,
  currentUserId,
  ownerCount,
  onRoleChange,
  onRemove,
  onLeave,
}: MembersListProps) {
  const [confirmAction, setConfirmAction] = useState<{
    type: "remove" | "leave";
    memberId?: string;
    name: string;
  } | null>(null);

  function getInitials(name: string | null, email: string): string {
    if (name) {
      return name
        .split(" ")
        .map((n) => n.charAt(0))
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((member) => {
            const isCurrentUser = member.user_id === currentUserId;
            const isLastOwner = member.role === "owner" && ownerCount <= 1;
            const displayName = member.profile.full_name ?? member.profile.email;

            return (
              <TableRow key={member.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      {member.profile.avatar_url && (
                        <AvatarImage src={member.profile.avatar_url} alt={displayName} />
                      )}
                      <AvatarFallback className="text-xs">
                        {getInitials(member.profile.full_name, member.profile.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-text-primary text-sm font-medium">
                        {displayName}
                        {isCurrentUser && (
                          <span className="text-text-muted ml-1 text-xs">(you)</span>
                        )}
                      </p>
                      <p className="text-text-secondary text-xs">{member.profile.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {isCurrentUser ? (
                    <Badge variant="secondary">{member.role}</Badge>
                  ) : (
                    <Select
                      value={member.role}
                      onValueChange={(value) => onRoleChange(member.id, value as OrganizationRole)}
                      disabled={isLastOwner}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="owner">owner</SelectItem>
                        <SelectItem value="member">member</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {isCurrentUser ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isLastOwner}
                      onClick={() => setConfirmAction({ type: "leave", name: displayName })}
                    >
                      Leave
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setConfirmAction({
                          type: "remove",
                          memberId: member.id,
                          name: displayName,
                        })
                      }
                    >
                      Remove
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "leave" ? "Leave organization?" : "Remove member?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "leave"
                ? "You will lose access to this organization. This action cannot be undone."
                : `Are you sure you want to remove ${confirmAction?.name} from this organization?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmAction?.type === "leave") {
                  onLeave();
                } else if (confirmAction?.memberId) {
                  onRemove(confirmAction.memberId);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === "leave" ? "Leave" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
