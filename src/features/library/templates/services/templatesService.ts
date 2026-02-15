import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  CreateTemplateInput,
  SyncTemplateProductsInput,
  Template,
  TemplateListParams,
  TemplateProductOption,
  TemplateStatus,
  TemplateUsedInSummary,
  UpdateTemplateInput,
} from "@/features/library/templates/types";

function escapeLikeValue(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function listTemplates(params: TemplateListParams): Promise<ApiResult<Template[]>> {
  let templateIdsFilter: string[] | null = null;

  if (params.productId) {
    const { data: linkRows, error: linkError } = await supabase
      .from("template_products")
      .select("template_id")
      .eq("organization_id", params.organizationId)
      .eq("product_id", params.productId);

    if (linkError) {
      return { data: null, error: linkError.message };
    }

    templateIdsFilter = Array.from(
      new Set((linkRows ?? []).map((row) => (row as { template_id: string }).template_id)),
    );

    if (templateIdsFilter.length === 0) {
      return { data: [], error: null };
    }
  }

  let query = supabase.from("templates").select("*").eq("organization_id", params.organizationId);

  if (params.statusFilter === "active") {
    query = query.neq("status", "archived");
  }

  if (params.statusFilter === "archived") {
    query = query.eq("status", "archived");
  }

  if (templateIdsFilter) {
    query = query.in("id", templateIdsFilter);
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch.length > 0) {
    const escaped = escapeLikeValue(trimmedSearch);
    query = query.or(`title.ilike.%${escaped}%,body.ilike.%${escaped}%`);
  }

  if (params.sort === "title_asc") {
    query = query.order("title", { ascending: true });
  }

  if (params.sort === "created_desc") {
    query = query.order("created_at", { ascending: false });
  }

  if (params.sort === "updated_desc") {
    query = query.order("updated_at", { ascending: false });
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function listTemplateProductOptions(
  organizationId: string,
): Promise<ApiResult<TemplateProductOption[]>> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name")
    .eq("organization_id", organizationId)
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const options = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { name: string }).name,
  }));

  return { data: options, error: null };
}

export async function getTemplateById(
  organizationId: string,
  templateId: string,
): Promise<ApiResult<Template | null>> {
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", templateId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function createTemplate(input: CreateTemplateInput): Promise<ApiResult<Template>> {
  const { data, error } = await supabase.from("templates").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateTemplate(input: UpdateTemplateInput): Promise<ApiResult<Template>> {
  const { id, ...payload } = input;

  const { data, error } = await supabase
    .from("templates")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function setTemplateStatus(
  templateId: string,
  status: TemplateStatus,
): Promise<ApiResult<Template>> {
  const { data, error } = await supabase
    .from("templates")
    .update({ status })
    .eq("id", templateId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function getTemplateLinkedProductIds(
  organizationId: string,
  templateId: string,
): Promise<ApiResult<string[]>> {
  const { data, error } = await supabase
    .from("template_products")
    .select("product_id")
    .eq("organization_id", organizationId)
    .eq("template_id", templateId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: (data ?? []).map((row) => (row as { product_id: string }).product_id),
    error: null,
  };
}

export async function syncTemplateProducts(
  input: SyncTemplateProductsInput,
): Promise<ApiResult<null>> {
  const existingResult = await getTemplateLinkedProductIds(input.organizationId, input.templateId);
  if (existingResult.error || !existingResult.data) {
    return {
      data: null,
      error: existingResult.error ?? "Failed to load linked products",
    };
  }

  const current = new Set(existingResult.data);
  const next = new Set(input.productIds);

  const toDelete = Array.from(current).filter((productId) => !next.has(productId));
  const toInsert = Array.from(next).filter((productId) => !current.has(productId));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("template_products")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("template_id", input.templateId)
      .in("product_id", toDelete);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  if (toInsert.length > 0) {
    const insertPayload = toInsert.map((productId) => ({
      organization_id: input.organizationId,
      template_id: input.templateId,
      product_id: productId,
      created_by: input.userId,
    }));

    const { error } = await supabase.from("template_products").insert(insertPayload);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  return { data: null, error: null };
}

export async function getTemplateUsedInSummary(
  organizationId: string,
  templateId: string,
): Promise<ApiResult<TemplateUsedInSummary>> {
  const { count: interactionsCount, error: interactionsError } = await supabase
    .from("interactions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("template_id", templateId);

  if (interactionsError) {
    return { data: null, error: interactionsError.message };
  }

  const { count: interactionsWithDealCount, error: interactionsWithDealError } = await supabase
    .from("interactions")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("template_id", templateId)
    .not("deal_id", "is", null);

  if (interactionsWithDealError) {
    return { data: null, error: interactionsWithDealError.message };
  }

  // D3: count campaigns linked to this template
  const { count: campaignCount, error: campaignCountError } = await supabase
    .from("campaign_templates")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("template_id", templateId);

  if (campaignCountError) {
    return { data: null, error: campaignCountError.message };
  }

  return {
    data: {
      interactionsCount: interactionsCount ?? 0,
      interactionsWithDealCount: interactionsWithDealCount ?? 0,
      campaignCount: campaignCount ?? 0,
      dealsIndirectCount: interactionsWithDealCount ?? 0,
    },
    error: null,
  };
}
