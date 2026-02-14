import { Navigate, useLocation } from "react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { PageLoader } from "@/components/shared/PageLoader";
import { ROUTES } from "@/lib/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!session) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
