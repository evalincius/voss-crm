import { createQueryKeys, mergeQueryKeys } from "@lukemorales/query-key-factory";

export const authKeys = createQueryKeys("auth", {
  session: null,
  user: null,
});

export const organizationKeys = createQueryKeys("organizations", {
  all: null,
  detail: (organizationId: string) => [`organization_id:${organizationId}`],
  current: null,
});

export const memberKeys = createQueryKeys("members", {
  list: (organizationId: string) => [`organization_id:${organizationId}`],
});

export const invitationKeys = createQueryKeys("invitations", {
  list: (organizationId: string) => [`organization_id:${organizationId}`],
  validate: (token: string) => [token],
});

export const peopleKeys = createQueryKeys("people", {
  listRoot: (organizationId: string) => [`organization_id:${organizationId}`],
  list: (
    organizationId: string,
    params: {
      search: string;
      lifecycle: string;
      archiveFilter: string;
      sort: string;
      page: number;
      pageSize: number;
    },
  ) => [`organization_id:${organizationId}`, params],
  detail: (organizationId: string, personId: string) => [
    `organization_id:${organizationId}`,
    `person_id:${personId}`,
  ],
});

export const interactionKeys = createQueryKeys("interactions", {
  byPerson: (organizationId: string, personId: string) => [
    `organization_id:${organizationId}`,
    `person_id:${personId}`,
  ],
});

export const productKeys = createQueryKeys("products", {
  listRoot: (organizationId: string) => [`organization_id:${organizationId}`],
  list: (
    organizationId: string,
    params: {
      search: string;
      archiveFilter: string;
      sort: string;
    },
  ) => [`organization_id:${organizationId}`, params],
  options: (organizationId: string) => [`organization_id:${organizationId}`, "options"],
  detail: (organizationId: string, productId: string) => [
    `organization_id:${organizationId}`,
    `product_id:${productId}`,
  ],
  performance: (organizationId: string, productId: string) => [
    `organization_id:${organizationId}`,
    `product_id:${productId}`,
    "performance",
  ],
});

export const templateKeys = createQueryKeys("templates", {
  listRoot: (organizationId: string) => [`organization_id:${organizationId}`],
  list: (
    organizationId: string,
    params: {
      search: string;
      statusFilter: string;
      sort: string;
      productId: string | null;
    },
  ) => [`organization_id:${organizationId}`, params],
  productOptions: (organizationId: string) => [
    `organization_id:${organizationId}`,
    "product-options",
  ],
  detail: (organizationId: string, templateId: string) => [
    `organization_id:${organizationId}`,
    `template_id:${templateId}`,
  ],
  productLinks: (organizationId: string, templateId: string) => [
    `organization_id:${organizationId}`,
    `template_id:${templateId}`,
    "product-links",
  ],
  usedIn: (organizationId: string, templateId: string) => [
    `organization_id:${organizationId}`,
    `template_id:${templateId}`,
    "used-in",
  ],
});

export const campaignKeys = createQueryKeys("campaigns", {
  listRoot: (organizationId: string) => [`organization_id:${organizationId}`],
  list: (
    organizationId: string,
    params: {
      search: string;
      archiveFilter: string;
      typeFilter: string;
      sort: string;
    },
  ) => [`organization_id:${organizationId}`, params],
  detail: (organizationId: string, campaignId: string) => [
    `organization_id:${organizationId}`,
    `campaign_id:${campaignId}`,
  ],
  members: (organizationId: string, campaignId: string) => [
    `organization_id:${organizationId}`,
    `campaign_id:${campaignId}`,
    "members",
  ],
  metrics: (organizationId: string, campaignId: string) => [
    `organization_id:${organizationId}`,
    `campaign_id:${campaignId}`,
    "metrics",
  ],
  productLinks: (organizationId: string, campaignId: string) => [
    `organization_id:${organizationId}`,
    `campaign_id:${campaignId}`,
    "product-links",
  ],
  templateLinks: (organizationId: string, campaignId: string) => [
    `organization_id:${organizationId}`,
    `campaign_id:${campaignId}`,
    "template-links",
  ],
  byPerson: (organizationId: string, personId: string) => [
    `organization_id:${organizationId}`,
    `person_id:${personId}`,
    "campaign-memberships",
  ],
});

export const dealKeys = createQueryKeys("deals", {
  listRoot: (organizationId: string) => [`organization_id:${organizationId}`],
  list: (
    organizationId: string,
    params: {
      productId: string | null;
      personSearch: string;
    },
  ) => [`organization_id:${organizationId}`, params],
  detail: (organizationId: string, dealId: string) => [
    `organization_id:${organizationId}`,
    `deal_id:${dealId}`,
  ],
  byPerson: (organizationId: string, personId: string) => [
    `organization_id:${organizationId}`,
    `person_id:${personId}`,
  ],
  duplicateCheck: (organizationId: string, personId: string, productId: string) => [
    `organization_id:${organizationId}`,
    `person_id:${personId}`,
    `product_id:${productId}`,
    "duplicate-check",
  ],
  interactions: (organizationId: string, dealId: string) => [
    `organization_id:${organizationId}`,
    `deal_id:${dealId}`,
    "interactions",
  ],
});

export const queryKeys = mergeQueryKeys(
  authKeys,
  organizationKeys,
  memberKeys,
  invitationKeys,
  peopleKeys,
  interactionKeys,
  productKeys,
  templateKeys,
  campaignKeys,
  dealKeys,
);
