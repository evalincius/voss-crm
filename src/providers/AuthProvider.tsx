import { createContext, useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { queryClient } from "@/lib/queryClient";
import {
  getUserOrganizationIds,
  getUserCurrentOrganizationId,
  getOrganizationsByIds,
  setCurrentOrganization,
} from "@/features/organizations/services/organizationService";
import type { AuthContextValue } from "@/features/auth/types";
import type { Organization } from "@/features/organizations/types";
import type { Session, User } from "@supabase/supabase-js";

const SESSION_TIMEOUT_MS = 5_000;

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrg] = useState<Organization | null>(null);

  const loadOrganizations = useCallback(async (userId: string) => {
    const idsResult = await getUserOrganizationIds();
    if (idsResult.error || !idsResult.data || idsResult.data.length === 0) {
      setOrganizations([]);
      setCurrentOrg(null);
      return;
    }

    const orgIds = idsResult.data;
    const orgsResult = await getOrganizationsByIds(orgIds);
    if (orgsResult.error || !orgsResult.data || orgsResult.data.length === 0) {
      setOrganizations([]);
      setCurrentOrg(null);
      return;
    }

    const orgs = orgsResult.data;
    setOrganizations(orgs);

    const currentIdResult = await getUserCurrentOrganizationId();
    const currentId = currentIdResult.data;
    const current = (currentId ? orgs.find((o) => o.id === currentId) : undefined) ?? orgs[0];

    if (!current) {
      setCurrentOrg(null);
      return;
    }

    if (!currentId || !orgs.find((o) => o.id === currentId)) {
      await setCurrentOrganization(userId, current.id);
    }

    setCurrentOrg(current);
  }, []);

  useEffect(() => {
    let activeCallId = 0;

    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, SESSION_TIMEOUT_MS);

    async function handleSession(newSession: Session | null) {
      const callId = ++activeCallId;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await loadOrganizations(newSession.user.id);
        if (callId !== activeCallId) return;
      } else {
        setOrganizations([]);
        setCurrentOrg(null);
      }

      setLoading(false);
      clearTimeout(timeoutId);
    }

    void supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void handleSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      void handleSession(newSession);
    });

    return () => {
      activeCallId++;
      subscription.unsubscribe();
      clearTimeout(timeoutId);
    };
  }, [loadOrganizations]);

  const handleSignOut = useCallback(async () => {
    setOrganizations([]);
    setCurrentOrg(null);
    setUser(null);
    setSession(null);
    queryClient.clear();
    await supabase.auth.signOut();
  }, []);

  const switchOrganization = useCallback(
    async (orgId: string) => {
      if (!user) return;

      const target = organizations.find((o) => o.id === orgId);
      if (!target) return;

      await setCurrentOrganization(user.id, orgId);
      setCurrentOrg(target);
      queryClient.clear();
    },
    [user, organizations],
  );

  const refreshOrganizations = useCallback(async () => {
    if (!user) return;
    await loadOrganizations(user.id);
  }, [user, loadOrganizations]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut: handleSignOut,
        organizations,
        currentOrganization,
        switchOrganization,
        refreshOrganizations,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
