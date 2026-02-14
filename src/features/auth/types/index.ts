import type { Session, User } from "@supabase/supabase-js";
import type { Organization } from "@/features/organizations/types";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  organizations: Organization[];
  currentOrganization: Organization | null;
  switchOrganization: (orgId: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;
}
