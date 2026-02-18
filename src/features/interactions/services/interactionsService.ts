import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  InteractionAssociationOptions,
  InteractionCampaignOption,
  InteractionDealContext,
  InteractionDealOption,
  InteractionProductOption,
  InteractionTemplateOption,
  CreateInteractionInput,
  Interaction,
  InteractionOrderBy,
  PersonInteraction,
} from "@/features/interactions/types";

export async function listInteractionsByPerson(
  organizationId: string,
  personId: string,
  orderBy: InteractionOrderBy,
): Promise<ApiResult<PersonInteraction[]>> {
  const isAscending = orderBy === "created_asc";

  const { data, error } = await supabase
    .from("interactions")
    .select("*, deals:deals!interactions_deals_fk(stage, products:products!deals_product_fk(name))")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("created_at", { ascending: isAscending });

  if (error) {
    return { data: null, error: error.message };
  }

  const interactions: PersonInteraction[] = (data ?? []).map((row) => {
    const deal = (row as { deals?: unknown }).deals as
      | {
          stage: PersonInteraction["deal_stage"];
          products?: { name: string } | null;
        }
      | null
      | undefined;

    const interaction = row as Interaction;

    return {
      ...interaction,
      deal_stage: deal?.stage ?? null,
      deal_product_name: deal?.products?.name ?? null,
    };
  });

  return { data: interactions, error: null };
}

export async function getInteractionDealContext(
  organizationId: string,
  dealId: string,
): Promise<ApiResult<InteractionDealContext | null>> {
  const { data, error } = await supabase
    .from("deals")
    .select(
      "id, product_id, campaign_id, people:people!deals_person_fk(full_name), products:products!deals_product_fk(name), campaigns:campaigns!deals_campaign_fk(name)",
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
  const campaign = (data as { campaigns?: unknown }).campaigns as { name: string } | undefined;
  const row = data as { id: string; product_id: string; campaign_id: string | null };
  const personName = person?.full_name?.trim() ?? "";
  const productName = product?.name?.trim() ?? "";

  const dealLabel =
    personName && productName
      ? `${personName} - ${productName}`
      : productName || personName || `Deal #${row.id.slice(0, 8)}`;

  return {
    data: {
      deal_id: row.id,
      product_id: row.product_id,
      campaign_id: row.campaign_id,
      deal_label: dealLabel,
      product_name: product?.name ?? "Unknown product",
      campaign_name: campaign?.name ?? null,
    },
    error: null,
  };
}

export async function listInteractionDealsByPerson(
  organizationId: string,
  personId: string,
): Promise<ApiResult<InteractionDealOption[]>> {
  const { data, error } = await supabase
    .from("deals")
    .select("id, product_id, campaign_id, stage, products:products!deals_product_fk(name)")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("updated_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const deals: InteractionDealOption[] = (data ?? []).map((row) => {
    const product = (row as { products?: unknown }).products as { name: string } | undefined;
    const typedRow = row as {
      id: string;
      product_id: string;
      campaign_id: string | null;
      stage: string;
    };

    return {
      id: typedRow.id,
      label: `${product?.name ?? "Unknown product"} (${typedRow.stage.replace(/_/g, " ")})`,
      product_id: typedRow.product_id,
      campaign_id: typedRow.campaign_id,
    };
  });

  return { data: deals, error: null };
}

export async function listInteractionCampaignOptions(
  organizationId: string,
): Promise<ApiResult<InteractionCampaignOption[]>> {
  const [campaignsResult, campaignProductsResult] = await Promise.all([
    supabase
      .from("campaigns")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("is_archived", false)
      .order("name", { ascending: true }),
    supabase
      .from("campaign_products")
      .select("campaign_id, product_id")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false }),
  ]);

  if (campaignsResult.error) {
    return { data: null, error: campaignsResult.error.message };
  }

  if (campaignProductsResult.error) {
    return { data: null, error: campaignProductsResult.error.message };
  }

  const campaignToProductId = new Map<string, string>();
  for (const row of campaignProductsResult.data ?? []) {
    const campaignId = (row as { campaign_id: string }).campaign_id;
    const productId = (row as { product_id: string | null }).product_id;

    if (!campaignToProductId.has(campaignId) && productId) {
      campaignToProductId.set(campaignId, productId);
    }
  }

  const options: InteractionCampaignOption[] = (campaignsResult.data ?? []).map((row) => {
    const campaignId = (row as { id: string }).id;
    return {
      id: campaignId,
      name: (row as { name: string }).name,
      product_id: campaignToProductId.get(campaignId) ?? null,
    };
  });

  return { data: options, error: null };
}

export async function listInteractionProductOptions(
  organizationId: string,
): Promise<ApiResult<InteractionProductOption[]>> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name")
    .eq("organization_id", organizationId)
    .eq("is_archived", false)
    .order("name", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const options: InteractionProductOption[] = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    name: (row as { name: string }).name,
  }));

  return { data: options, error: null };
}

export async function listInteractionTemplateOptions(
  organizationId: string,
): Promise<ApiResult<InteractionTemplateOption[]>> {
  const { data, error } = await supabase
    .from("templates")
    .select("id, title")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("title", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const options: InteractionTemplateOption[] = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    title: (row as { title: string }).title,
  }));

  return { data: options, error: null };
}

export async function listInteractionTemplateOptionsByProduct(
  organizationId: string,
  productId: string,
): Promise<ApiResult<InteractionTemplateOption[]>> {
  const { data, error } = await supabase
    .from("template_products")
    .select("templates:templates!template_products_template_fk(id, title, status)")
    .eq("organization_id", organizationId)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const unique = new Map<string, InteractionTemplateOption>();

  for (const row of data ?? []) {
    const template = (row as { templates?: unknown }).templates as
      | { id: string; title: string; status: string }
      | undefined;

    if (!template || template.status === "archived" || unique.has(template.id)) {
      continue;
    }

    unique.set(template.id, { id: template.id, title: template.title });
  }

  return { data: Array.from(unique.values()), error: null };
}

export async function listInteractionAssociationOptions(
  organizationId: string,
  personId: string,
): Promise<ApiResult<InteractionAssociationOptions>> {
  const [dealsResult, campaignsResult, productsResult, templatesResult] = await Promise.all([
    listInteractionDealsByPerson(organizationId, personId),
    listInteractionCampaignOptions(organizationId),
    listInteractionProductOptions(organizationId),
    listInteractionTemplateOptions(organizationId),
  ]);

  if (dealsResult.error || !dealsResult.data) {
    return { data: null, error: dealsResult.error ?? "Failed to load deals" };
  }

  if (campaignsResult.error || !campaignsResult.data) {
    return { data: null, error: campaignsResult.error ?? "Failed to load campaigns" };
  }

  if (productsResult.error || !productsResult.data) {
    return { data: null, error: productsResult.error ?? "Failed to load products" };
  }

  if (templatesResult.error || !templatesResult.data) {
    return { data: null, error: templatesResult.error ?? "Failed to load templates" };
  }

  return {
    data: {
      deals: dealsResult.data,
      campaigns: campaignsResult.data,
      products: productsResult.data,
      templates: templatesResult.data,
    },
    error: null,
  };
}

export async function createInteraction(
  input: CreateInteractionInput,
): Promise<ApiResult<Interaction>> {
  const { data, error } = await supabase.from("interactions").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function deleteInteraction(
  interactionId: string,
  organizationId: string,
  personId: string,
): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("interactions")
    .delete()
    .eq("id", interactionId)
    .eq("organization_id", organizationId)
    .eq("person_id", personId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}
