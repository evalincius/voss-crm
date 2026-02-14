import { useSearchParams, useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  useValidateInvitation,
  useAcceptInvitation,
} from "@/features/organizations/hooks/useOrgSettings";
import { ROUTES } from "@/lib/constants";

export function InvitationAcceptPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const { session } = useAuth();
  const { data: validation, isLoading, error } = useValidateInvitation(token);
  const acceptInvitation = useAcceptInvitation();

  async function handleAccept() {
    try {
      await acceptInvitation.mutateAsync(token);
      toast.success("Invitation accepted! Welcome to the organization.");
      void navigate(ROUTES.DASHBOARD);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invitation");
    }
  }

  const redirectTo = `${ROUTES.ACCEPT_INVITATION}?token=${token}`;
  const locationState = { from: { pathname: redirectTo } };

  if (!token) {
    return (
      <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Link</CardTitle>
            <CardDescription>
              No invitation token was provided. Please check the link and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-bg-app flex min-h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !validation?.valid) {
    return (
      <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              {validation?.error ??
                error?.message ??
                "This invitation is no longer valid. It may have expired or been revoked."}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>You&apos;re invited!</CardTitle>
            <CardDescription>
              You&apos;ve been invited to join{" "}
              <span className="text-text-primary font-semibold">
                {validation.organization_name}
              </span>{" "}
              as a <Badge variant="secondary">{validation.role}</Badge>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {validation.inviter_name && (
              <p className="text-text-secondary text-center text-sm">
                Invited by {validation.inviter_name}
              </p>
            )}
            <p className="text-text-secondary text-center text-sm">
              Please sign in or create an account to accept this invitation.
            </p>
            <div className="flex gap-3">
              <Button asChild className="flex-1">
                <Link to={ROUTES.LOGIN} state={locationState}>
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1">
                <Link to={ROUTES.SIGNUP} state={locationState}>
                  Create account
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-bg-app flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You&apos;ve been invited to join{" "}
            <span className="text-text-primary font-semibold">{validation.organization_name}</span>{" "}
            as a <Badge variant="secondary">{validation.role}</Badge>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {validation.inviter_name && (
            <p className="text-text-secondary text-center text-sm">
              Invited by {validation.inviter_name}
            </p>
          )}
          <Button className="w-full" onClick={handleAccept} disabled={acceptInvitation.isPending}>
            {acceptInvitation.isPending ? "Accepting..." : "Accept invitation"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
