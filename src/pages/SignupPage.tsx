import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { SignupForm } from "@/features/auth/components/SignupForm";
import { APP_NAME, ROUTES } from "@/lib/constants";

export function SignupPage() {
  const { session } = useAuth();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? ROUTES.DASHBOARD;

  if (session) {
    return <Navigate to={from} replace />;
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="font-heading text-text-primary mb-2 text-2xl font-bold">Sign Up</h2>
        <p className="text-text-secondary text-sm">Create your {APP_NAME} account</p>
      </div>
      <SignupForm />
    </div>
  );
}
