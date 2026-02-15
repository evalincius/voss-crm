-- ==========================================================================
-- D4: Deals Pipeline
-- ==========================================================================

-- ===================
-- 1. ENUMS
-- ===================

CREATE TYPE public.deal_stage AS ENUM (
  'prospect',
  'offer_sent',
  'interested',
  'objection',
  'validated',
  'lost'
);

-- ===================
-- 2. TABLES
-- ===================

CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  person_id UUID NOT NULL,
  product_id UUID NOT NULL,
  campaign_id UUID,
  stage public.deal_stage NOT NULL DEFAULT 'prospect',
  value NUMERIC,
  currency TEXT,
  next_step_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id),
  CONSTRAINT deals_person_fk
    FOREIGN KEY (organization_id, person_id)
    REFERENCES public.people (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT deals_product_fk
    FOREIGN KEY (organization_id, product_id)
    REFERENCES public.products (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT deals_campaign_fk
    FOREIGN KEY (organization_id, campaign_id)
    REFERENCES public.campaigns (organization_id, id)
    ON DELETE SET NULL
);

CREATE INDEX deals_org_stage_idx ON public.deals (organization_id, stage);
CREATE INDEX deals_org_product_idx ON public.deals (organization_id, product_id);
CREATE INDEX deals_org_person_idx ON public.deals (organization_id, person_id);
CREATE INDEX deals_org_updated_idx ON public.deals (organization_id, updated_at DESC);
CREATE INDEX deals_org_campaign_idx ON public.deals (organization_id, campaign_id)
  WHERE campaign_id IS NOT NULL;

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

-- ===================
-- 3. TRIGGERS
-- ===================

CREATE TRIGGER update_deals_updated_at
  BEFORE UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================
-- 4. RLS POLICIES
-- ===================

CREATE POLICY "select" ON public.deals
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.deals
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.deals
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.deals
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

-- ===================
-- 5. INTERACTION INTEGRITY HARDENING
-- ===================

-- D1 allowed arbitrary GUIDs in deal_id before deals existed.
-- Reset non-validated legacy values before introducing FK constraint.
UPDATE public.interactions
SET deal_id = NULL
WHERE deal_id IS NOT NULL;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_deals_fk
  FOREIGN KEY (organization_id, deal_id)
  REFERENCES public.deals (organization_id, id)
  ON DELETE SET NULL;

CREATE INDEX interactions_org_deal_idx
  ON public.interactions (organization_id, deal_id)
  WHERE deal_id IS NOT NULL;
