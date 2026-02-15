-- ==========================================================================
-- D1: People + Interactions
-- Notes:
-- - Optional interaction associations (deal/campaign/template/product) are
--   intentionally stored as nullable UUIDs without FK constraints in D1.
-- - Hard FK + cross-entity guardrails for those IDs are deferred to D2-D4.
-- ==========================================================================

-- ===================
-- 1. ENUMS
-- ===================

CREATE TYPE public.person_lifecycle AS ENUM ('new', 'contacted', 'engaged', 'customer');
CREATE TYPE public.interaction_type AS ENUM (
  'email',
  'call',
  'dm',
  'meeting',
  'note',
  'form_submission',
  'other'
);

-- ===================
-- 2. TABLES
-- ===================

CREATE TABLE public.people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  lifecycle public.person_lifecycle NOT NULL DEFAULT 'new',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE INDEX people_org_updated_idx ON public.people (organization_id, updated_at DESC);
CREATE INDEX people_org_created_idx ON public.people (organization_id, created_at DESC);
CREATE INDEX people_org_lifecycle_idx ON public.people (organization_id, lifecycle);
CREATE INDEX people_org_archived_idx ON public.people (organization_id, is_archived);
CREATE INDEX people_org_full_name_idx ON public.people (organization_id, full_name);
CREATE INDEX people_org_email_idx ON public.people (organization_id, email);
CREATE INDEX people_org_phone_idx ON public.people (organization_id, phone);

ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  person_id UUID NOT NULL,
  type public.interaction_type NOT NULL,
  summary TEXT NOT NULL,
  next_step_at TIMESTAMPTZ,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deal_id UUID,
  campaign_id UUID,
  template_id UUID,
  product_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT interactions_people_fk
    FOREIGN KEY (organization_id, person_id)
    REFERENCES public.people(organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX interactions_org_person_occurred_idx
  ON public.interactions (organization_id, person_id, occurred_at DESC, created_at DESC);
CREATE INDEX interactions_org_next_step_idx ON public.interactions (organization_id, next_step_at);
CREATE INDEX interactions_org_created_idx ON public.interactions (organization_id, created_at DESC);

ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- ===================
-- 3. TRIGGERS
-- ===================

CREATE TRIGGER update_people_updated_at
  BEFORE UPDATE ON public.people
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_interactions_updated_at
  BEFORE UPDATE ON public.interactions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================
-- 4. RLS POLICIES
-- ===================

CREATE POLICY "select" ON public.people
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.people
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.people
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.people
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.interactions
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.interactions
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.interactions
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.interactions
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));
