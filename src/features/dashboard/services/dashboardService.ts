import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  FollowUpItem,
  StaleDeal,
  PipelineStageCount,
  TopProduct,
  TopCampaign,
} from "@/features/dashboard/types";
import { DEAL_STAGE_VALUES } from "@/lib/constants";

export async function getFollowUpsDue(orgId: string): Promise<ApiResult<FollowUpItem[]>> {
  const [dealsResult, interactionsResult] = await Promise.all([
    supabase
      .from("deals")
      .select(
        "id, person_id, stage, next_step_at, people!deals_person_fk(full_name), products!deals_product_fk(name)",
      )
      .eq("organization_id", orgId)
      .not("next_step_at", "is", null)
      .neq("stage", "lost"),
    supabase
      .from("interactions")
      .select(
        "id, person_id, deal_id, type, summary, next_step_at, people!interactions_people_fk(full_name)",
      )
      .eq("organization_id", orgId)
      .not("next_step_at", "is", null),
  ]);

  if (dealsResult.error) {
    return { data: null, error: dealsResult.error.message };
  }

  if (interactionsResult.error) {
    return { data: null, error: interactionsResult.error.message };
  }

  const items: FollowUpItem[] = [];

  for (const row of dealsResult.data ?? []) {
    const person = (row as { people?: unknown }).people as { full_name: string } | undefined;
    const product = (row as { products?: unknown }).products as { name: string } | undefined;

    items.push({
      id: (row as { id: string }).id,
      source: "deal",
      next_step_at: (row as { next_step_at: string }).next_step_at,
      deal_id: (row as { id: string }).id,
      deal_stage: (row as { stage: string }).stage,
      deal_product_name: product?.name ?? null,
      person_id: (row as { person_id: string }).person_id,
      person_name: person?.full_name ?? "Unknown",
      interaction_type: null,
      interaction_summary: null,
    });
  }

  for (const row of interactionsResult.data ?? []) {
    const person = (row as { people?: unknown }).people as { full_name: string } | undefined;

    items.push({
      id: (row as { id: string }).id,
      source: "interaction",
      next_step_at: (row as { next_step_at: string }).next_step_at,
      deal_id: (row as { deal_id: string | null }).deal_id,
      deal_stage: null,
      deal_product_name: null,
      person_id: (row as { person_id: string }).person_id,
      person_name: person?.full_name ?? "Unknown",
      interaction_type: (row as { type: string }).type,
      interaction_summary: (row as { summary: string }).summary,
    });
  }

  items.sort((a, b) => new Date(a.next_step_at).getTime() - new Date(b.next_step_at).getTime());

  return { data: items, error: null };
}

export async function getStaleDeals(
  orgId: string,
  staleDaysThreshold: number,
): Promise<ApiResult<StaleDeal[]>> {
  const { data: dealsData, error: dealsError } = await supabase
    .from("deals")
    .select(
      "id, person_id, product_id, stage, value, currency, created_at, people!deals_person_fk(full_name), products!deals_product_fk(name)",
    )
    .eq("organization_id", orgId)
    .neq("stage", "lost")
    .neq("stage", "validated");

  if (dealsError) {
    return { data: null, error: dealsError.message };
  }

  const deals = dealsData ?? [];
  if (deals.length === 0) {
    return { data: [], error: null };
  }

  const dealIds = deals.map((d) => (d as { id: string }).id);

  const { data: interactionsData, error: interactionsError } = await supabase
    .from("interactions")
    .select("deal_id, occurred_at")
    .eq("organization_id", orgId)
    .in("deal_id", dealIds);

  if (interactionsError) {
    return { data: null, error: interactionsError.message };
  }

  const lastActivityByDeal = new Map<string, string>();
  for (const row of interactionsData ?? []) {
    const dealId = (row as { deal_id: string }).deal_id;
    const occurredAt = (row as { occurred_at: string }).occurred_at;
    const existing = lastActivityByDeal.get(dealId);
    if (!existing || occurredAt > existing) {
      lastActivityByDeal.set(dealId, occurredAt);
    }
  }

  const now = Date.now();
  const thresholdMs = staleDaysThreshold * 24 * 60 * 60 * 1000;
  const result: StaleDeal[] = [];

  for (const deal of deals) {
    const id = (deal as { id: string }).id;
    const createdAt = (deal as { created_at: string }).created_at;
    const lastInteraction = lastActivityByDeal.get(id);
    const lastActivity =
      lastInteraction && lastInteraction > createdAt ? lastInteraction : createdAt;
    const lastActivityTime = new Date(lastActivity).getTime();

    if (now - lastActivityTime >= thresholdMs) {
      const person = (deal as { people?: unknown }).people as { full_name: string } | undefined;
      const product = (deal as { products?: unknown }).products as { name: string } | undefined;
      const daysStale = Math.floor((now - lastActivityTime) / (24 * 60 * 60 * 1000));

      result.push({
        id,
        person_id: (deal as { person_id: string }).person_id,
        person_name: person?.full_name ?? "Unknown",
        product_name: product?.name ?? "Unknown",
        stage: (deal as { stage: string }).stage,
        value: (deal as { value: number | null }).value,
        currency: (deal as { currency: string | null }).currency,
        last_activity_at: lastActivity,
        days_stale: daysStale,
      });
    }
  }

  result.sort((a, b) => b.days_stale - a.days_stale);

  return { data: result, error: null };
}

export async function getPipelineSnapshot(orgId: string): Promise<ApiResult<PipelineStageCount[]>> {
  const { data, error } = await supabase
    .from("deals")
    .select("stage, value")
    .eq("organization_id", orgId);

  if (error) {
    return { data: null, error: error.message };
  }

  const stageMap = new Map<string, { count: number; total_value: number }>();

  for (const stage of DEAL_STAGE_VALUES) {
    stageMap.set(stage, { count: 0, total_value: 0 });
  }

  for (const row of data ?? []) {
    const stage = (row as { stage: string }).stage;
    const value = (row as { value: number | null }).value;
    const entry = stageMap.get(stage);
    if (entry) {
      entry.count += 1;
      entry.total_value += value ?? 0;
    }
  }

  const result: PipelineStageCount[] = DEAL_STAGE_VALUES.map((stage) => {
    const entry = stageMap.get(stage)!;
    return { stage, count: entry.count, total_value: entry.total_value };
  });

  return { data: result, error: null };
}

export async function getTopProducts(orgId: string, limit = 5): Promise<ApiResult<TopProduct[]>> {
  const [productsResult, dealsResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_archived", false),
    supabase.from("deals").select("product_id").eq("organization_id", orgId),
  ]);

  if (productsResult.error) {
    return { data: null, error: productsResult.error.message };
  }

  if (dealsResult.error) {
    return { data: null, error: dealsResult.error.message };
  }

  const countMap = new Map<string, number>();
  for (const row of dealsResult.data ?? []) {
    const productId = (row as { product_id: string }).product_id;
    countMap.set(productId, (countMap.get(productId) ?? 0) + 1);
  }

  const result: TopProduct[] = (productsResult.data ?? [])
    .map((row) => ({
      product_id: (row as { id: string }).id,
      product_name: (row as { name: string }).name,
      deal_count: countMap.get((row as { id: string }).id) ?? 0,
    }))
    .sort((a, b) => b.deal_count - a.deal_count)
    .slice(0, limit);

  return { data: result, error: null };
}

export async function getTopCampaigns(orgId: string, limit = 5): Promise<ApiResult<TopCampaign[]>> {
  const [campaignsResult, membersResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_archived", false),
    supabase.from("campaign_people").select("campaign_id").eq("organization_id", orgId),
  ]);

  if (campaignsResult.error) {
    return { data: null, error: campaignsResult.error.message };
  }

  if (membersResult.error) {
    return { data: null, error: membersResult.error.message };
  }

  const countMap = new Map<string, number>();
  for (const row of membersResult.data ?? []) {
    const campaignId = (row as { campaign_id: string }).campaign_id;
    countMap.set(campaignId, (countMap.get(campaignId) ?? 0) + 1);
  }

  const result: TopCampaign[] = (campaignsResult.data ?? [])
    .map((row) => ({
      campaign_id: (row as { id: string }).id,
      campaign_name: (row as { name: string }).name,
      member_count: countMap.get((row as { id: string }).id) ?? 0,
    }))
    .sort((a, b) => b.member_count - a.member_count)
    .slice(0, limit);

  return { data: result, error: null };
}
