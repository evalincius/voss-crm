export const APP_NAME = "CoEngineers";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  DASHBOARD: "/app/dashboard",
  LIBRARY: "/app/library",
  PEOPLE: "/app/people",
  PERSON_DETAIL: "/app/people/:id",
  CAMPAIGNS: "/app/campaigns",
  CAMPAIGN_DETAIL: "/app/campaigns/:id",
  DEALS: "/app/deals",
  LIBRARY_PRODUCTS: "/app/library/products",
  LIBRARY_PRODUCT_DETAIL: "/app/library/products/:id",
  LIBRARY_TEMPLATES: "/app/library/templates",
  LIBRARY_TEMPLATE_DETAIL: "/app/library/templates/:id",
  ORG_SETTINGS: "/app/org/settings",
  ACCEPT_INVITATION: "/accept-invitation",
} as const;

export const QUICK_ADD_INTENTS = {
  PERSON: "person",
  INTERACTION: "interaction",
  DEAL: "deal",
  CAMPAIGN: "campaign",
  TEMPLATE: "template",
} as const;

export type QuickAddIntent = (typeof QUICK_ADD_INTENTS)[keyof typeof QUICK_ADD_INTENTS];

export interface QuickAddNavigationState {
  quickAdd: {
    intent: QuickAddIntent;
    organization_id: string;
  };
}

export const SIDEBAR_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 64;
