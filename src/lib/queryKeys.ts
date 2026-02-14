import { createQueryKeys, mergeQueryKeys } from "@lukemorales/query-key-factory";

export const authKeys = createQueryKeys("auth", {
  session: null,
  user: null,
});

export const organizationKeys = createQueryKeys("organizations", {
  all: null,
  detail: (orgId: string) => [orgId],
  current: null,
});

export const memberKeys = createQueryKeys("members", {
  list: (orgId: string) => [orgId],
});

export const invitationKeys = createQueryKeys("invitations", {
  list: (orgId: string) => [orgId],
  validate: (token: string) => [token],
});

export const queryKeys = mergeQueryKeys(authKeys, organizationKeys, memberKeys, invitationKeys);
