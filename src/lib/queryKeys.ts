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

export const queryKeys = mergeQueryKeys(authKeys, organizationKeys, memberKeys, invitationKeys);
