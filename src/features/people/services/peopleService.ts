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

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const result = new Set<T>();
  for (const item of a) {
    if (b.has(item)) {
      result.add(item);
    }
  }
  return result;
}

export async function listPeople(
  params: PeopleListParams,
): Promise<ApiResult<PaginatedPeopleResult>> {
  // Pre-filter phase: derive person IDs from cross-feature relationships
  const derivedFilters: Array<Promise<ApiResult<Set<string>>>> = [];

  if (params.productInterest) {
    const productId = params.productInterest;
    derivedFilters.push(
      Promise.resolve(
        supabase
          .from("deals")
          .select("person_id")
          .eq("organization_id", params.organizationId)
          .eq("product_id", productId),
      ).then(({ data, error }) => {
        if (error) return { data: null, error: error.message };
        const ids = new Set((data ?? []).map((r) => (r as { person_id: string }).person_id));
        return { data: ids, error: null };
      }),
    );
  }

  if (params.sourceCampaign) {
    const campaignId = params.sourceCampaign;
    derivedFilters.push(
      Promise.resolve(
        supabase.from("campaign_people").select("person_id").eq("campaign_id", campaignId),
      ).then(({ data, error }) => {
        if (error) return { data: null, error: error.message };
        const ids = new Set((data ?? []).map((r) => (r as { person_id: string }).person_id));
        return { data: ids, error: null };
      }),
    );
  }

  if (params.hasOpenDeal !== null) {
    if (params.hasOpenDeal) {
      derivedFilters.push(
        Promise.resolve(
          supabase
            .from("deals")
            .select("person_id")
            .eq("organization_id", params.organizationId)
            .neq("stage", "lost"),
        ).then(({ data, error }) => {
          if (error) return { data: null, error: error.message };
          const ids = new Set((data ?? []).map((r) => (r as { person_id: string }).person_id));
          return { data: ids, error: null };
        }),
      );
    }
  }

  let matchedIds: Set<string> | null = null;
  if (derivedFilters.length > 0) {
    const results = await Promise.all(derivedFilters);
    for (const result of results) {
      if (result.error || !result.data) {
        return { data: null, error: result.error ?? "Failed to load derived filter" };
      }
      matchedIds = matchedIds === null ? result.data : intersect(matchedIds, result.data);
    }
  }

  // hasOpenDeal === false: we need all people with NO open deal
  if (params.hasOpenDeal === false) {
    const { data: openDealData, error: openDealError } = await supabase
      .from("deals")
      .select("person_id")
      .eq("organization_id", params.organizationId)
      .neq("stage", "lost");

    if (openDealError) {
      return { data: null, error: openDealError.message };
    }

    const withOpenDeals = new Set(
      (openDealData ?? []).map((r) => (r as { person_id: string }).person_id),
    );

    // Fetch all person IDs in org to compute complement
    const { data: allPeopleData, error: allPeopleError } = await supabase
      .from("people")
      .select("id")
      .eq("organization_id", params.organizationId);

    if (allPeopleError) {
      return { data: null, error: allPeopleError.message };
    }

    const noOpenDeal = new Set<string>();
    for (const row of allPeopleData ?? []) {
      const id = (row as { id: string }).id;
      if (!withOpenDeals.has(id)) {
        noOpenDeal.add(id);
      }
    }

    matchedIds = matchedIds === null ? noOpenDeal : intersect(matchedIds, noOpenDeal);
  }

  // Short-circuit if derived filters matched no one
  if (matchedIds !== null && matchedIds.size === 0) {
    return {
      data: { items: [], total: 0, page: params.page, pageSize: params.pageSize },
      error: null,
    };
  }

  let query = supabase
    .from("people")
    .select("*", { count: "exact" })
    .eq("organization_id", params.organizationId);

  if (matchedIds !== null) {
    query = query.in("id", Array.from(matchedIds));
  }

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

export async function listAllPeopleForExport(organizationId: string): Promise<ApiResult<Person[]>> {
  const { data, error } = await supabase
    .from("people")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_archived", false)
    .order("full_name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
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
