import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type { Session, User } from "@supabase/supabase-js";

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ApiResult<{ user: User; session: Session }>> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: { user: data.user, session: data.session }, error: null };
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string,
): Promise<ApiResult<{ user: User; session: Session }>> {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data.user || !data.session) {
    return { data: null, error: "Signup succeeded but no session was returned" };
  }

  return { data: { user: data.user, session: data.session }, error: null };
}

export async function signOut(): Promise<ApiResult<null>> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
