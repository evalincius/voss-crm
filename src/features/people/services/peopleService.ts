import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  Person,
  PaginatedPeopleResult,
  PeopleListParams,
  CreatePersonInput,
  UpdatePersonInput,
} from "@/features/people/types";

function escapeLikeValue(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function listPeople(
  params: PeopleListParams,
): Promise<ApiResult<PaginatedPeopleResult>> {
  let query = supabase
    .from("people")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId);

  if (params.archiveFilter === "active") {
    query = query.eq("is_archived", false);
  }

  if (params.archiveFilter === "archived") {
    query = query.eq("is_archived", true);
  }

  if (params.lifecycle !== "all") {
    query = query.eq("lifecycle", params.lifecycle);
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch.length > 0) {
    const escaped = escapeLikeValue(trimmedSearch);
    query = query.or(
      `full_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    );
  }

  if (params.sort === "name_asc") {
    query = query.order("full_name", { ascending: true });
  }

  if (params.sort === "created_desc") {
    query = query.order("created_at", { ascending: false });
  }

  if (params.sort === "updated_desc") {
    query = query.order("updated_at", { ascending: false });
  }

  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  const { data, count, error } = await query.range(from, to);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: {
      items: data ?? [],
      total: count ?? 0,
      page: params.page,
      pageSize: params.pageSize,
    },
    error: null,
  };
}

export async function getPersonById(
  organizationId: string,
  personId: string,
): Promise<ApiResult<Person | null>> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", personId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function createPerson(input: CreatePersonInput): Promise<ApiResult<Person>> {
  const { data, error } = await supabase.from("people").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updatePerson(input: UpdatePersonInput): Promise<ApiResult<Person>> {
  const { id, ...payload } = input;

  const { data, error } = await supabase
    .from("people")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function archivePerson(personId: string): Promise<ApiResult<Person>> {
  const { data, error } = await supabase
    .from("people")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", personId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function unarchivePerson(personId: string): Promise<ApiResult<Person>> {
  const { data, error } = await supabase
    .from("people")
    .update({ is_archived: false, archived_at: null })
    .eq("id", personId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function findPersonByEmail(
  organizationId: string,
  email: string,
): Promise<ApiResult<Person | null>> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function findPersonByPhone(
  organizationId: string,
  phone: string,
): Promise<ApiResult<Person | null>> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("phone", phone)
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function updatePersonFromImport(
  personId: string,
  payload: Partial<Pick<Person, "full_name" | "email" | "phone" | "notes" | "lifecycle">>,
): Promise<ApiResult<Person>> {
  const { data, error } = await supabase
    .from("people")
    .update(payload)
    .eq("id", personId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}
