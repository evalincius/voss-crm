import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ROUTES } from "@/lib/constants";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: ROUTES.HOME,
    element: <Navigate to={ROUTES.DASHBOARD} replace />,
  },
  {
    element: <AuthLayout />,
    children: [
      { path: ROUTES.LOGIN, element: <LoginPage /> },
      { path: ROUTES.SIGNUP, element: <SignupPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: ROUTES.DASHBOARD, element: <DashboardPage /> },
      {
        path: ROUTES.ORG_SETTINGS,
        lazy: async () => {
          const { OrgSettingsPage } = await import("@/pages/OrgSettingsPage");
          return { Component: OrgSettingsPage };
        },
      },
    ],
  },
  {
    path: ROUTES.ACCEPT_INVITATION,
    lazy: async () => {
      const { InvitationAcceptPage } = await import("@/pages/InvitationAcceptPage");
      return { Component: InvitationAcceptPage };
    },
  },
  {
    path: "*",
    element: <NotFoundPage />,
  },
]);
