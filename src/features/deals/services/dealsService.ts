import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  CreateDealInput,
  Deal,
  DealCardData,
  DealListParams,
  DealStage,
  DuplicateDealWarning,
  UpdateDealInput,
} from "@/features/deals/types";

function escapeLikeValue(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function listDeals(params: DealListParams): Promise<ApiResult<DealCardData[]>> {
  let query = supabase
    .from("deals")
    .select(
      "id, organization_id, person_id, product_id, campaign_id, stage, value, currency, next_step_at, notes, created_at, updated_at, people!deals_person_fk(full_name), products!deals_product_fk(name)",
    )
    .eq("organization_id", params.organizationId)
    .order("updated_at", { ascending: false });

  if (params.productId) {
    query = query.eq("product_id", params.productId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  let cards: DealCardData[] = (data ?? []).map((row) => {
    const person = (row as { people?: unknown }).people as { full_name: string } | undefined;
    const product = (row as { products?: unknown }).products as { name: string } | undefined;

    return {
      id: (row as { id: string }).id,
      organization_id: (row as { organization_id: string }).organization_id,
      person_id: (row as { person_id: string }).person_id,
      product_id: (row as { product_id: string }).product_id,
      campaign_id: (row as { campaign_id: string | null }).campaign_id,
      stage: (row as { stage: DealStage }).stage,
      value: (row as { value: number | null }).value,
      currency: (row as { currency: string | null }).currency,
      next_step_at: (row as { next_step_at: string | null }).next_step_at,
      notes: (row as { notes: string | null }).notes,
      created_at: (row as { created_at: string }).created_at,
      updated_at: (row as { updated_at: string }).updated_at,
      person_name: person?.full_name ?? "Unknown",
      product_name: product?.name ?? "Unknown",
    };
  });

  const trimmedSearch = params.personSearch.trim();
  if (trimmedSearch.length > 0) {
    const lower = trimmedSearch.toLowerCase();
    cards = cards.filter((card) => card.person_name.toLowerCase().includes(lower));
  }

  return { data: cards, error: null };
}

export async function getDealById(
  organizationId: string,
  dealId: string,
): Promise<ApiResult<DealCardData | null>> {
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, organization_id, person_id, product_id, campaign_id, stage, value, currency, next_step_at, notes, created_at, updated_at, people!deals_person_fk(full_name), products!deals_product_fk(name)",
    )
    .eq("organization_id", organizationId)
    .eq("id", dealId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: null };
  }

  const person = (data as { people?: unknown }).people as { full_name: string } | undefined;
  const product = (data as { products?: unknown }).products as { name: string } | undefined;

  return {
    data: {
      id: (data as { id: string }).id,
      organization_id: (data as { organization_id: string }).organization_id,
      person_id: (data as { person_id: string }).person_id,
      product_id: (data as { product_id: string }).product_id,
      campaign_id: (data as { campaign_id: string | null }).campaign_id,
      stage: (data as { stage: DealStage }).stage,
      value: (data as { value: number | null }).value,
      currency: (data as { currency: string | null }).currency,
      next_step_at: (data as { next_step_at: string | null }).next_step_at,
      notes: (data as { notes: string | null }).notes,
      created_at: (data as { created_at: string }).created_at,
      updated_at: (data as { updated_at: string }).updated_at,
      person_name: person?.full_name ?? "Unknown",
      product_name: product?.name ?? "Unknown",
    },
    error: null,
  };
}

export async function createDeal(input: CreateDealInput): Promise<ApiResult<Deal>> {
  const { data, error } = await supabase.from("deals").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateDeal(input: UpdateDealInput): Promise<ApiResult<Deal>> {
  const { id, ...payload } = input;

  const { data, error } = await supabase
    .from("deals")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateDealStage(dealId: string, stage: DealStage): Promise<ApiResult<Deal>> {
  const { data, error } = await supabase
    .from("deals")
    .update({ stage })
    .eq("id", dealId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function checkDuplicateDeal(
  organizationId: string,
  personId: string,
  productId: string,
): Promise<ApiResult<DuplicateDealWarning | null>> {
  const { data, error } = await supabase
    .from("deals")
    .select("id, stage, created_at")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .eq("product_id", productId)
    .neq("stage", "lost")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data) {
    return { data: null, error: null };
  }

  return {
    data: {
      id: (data as { id: string }).id,
      stage: (data as { stage: DealStage }).stage,
      created_at: (data as { created_at: string }).created_at,
    },
    error: null,
  };
}

export async function listDealsByPerson(
  organizationId: string,
  personId: string,
): Promise<ApiResult<DealCardData[]>> {
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, organization_id, person_id, product_id, campaign_id, stage, value, currency, next_step_at, notes, created_at, updated_at, people!deals_person_fk(full_name), products!deals_product_fk(name)",
    )
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const cards: DealCardData[] = (data ?? []).map((row) => {
    const person = (row as { people?: unknown }).people as { full_name: string } | undefined;
    const product = (row as { products?: unknown }).products as { name: string } | undefined;

    return {
      id: (row as { id: string }).id,
      organization_id: (row as { organization_id: string }).organization_id,
      person_id: (row as { person_id: string }).person_id,
      product_id: (row as { product_id: string }).product_id,
      campaign_id: (row as { campaign_id: string | null }).campaign_id,
      stage: (row as { stage: DealStage }).stage,
      value: (row as { value: number | null }).value,
      currency: (row as { currency: string | null }).currency,
      next_step_at: (row as { next_step_at: string | null }).next_step_at,
      notes: (row as { notes: string | null }).notes,
      created_at: (row as { created_at: string }).created_at,
      updated_at: (row as { updated_at: string }).updated_at,
      person_name: person?.full_name ?? "Unknown",
      product_name: product?.name ?? "Unknown",
    };
  });

  return { data: cards, error: null };
}

export async function listInteractionsByDeal(
  organizationId: string,
  dealId: string,
): Promise<
  ApiResult<
    Array<{
      id: string;
      type: string;
      summary: string;
      occurred_at: string;
    }>
  >
> {
  const { data, error } = await supabase
    .from("interactions")
    .select("id, type, summary, occurred_at")
    .eq("organization_id", organizationId)
    .eq("deal_id", dealId)
    .order("occurred_at", { ascending: false })
    .limit(20);

  if (error) {
    return { data: null, error: error.message };
  }

  const interactions = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    type: (row as { type: string }).type,
    summary: (row as { summary: string }).summary,
    occurred_at: (row as { occurred_at: string }).occurred_at,
  }));

  return { data: interactions, error: null };
}

export async function searchPeopleForDeal(
  organizationId: string,
  search: string,
): Promise<ApiResult<Array<{ id: string; full_name: string; email: string | null }>>> {
  let query = supabase
    .from("people")
    .select("id, full_name, email")
    .eq("organization_id", organizationId)
    .eq("is_archived", false)
    .order("full_name", { ascending: true })
    .limit(20);

  const trimmed = search.trim();
  if (trimmed.length > 0) {
    const escaped = escapeLikeValue(trimmed);
    query = query.or(`full_name.ilike.%${escaped}%,email.ilike.%${escaped}%`);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  const results = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    full_name: (row as { full_name: string }).full_name,
    email: (row as { email: string | null }).email,
  }));

  return { data: results, error: null };
}
