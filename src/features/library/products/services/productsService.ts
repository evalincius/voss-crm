import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import {
  type CreateProductInput,
  type DealStage,
  type LinkedCampaignSummary,
  type LinkedTemplateSummary,
  type Product,
  type ProductListParams,
  type ProductPerformanceSummary,
  type ProductStageCounts,
  type UpdateProductInput,
} from "@/features/library/products/types";

function escapeLikeValue(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

function emptyStageCounts(): ProductStageCounts {
  return {
    prospect: 0,
    offer_sent: 0,
    interested: 0,
    objection: 0,
    validated: 0,
    lost: 0,
  };
}

export async function listProducts(params: ProductListParams): Promise<ApiResult<Product[]>> {
  let query = supabase.from("products").select("*").eq("organization_id", params.organizationId);

  if (params.archiveFilter === "active") {
    query = query.eq("is_archived", false);
  }

  if (params.archiveFilter === "archived") {
    query = query.eq("is_archived", true);
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch.length > 0) {
    const escaped = escapeLikeValue(trimmedSearch);
    query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
  }

  if (params.sort === "name_asc") {
    query = query.order("name", { ascending: true });
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

export async function listProductOptions(organizationId: string): Promise<ApiResult<Product[]>> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? [], error: null };
}

export async function getProductById(
  organizationId: string,
  productId: string,
): Promise<ApiResult<Product | null>> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", productId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function createProduct(input: CreateProductInput): Promise<ApiResult<Product>> {
  const { data, error } = await supabase.from("products").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateProduct(input: UpdateProductInput): Promise<ApiResult<Product>> {
  const { id, ...payload } = input;

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function archiveProduct(productId: string): Promise<ApiResult<Product>> {
  const { data, error } = await supabase
    .from("products")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function unarchiveProduct(productId: string): Promise<ApiResult<Product>> {
  const { data, error } = await supabase
    .from("products")
    .update({ is_archived: false, archived_at: null })
    .eq("id", productId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function listLinkedTemplatesForProduct(
  organizationId: string,
  productId: string,
): Promise<ApiResult<LinkedTemplateSummary[]>> {
  const { data, error } = await supabase
    .from("template_products")
    .select("template_id, templates!template_products_template_fk(id, title, category, status)")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const linkedTemplates: LinkedTemplateSummary[] = (data ?? [])
    .map((row) => {
      const template = (row as { templates?: unknown }).templates as
        | {
            id: string;
            title: string;
            category: string;
            status: string;
          }
        | undefined;

      if (!template) {
        return null;
      }

      return {
        id: template.id,
        title: template.title,
        category: template.category,
        status: template.status,
      };
    })
    .filter((value): value is LinkedTemplateSummary => value !== null);

  return { data: linkedTemplates, error: null };
}

export async function listLinkedCampaignsForProduct(
  organizationId: string,
  productId: string,
): Promise<ApiResult<LinkedCampaignSummary[]>> {
  const { data, error } = await supabase
    .from("campaign_products")
    .select("campaign_id, campaigns!campaign_products_campaign_fk(id, name, type)")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const linked: LinkedCampaignSummary[] = (data ?? [])
    .map((row) => {
      const campaign = (row as { campaigns?: unknown }).campaigns as
        | { id: string; name: string; type: string }
        | undefined;

      if (!campaign) {
        return null;
      }

      return { id: campaign.id, name: campaign.name, type: campaign.type };
    })
    .filter((value): value is LinkedCampaignSummary => value !== null);

  return { data: linked, error: null };
}

export async function getProductPerformanceSummary(
  organizationId: string,
  productId: string,
): Promise<ApiResult<ProductPerformanceSummary>> {
  const linkedTemplatesResult = await listLinkedTemplatesForProduct(organizationId, productId);

  if (linkedTemplatesResult.error || !linkedTemplatesResult.data) {
    return {
      data: null,
      error: linkedTemplatesResult.error ?? "Failed to load linked templates",
    };
  }

  const linkedCampaignsResult = await listLinkedCampaignsForProduct(organizationId, productId);

  if (linkedCampaignsResult.error || !linkedCampaignsResult.data) {
    return {
      data: null,
      error: linkedCampaignsResult.error ?? "Failed to load linked campaigns",
    };
  }

  const { data: dealRows, error: dealsError } = await supabase
    .from("deals")
    .select("stage")
    .eq("organization_id", organizationId)
    .eq("product_id", productId);

  if (dealsError) {
    return { data: null, error: dealsError.message };
  }

  const stageCounts = emptyStageCounts();
  for (const row of dealRows ?? []) {
    const stage = (row as { stage: string }).stage as DealStage;
    if (stage in stageCounts) {
      stageCounts[stage] += 1;
    }
  }

  return {
    data: {
      stageCounts,
      relatedCampaigns: linkedCampaignsResult.data,
      linkedTemplates: linkedTemplatesResult.data,
    },
    error: null,
  };
}
