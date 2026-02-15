import { supabase } from "@/lib/supabase";
import type { ApiResult } from "@/types";
import type {
  AddPeopleToCampaignInput,
  Campaign,
  CampaignListParams,
  CampaignMemberSummary,
  CampaignMetrics,
  CampaignOption,
  CreateCampaignInput,
  LinkedProductSummary,
  LinkedTemplateSummary,
  PersonCampaignMembership,
  RemovePersonFromCampaignInput,
  SyncCampaignProductsInput,
  SyncCampaignTemplatesInput,
  UpdateCampaignInput,
} from "@/features/campaigns/types";

function escapeLikeValue(value: string): string {
  return value.replace(/[%_,]/g, (match) => `\\${match}`);
}

export async function listCampaigns(params: CampaignListParams): Promise<ApiResult<Campaign[]>> {
  let query = supabase.from("campaigns").select("*").eq("organization_id", params.organizationId);

  if (params.archiveFilter === "active") {
    query = query.eq("is_archived", false);
  }

  if (params.archiveFilter === "archived") {
    query = query.eq("is_archived", true);
  }

  if (params.typeFilter !== "all") {
    query = query.eq("type", params.typeFilter);
  }

  const trimmedSearch = params.search.trim();
  if (trimmedSearch.length > 0) {
    const escaped = escapeLikeValue(trimmedSearch);
    query = query.ilike("name", `%${escaped}%`);
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

export async function getCampaignById(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<Campaign | null>> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", campaignId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data ?? null, error: null };
}

export async function createCampaign(input: CreateCampaignInput): Promise<ApiResult<Campaign>> {
  const { data, error } = await supabase.from("campaigns").insert(input).select("*").single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function updateCampaign(input: UpdateCampaignInput): Promise<ApiResult<Campaign>> {
  const { id, ...payload } = input;

  const { data, error } = await supabase
    .from("campaigns")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function archiveCampaign(campaignId: string): Promise<ApiResult<Campaign>> {
  const { data, error } = await supabase
    .from("campaigns")
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

export async function unarchiveCampaign(campaignId: string): Promise<ApiResult<Campaign>> {
  const { data, error } = await supabase
    .from("campaigns")
    .update({ is_archived: false, archived_at: null })
    .eq("id", campaignId)
    .select("*")
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data, error: null };
}

// --- M2M: Products ---

export async function getCampaignLinkedProductIds(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<string[]>> {
  const { data, error } = await supabase
    .from("campaign_products")
    .select("product_id")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: (data ?? []).map((row) => (row as { product_id: string }).product_id),
    error: null,
  };
}

export async function getCampaignLinkedProducts(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<LinkedProductSummary[]>> {
  const { data, error } = await supabase
    .from("campaign_products")
    .select("product_id, products!campaign_products_product_fk(id, name, is_archived)")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const linked: LinkedProductSummary[] = (data ?? [])
    .map((row) => {
      const product = (row as { products?: unknown }).products as
        | { id: string; name: string; is_archived: boolean }
        | undefined;

      if (!product) {
        return null;
      }

      return { id: product.id, name: product.name, is_archived: product.is_archived };
    })
    .filter((value): value is LinkedProductSummary => value !== null);

  return { data: linked, error: null };
}

export async function syncCampaignProducts(
  input: SyncCampaignProductsInput,
): Promise<ApiResult<null>> {
  const existingResult = await getCampaignLinkedProductIds(input.organizationId, input.campaignId);
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
      .from("campaign_products")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("campaign_id", input.campaignId)
      .in("product_id", toDelete);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  if (toInsert.length > 0) {
    const insertPayload = toInsert.map((productId) => ({
      organization_id: input.organizationId,
      campaign_id: input.campaignId,
      product_id: productId,
      created_by: input.userId,
    }));

    const { error } = await supabase.from("campaign_products").insert(insertPayload);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  return { data: null, error: null };
}

// --- M2M: Templates ---

export async function getCampaignLinkedTemplateIds(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<string[]>> {
  const { data, error } = await supabase
    .from("campaign_templates")
    .select("template_id")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId);

  if (error) {
    return { data: null, error: error.message };
  }

  return {
    data: (data ?? []).map((row) => (row as { template_id: string }).template_id),
    error: null,
  };
}

export async function getCampaignLinkedTemplates(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<LinkedTemplateSummary[]>> {
  const { data, error } = await supabase
    .from("campaign_templates")
    .select("template_id, templates!campaign_templates_template_fk(id, title, category, status)")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const linked: LinkedTemplateSummary[] = (data ?? [])
    .map((row) => {
      const template = (row as { templates?: unknown }).templates as
        | { id: string; title: string; category: string; status: string }
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

  return { data: linked, error: null };
}

export async function syncCampaignTemplates(
  input: SyncCampaignTemplatesInput,
): Promise<ApiResult<null>> {
  const existingResult = await getCampaignLinkedTemplateIds(input.organizationId, input.campaignId);
  if (existingResult.error || !existingResult.data) {
    return {
      data: null,
      error: existingResult.error ?? "Failed to load linked templates",
    };
  }

  const current = new Set(existingResult.data);
  const next = new Set(input.templateIds);

  const toDelete = Array.from(current).filter((templateId) => !next.has(templateId));
  const toInsert = Array.from(next).filter((templateId) => !current.has(templateId));

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from("campaign_templates")
      .delete()
      .eq("organization_id", input.organizationId)
      .eq("campaign_id", input.campaignId)
      .in("template_id", toDelete);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  if (toInsert.length > 0) {
    const insertPayload = toInsert.map((templateId) => ({
      organization_id: input.organizationId,
      campaign_id: input.campaignId,
      template_id: templateId,
      created_by: input.userId,
    }));

    const { error } = await supabase.from("campaign_templates").insert(insertPayload);

    if (error) {
      return { data: null, error: error.message };
    }
  }

  return { data: null, error: null };
}

// --- Members ---

export async function listCampaignMembers(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<CampaignMemberSummary[]>> {
  const { data, error } = await supabase
    .from("campaign_people")
    .select(
      "id, person_id, created_at, people!campaign_people_person_fk(id, full_name, email, lifecycle)",
    )
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const members: CampaignMemberSummary[] = (data ?? [])
    .map((row) => {
      const person = (row as { people?: unknown }).people as
        | { id: string; full_name: string; email: string | null; lifecycle: string }
        | undefined;

      if (!person) {
        return null;
      }

      return {
        id: (row as { id: string }).id,
        person_id: person.id,
        full_name: person.full_name,
        email: person.email,
        lifecycle: person.lifecycle,
        created_at: (row as { created_at: string }).created_at,
      };
    })
    .filter((value): value is CampaignMemberSummary => value !== null);

  return { data: members, error: null };
}

export async function addPeopleToCampaign(
  input: AddPeopleToCampaignInput,
): Promise<ApiResult<null>> {
  // Idempotent: check existing members, insert only new
  const { data: existing, error: existingError } = await supabase
    .from("campaign_people")
    .select("person_id")
    .eq("organization_id", input.organizationId)
    .eq("campaign_id", input.campaignId)
    .in("person_id", input.personIds);

  if (existingError) {
    return { data: null, error: existingError.message };
  }

  const existingIds = new Set(
    (existing ?? []).map((row) => (row as { person_id: string }).person_id),
  );
  const toInsert = input.personIds.filter((id) => !existingIds.has(id));

  if (toInsert.length === 0) {
    return { data: null, error: null };
  }

  const insertPayload = toInsert.map((personId) => ({
    organization_id: input.organizationId,
    campaign_id: input.campaignId,
    person_id: personId,
    created_by: input.userId,
  }));

  const { error } = await supabase.from("campaign_people").insert(insertPayload);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function removePersonFromCampaign(
  input: RemovePersonFromCampaignInput,
): Promise<ApiResult<null>> {
  const { error } = await supabase
    .from("campaign_people")
    .delete()
    .eq("organization_id", input.organizationId)
    .eq("campaign_id", input.campaignId)
    .eq("person_id", input.personId);

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

// --- Metrics ---

export async function getCampaignMetrics(
  organizationId: string,
  campaignId: string,
): Promise<ApiResult<CampaignMetrics>> {
  const { count: peopleAdded, error: peopleError } = await supabase
    .from("campaign_people")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId);

  if (peopleError) {
    return { data: null, error: peopleError.message };
  }

  const { data: engagedRows, error: engagedError } = await supabase
    .from("interactions")
    .select("person_id")
    .eq("organization_id", organizationId)
    .eq("campaign_id", campaignId);

  if (engagedError) {
    return { data: null, error: engagedError.message };
  }

  const uniqueEngaged = new Set(
    (engagedRows ?? []).map((row) => (row as { person_id: string }).person_id),
  );

  return {
    data: {
      peopleAdded: peopleAdded ?? 0,
      peopleEngaged: uniqueEngaged.size,
      dealsCreated: 0, // deals table doesn't exist until D4
    },
    error: null,
  };
}

// --- Search / Options ---

export async function searchPeopleForCampaign(
  organizationId: string,
  search: string,
  excludeIds: string[],
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

  if (excludeIds.length > 0) {
    // Supabase PostgREST doesn't support "not in" directly via .not().in()
    // Filter client-side for simplicity
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: error.message };
  }

  const results = (data ?? [])
    .map((row) => ({
      id: (row as { id: string }).id,
      full_name: (row as { full_name: string }).full_name,
      email: (row as { email: string | null }).email,
    }))
    .filter((person) => !excludeIds.includes(person.id));

  return { data: results, error: null };
}

export async function listCampaignOptions(
  organizationId: string,
): Promise<ApiResult<CampaignOption[]>> {
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, name")
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

export async function listCampaignTemplateOptions(
  organizationId: string,
): Promise<ApiResult<Array<{ id: string; title: string }>>> {
  const { data, error } = await supabase
    .from("templates")
    .select("id, title")
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .order("title", { ascending: true });

  if (error) {
    return { data: null, error: error.message };
  }

  const options = (data ?? []).map((row) => ({
    id: (row as { id: string }).id,
    title: (row as { title: string }).title,
  }));

  return { data: options, error: null };
}

export async function getPersonCampaignMemberships(
  organizationId: string,
  personId: string,
): Promise<ApiResult<PersonCampaignMembership[]>> {
  const { data, error } = await supabase
    .from("campaign_people")
    .select("id, campaign_id, created_at, campaigns!campaign_people_campaign_fk(id, name, type)")
    .eq("organization_id", organizationId)
    .eq("person_id", personId)
    .order("created_at", { ascending: false });

  if (error) {
    return { data: null, error: error.message };
  }

  const memberships: PersonCampaignMembership[] = (data ?? [])
    .map((row) => {
      const campaign = (row as { campaigns?: unknown }).campaigns as
        | { id: string; name: string; type: string }
        | undefined;

      if (!campaign) {
        return null;
      }

      return {
        id: (row as { id: string }).id,
        campaign_id: campaign.id,
        campaign_name: campaign.name,
        campaign_type: campaign.type as PersonCampaignMembership["campaign_type"],
        created_at: (row as { created_at: string }).created_at,
      };
    })
    .filter((value): value is PersonCampaignMembership => value !== null);

  return { data: memberships, error: null };
}
