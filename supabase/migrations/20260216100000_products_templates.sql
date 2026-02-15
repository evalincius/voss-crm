-- ==========================================================================
-- D2: Library (Products + Templates)
-- ==========================================================================

-- ===================
-- 1. ENUMS
-- ===================

CREATE TYPE public.template_category AS ENUM (
  'cold_email',
  'warm_outreach',
  'content',
  'paid_ads',
  'offer'
);

CREATE TYPE public.template_status AS ENUM ('draft', 'approved', 'archived');

-- ===================
-- 2. TABLES
-- ===================

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE INDEX products_org_updated_idx ON public.products (organization_id, updated_at DESC);
CREATE INDEX products_org_name_idx ON public.products (organization_id, name);
CREATE INDEX products_org_archived_idx ON public.products (organization_id, is_archived);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category public.template_category NOT NULL,
  status public.template_status NOT NULL DEFAULT 'draft',
  body TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, id)
);

CREATE INDEX templates_org_updated_idx ON public.templates (organization_id, updated_at DESC);
CREATE INDEX templates_org_title_idx ON public.templates (organization_id, title);
CREATE INDEX templates_org_status_idx ON public.templates (organization_id, status);
CREATE INDEX templates_org_category_idx ON public.templates (organization_id, category);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.template_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  template_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT template_products_unique UNIQUE (organization_id, template_id, product_id),
  CONSTRAINT template_products_template_fk
    FOREIGN KEY (organization_id, template_id)
    REFERENCES public.templates (organization_id, id)
    ON DELETE CASCADE,
  CONSTRAINT template_products_product_fk
    FOREIGN KEY (organization_id, product_id)
    REFERENCES public.products (organization_id, id)
    ON DELETE CASCADE
);

CREATE INDEX template_products_org_template_idx
  ON public.template_products (organization_id, template_id);
CREATE INDEX template_products_org_product_idx
  ON public.template_products (organization_id, product_id);

ALTER TABLE public.template_products ENABLE ROW LEVEL SECURITY;

-- ===================
-- 3. TRIGGERS
-- ===================

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ===================
-- 4. RLS POLICIES
-- ===================

CREATE POLICY "select" ON public.products
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.products
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.products
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.products
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.templates
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.templates
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.templates
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.templates
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "select" ON public.template_products
  FOR SELECT
  USING (organization_id = public.user_current_organization_id());

CREATE POLICY "insert" ON public.template_products
  FOR INSERT
  WITH CHECK (
    organization_id = ANY(public.user_organization_ids())
    AND created_by = auth.uid()
  );

CREATE POLICY "update" ON public.template_products
  FOR UPDATE
  USING (organization_id = ANY(public.user_organization_ids()));

CREATE POLICY "delete" ON public.template_products
  FOR DELETE
  USING (organization_id = ANY(public.user_organization_ids()));

-- ===================
-- 5. INTERACTION INTEGRITY HARDENING
-- ===================

-- D1 allowed arbitrary GUIDs in these fields before products/templates existed.
-- Reset non-validated legacy values before introducing FK constraints.
UPDATE public.interactions
SET product_id = NULL
WHERE product_id IS NOT NULL;

UPDATE public.interactions
SET template_id = NULL
WHERE template_id IS NOT NULL;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_products_fk
  FOREIGN KEY (organization_id, product_id)
  REFERENCES public.products (organization_id, id)
  ON DELETE SET NULL;

ALTER TABLE public.interactions
  ADD CONSTRAINT interactions_templates_fk
  FOREIGN KEY (organization_id, template_id)
  REFERENCES public.templates (organization_id, id)
  ON DELETE SET NULL;

CREATE INDEX interactions_org_product_idx
  ON public.interactions (organization_id, product_id)
  WHERE product_id IS NOT NULL;

CREATE INDEX interactions_org_template_idx
  ON public.interactions (organization_id, template_id)
  WHERE template_id IS NOT NULL;
