import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { APP_NAME, ROUTES } from "@/lib/constants";

export function LoginPage() {
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
        <h2 className="font-heading text-text-primary mb-2 text-2xl font-bold">Login</h2>
        <p className="text-text-secondary text-sm">Sign in to {APP_NAME}</p>
      </div>
      <LoginForm />
    </div>
  );
}
