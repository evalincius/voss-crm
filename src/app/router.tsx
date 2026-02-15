import { createBrowserRouter, Navigate } from "react-router";
import type { RouteObject } from "react-router";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { ROUTES } from "@/lib/constants";
import { CampaignDetailPage } from "@/pages/CampaignDetailPage";
import { CampaignsPage } from "@/pages/CampaignsPage";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DealsPage } from "@/pages/DealsPage";
import { LibraryProductDetailPage } from "@/pages/LibraryProductDetailPage";
import { LibraryProductsPage } from "@/pages/LibraryProductsPage";
import { LibraryTemplateDetailPage } from "@/pages/LibraryTemplateDetailPage";
import { LibraryTemplatesPage } from "@/pages/LibraryTemplatesPage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { PeoplePage } from "@/pages/PeoplePage";
import { PersonDetailPage } from "@/pages/PersonDetailPage";

export const appRoutes: RouteObject[] = [
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
      { path: ROUTES.PEOPLE, element: <PeoplePage /> },
      { path: ROUTES.PERSON_DETAIL, element: <PersonDetailPage /> },
      { path: ROUTES.CAMPAIGNS, element: <CampaignsPage /> },
      { path: ROUTES.CAMPAIGN_DETAIL, element: <CampaignDetailPage /> },
      { path: ROUTES.DEALS, element: <DealsPage /> },
      { path: ROUTES.LIBRARY_PRODUCTS, element: <LibraryProductsPage /> },
      { path: ROUTES.LIBRARY_PRODUCT_DETAIL, element: <LibraryProductDetailPage /> },
      { path: ROUTES.LIBRARY_TEMPLATES, element: <LibraryTemplatesPage /> },
      { path: ROUTES.LIBRARY_TEMPLATE_DETAIL, element: <LibraryTemplateDetailPage /> },
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
];

export const router = createBrowserRouter(appRoutes);
