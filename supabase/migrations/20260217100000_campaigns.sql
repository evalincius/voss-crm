-- ==========================================================================
-- D3: Campaigns + Membership + Metrics
-- ==========================================================================

-- ===================
-- 1. ENUMS
-- ===================

CREATE TYPE public.campaign_type AS ENUM (
  'cold_outreach',
  'warm_outreach',
  'content',
  'paid_ads'
);

-- ===================
-- 2. TABLES
-- ===================

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type public.campaign_type NOT NULL,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE INDEX campaigns_org_updated_idx ON public.campaigns (organization_id, updated_at DESC);
CREATE INDEX campaigns_org_name_idx ON public.campaigns (organization_id, name);
CREATE INDEX campaigns_org_archived_idx ON public.campaigns (organization_id, is_archived);
CREATE INDEX campaigns_org_type_idx ON public.campaigns (organization_id, type);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.campaign_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  person_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_people_unique UNIQUE (organization_id, campaign_id, person_id),
  CONSTRAINT campaign_people_campaign_fk
    FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_people_person_fk
    FOREIGN KEY (organization_id, person_id)
    REFERENCES public.people (organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX campaign_people_org_campaign_idx
  ON public.campaign_people (organization_id, campaign_id);
CREATE INDEX campaign_people_org_person_idx
  ON public.campaign_people (organization_id, person_id);

ALTER TABLE public.campaign_people ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_products_unique UNIQUE (organization_id, campaign_id, product_id),
  CONSTRAINT campaign_products_campaign_fk
    FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_products_product_fk
    FOREIGN KEY (organization_id, product_id)
    REFERENCES public.products (organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX campaign_products_org_campaign_idx
  ON public.campaign_products (organization_id, campaign_id);
CREATE INDEX campaign_products_org_product_idx
  ON public.campaign_products (organization_id, product_id);

ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.campaign_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  campaign_id UUID NOT NULL,
  template_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT campaign_templates_unique UNIQUE (organization_id, campaign_id, template_id),
  CONSTRAINT campaign_templates_campaign_fk
    FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT campaign_templates_template_fk
    FOREIGN KEY (organization_id, template_id)
    REFERENCES public.templates (organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX campaign_templates_org_campaign_idx
  ON public.campaign_templates (organization_id, campaign_id);
CREATE INDEX campaign_templates_org_template_idx
  ON public.campaign_templates (organization_id, template_id);

ALTER TABLE public.campaign_templates ENABLE ROW LEVEL SECURITY;

-- ===================
-- 3. TRIGGERS
-- ===================

CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================
-- 4. RLS POLICIES
-- ===================

CREATE POLICY "select" ON public.campaigns
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.campaigns
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.campaigns
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.campaigns
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.campaign_people
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.campaign_people
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.campaign_people
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.campaign_people
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.campaign_products
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.campaign_products
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.campaign_products
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.campaign_products
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.campaign_templates
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.campaign_templates
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.campaign_templates
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.campaign_templates
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

-- ===================
-- 5. INTERACTION INTEGRITY HARDENING
-- ===================

-- D1 allowed arbitrary GUIDs in campaign_id before campaigns existed.
-- Reset non-validated legacy values before introducing FK constraint.
UPDATE public.interactions
SET campaign_id = NULL
WHERE campaign_id IS NOT NULL;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_campaigns_fk
  FOREIGN KEY (organization_id, campaign_id)
  REFERENCES public.campaigns (organization_id, id)
  ON DELETE SET NULL;

CREATE INDEX interactions_org_campaign_idx
  ON public.interactions (organization_id, campaign_id)
  WHERE campaign_id IS NOT NULL;
