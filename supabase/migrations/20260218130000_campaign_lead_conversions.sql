-- ==========================================================================
-- D4.x: Campaign Lead Conversions (manual, transactional RPC)
-- ==========================================================================

-- ===================
-- 1. SINGLE CONVERSION RPC
-- ===================

CREATE OR REPLACE FUNCTION public.convert_campaign_lead(
  p_organization_id UUID,
  p_campaign_id UUID,
  p_mode TEXT,
  p_person_id UUID DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_lifecycle public.person_lifecycle DEFAULT 'new',
  p_product_id UUID DEFAULT NULL,
  p_value NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_next_step_at TIMESTAMPTZ DEFAULT NULL,
  p_deal_notes TEXT DEFAULT NULL,
  p_interaction_summary TEXT DEFAULT NULL,
  p_interaction_type public.interaction_type DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_campaign public.campaigns%ROWTYPE;
  v_person_id UUID := p_person_id;
  v_created_person BOOLEAN := FALSE;
  v_reused_existing_person BOOLEAN := FALSE;
  v_membership_id UUID := NULL;
  v_added_campaign_membership BOOLEAN := FALSE;
  v_deal_id UUID := NULL;
  v_existing_duplicate_deal_id UUID := NULL;
  v_had_open_duplicate BOOLEAN := FALSE;
  v_interaction_id UUID := NULL;
  v_interaction_type public.interaction_type;
  v_interaction_summary TEXT;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (p_organization_id = ANY(public.user_organization_ids())) THEN
    RAISE EXCEPTION 'User does not belong to organization %', p_organization_id;
  END IF;

  IF p_mode NOT IN ('contact_only', 'contact_and_deal', 'deal_only') THEN
    RAISE EXCEPTION 'Invalid conversion mode: %', p_mode;
  END IF;

  SELECT *
  INTO v_campaign
  FROM public.campaigns
  WHERE organization_id = p_organization_id
    AND id = p_campaign_id
    AND is_archived = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active campaign % not found in organization %', p_campaign_id, p_organization_id;
  END IF;

  IF p_mode = 'deal_only' AND p_person_id IS NULL THEN
    RAISE EXCEPTION 'person_id is required for deal_only conversion';
  END IF;

  IF p_mode IN ('contact_and_deal', 'deal_only') AND p_product_id IS NULL THEN
    RAISE EXCEPTION 'product_id is required when creating a deal';
  END IF;

  IF p_product_id IS NOT NULL THEN
    PERFORM 1
    FROM public.products
    WHERE organization_id = p_organization_id
      AND id = p_product_id
      AND is_archived = FALSE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Active product % not found in organization %', p_product_id, p_organization_id;
    END IF;
  END IF;

  IF v_person_id IS NOT NULL THEN
    SELECT id
    INTO v_person_id
    FROM public.people
    WHERE organization_id = p_organization_id
      AND id = v_person_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Person % not found in organization %', p_person_id, p_organization_id;
    END IF;
  ELSIF COALESCE(NULLIF(BTRIM(p_email), ''), '') <> '' THEN
    SELECT id
    INTO v_person_id
    FROM public.people
    WHERE organization_id = p_organization_id
      AND email IS NOT NULL
      AND LOWER(email) = LOWER(BTRIM(p_email))
    LIMIT 1;

    IF FOUND THEN
      v_reused_existing_person := TRUE;
    END IF;
  END IF;

  IF v_person_id IS NULL THEN
    IF COALESCE(NULLIF(BTRIM(p_full_name), ''), '') = '' THEN
      RAISE EXCEPTION 'full_name is required when creating a new contact';
    END IF;

    INSERT INTO public.people (
      organization_id,
      full_name,
      email,
      phone,
      notes,
      lifecycle,
      created_by
    )
    VALUES (
      p_organization_id,
      BTRIM(p_full_name),
      NULLIF(BTRIM(p_email), ''),
      NULLIF(BTRIM(p_phone), ''),
      NULLIF(BTRIM(p_notes), ''),
      p_lifecycle,
      v_actor_id
    )
    RETURNING id INTO v_person_id;

    v_created_person := TRUE;
  END IF;

  INSERT INTO public.campaign_people (
    organization_id,
    campaign_id,
    person_id,
    created_by
  )
  VALUES (
    p_organization_id,
    p_campaign_id,
    v_person_id,
    v_actor_id
  )
  ON CONFLICT (organization_id, campaign_id, person_id) DO NOTHING
  RETURNING id INTO v_membership_id;

  IF v_membership_id IS NOT NULL THEN
    v_added_campaign_membership := TRUE;
  END IF;

  IF p_mode IN ('contact_and_deal', 'deal_only') THEN
    SELECT id
    INTO v_existing_duplicate_deal_id
    FROM public.deals
    WHERE organization_id = p_organization_id
      AND person_id = v_person_id
      AND product_id = p_product_id
      AND stage <> 'lost'
    ORDER BY created_at DESC
    LIMIT 1;

    v_had_open_duplicate := v_existing_duplicate_deal_id IS NOT NULL;

    INSERT INTO public.deals (
      organization_id,
      person_id,
      product_id,
      campaign_id,
      stage,
      value,
      currency,
      next_step_at,
      notes,
      created_by
    )
    VALUES (
      p_organization_id,
      v_person_id,
      p_product_id,
      p_campaign_id,
      'prospect',
      p_value,
      NULLIF(BTRIM(p_currency), ''),
      p_next_step_at,
      NULLIF(BTRIM(p_deal_notes), ''),
      v_actor_id
    )
    RETURNING id INTO v_deal_id;
  END IF;

  v_interaction_type := COALESCE(
    p_interaction_type,
    CASE
      WHEN v_campaign.type IN ('cold_outreach', 'warm_outreach') THEN 'email'::public.interaction_type
      ELSE 'form_submission'::public.interaction_type
    END
  );

  v_interaction_summary := COALESCE(
    NULLIF(BTRIM(p_interaction_summary), ''),
    CASE
      WHEN p_mode = 'contact_only' THEN FORMAT('Lead captured from campaign "%s"', v_campaign.name)
      WHEN p_mode = 'deal_only' THEN FORMAT('Campaign member converted to deal from "%s"', v_campaign.name)
      ELSE FORMAT('Lead converted to contact + deal from "%s"', v_campaign.name)
    END
  );

  INSERT INTO public.interactions (
    organization_id,
    person_id,
    type,
    summary,
    next_step_at,
    occurred_at,
    deal_id,
    campaign_id,
    product_id,
    created_by
  )
  VALUES (
    p_organization_id,
    v_person_id,
    v_interaction_type,
    v_interaction_summary,
    p_next_step_at,
    now(),
    v_deal_id,
    p_campaign_id,
    p_product_id,
    v_actor_id
  )
  RETURNING id INTO v_interaction_id;

  RETURN jsonb_build_object(
    'person_id', v_person_id,
    'created_person', v_created_person,
    'reused_existing_person', v_reused_existing_person,
    'added_campaign_membership', v_added_campaign_membership,
    'deal_id', v_deal_id,
    'created_deal', v_deal_id IS NOT NULL,
    'had_open_duplicate', v_had_open_duplicate,
    'existing_duplicate_deal_id', v_existing_duplicate_deal_id,
    'interaction_id', v_interaction_id,
    'interaction_type', v_interaction_type,
    'conversion_mode', p_mode
  );
END;
$$;

-- ===================
-- 2. BULK DUPLICATE PREVIEW RPC
-- ===================

CREATE OR REPLACE FUNCTION public.preview_bulk_campaign_deal_duplicates(
  p_organization_id UUID,
  p_campaign_id UUID,
  p_person_ids UUID[],
  p_product_id UUID
)
RETURNS TABLE (
  person_id UUID,
  full_name TEXT,
  duplicate_deal_id UUID,
  duplicate_stage public.deal_stage,
  duplicate_created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (p_organization_id = ANY(public.user_organization_ids())) THEN
    RAISE EXCEPTION 'User does not belong to organization %', p_organization_id;
  END IF;

  PERFORM 1
  FROM public.campaigns
  WHERE organization_id = p_organization_id
    AND id = p_campaign_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Campaign % not found in organization %', p_campaign_id, p_organization_id;
  END IF;

  PERFORM 1
  FROM public.products
  WHERE organization_id = p_organization_id
    AND id = p_product_id
    AND is_archived = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active product % not found in organization %', p_product_id, p_organization_id;
  END IF;

  RETURN QUERY
  WITH requested_people AS (
    SELECT DISTINCT u.person_id
    FROM unnest(COALESCE(p_person_ids, ARRAY[]::UUID[])) AS u(person_id)
  )
  SELECT
    p.id,
    p.full_name,
    d.id,
    d.stage,
    d.created_at
  FROM requested_people rp
  JOIN public.people p
    ON p.organization_id = p_organization_id
   AND p.id = rp.person_id
  JOIN LATERAL (
    SELECT id, stage, created_at
    FROM public.deals
    WHERE organization_id = p_organization_id
      AND person_id = p.id
      AND product_id = p_product_id
      AND stage <> 'lost'
    ORDER BY created_at DESC
    LIMIT 1
  ) d ON TRUE
  ORDER BY p.full_name;
END;
$$;

-- ===================
-- 3. BULK CONVERSION RPC
-- ===================

CREATE OR REPLACE FUNCTION public.bulk_convert_campaign_members_to_deals(
  p_organization_id UUID,
  p_campaign_id UUID,
  p_person_ids UUID[],
  p_product_id UUID,
  p_duplicate_strategy TEXT DEFAULT 'create_all',
  p_value NUMERIC DEFAULT NULL,
  p_currency TEXT DEFAULT NULL,
  p_next_step_at TIMESTAMPTZ DEFAULT NULL,
  p_deal_notes TEXT DEFAULT NULL,
  p_interaction_summary TEXT DEFAULT NULL,
  p_interaction_type public.interaction_type DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_campaign public.campaigns%ROWTYPE;
  v_interaction_type public.interaction_type;
  v_person_id UUID;
  v_person_name TEXT;
  v_existing_duplicate_deal_id UUID;
  v_deal_id UUID;
  v_interaction_id UUID;
  v_result_rows JSONB := '[]'::JSONB;
  v_total_requested INTEGER := 0;
  v_created_deals INTEGER := 0;
  v_skipped_duplicates INTEGER := 0;
  v_errors INTEGER := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (p_organization_id = ANY(public.user_organization_ids())) THEN
    RAISE EXCEPTION 'User does not belong to organization %', p_organization_id;
  END IF;

  IF p_duplicate_strategy NOT IN ('create_all', 'skip_duplicates') THEN
    RAISE EXCEPTION 'Invalid duplicate strategy: %', p_duplicate_strategy;
  END IF;

  IF COALESCE(array_length(p_person_ids, 1), 0) = 0 THEN
    RETURN jsonb_build_object(
      'total_requested', 0,
      'created_deals', 0,
      'skipped_duplicates', 0,
      'errors', 0,
      'results', '[]'::jsonb
    );
  END IF;

  SELECT *
  INTO v_campaign
  FROM public.campaigns
  WHERE organization_id = p_organization_id
    AND id = p_campaign_id
    AND is_archived = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active campaign % not found in organization %', p_campaign_id, p_organization_id;
  END IF;

  PERFORM 1
  FROM public.products
  WHERE organization_id = p_organization_id
    AND id = p_product_id
    AND is_archived = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active product % not found in organization %', p_product_id, p_organization_id;
  END IF;

  v_interaction_type := COALESCE(
    p_interaction_type,
    CASE
      WHEN v_campaign.type IN ('cold_outreach', 'warm_outreach') THEN 'email'::public.interaction_type
      ELSE 'form_submission'::public.interaction_type
    END
  );

  FOR v_person_id IN
    SELECT DISTINCT u.person_id
    FROM unnest(COALESCE(p_person_ids, ARRAY[]::UUID[])) AS u(person_id)
  LOOP
    v_total_requested := v_total_requested + 1;

    BEGIN
      SELECT p.full_name
      INTO v_person_name
      FROM public.people p
      WHERE p.organization_id = p_organization_id
        AND p.id = v_person_id;

      IF NOT FOUND THEN
        RAISE EXCEPTION 'Person % not found in organization %', v_person_id, p_organization_id;
      END IF;

      INSERT INTO public.campaign_people (
        organization_id,
        campaign_id,
        person_id,
        created_by
      )
      VALUES (
        p_organization_id,
        p_campaign_id,
        v_person_id,
        v_actor_id
      )
      ON CONFLICT (organization_id, campaign_id, person_id) DO NOTHING;

      SELECT id
      INTO v_existing_duplicate_deal_id
      FROM public.deals
      WHERE organization_id = p_organization_id
        AND person_id = v_person_id
        AND product_id = p_product_id
        AND stage <> 'lost'
      ORDER BY created_at DESC
      LIMIT 1;

      IF v_existing_duplicate_deal_id IS NOT NULL AND p_duplicate_strategy = 'skip_duplicates' THEN
        v_skipped_duplicates := v_skipped_duplicates + 1;
        v_result_rows := v_result_rows || jsonb_build_array(
          jsonb_build_object(
            'person_id', v_person_id,
            'person_name', v_person_name,
            'status', 'skipped_duplicate',
            'duplicate_deal_id', v_existing_duplicate_deal_id,
            'deal_id', NULL,
            'interaction_id', NULL,
            'error', NULL
          )
        );

        CONTINUE;
      END IF;

      INSERT INTO public.deals (
        organization_id,
        person_id,
        product_id,
        campaign_id,
        stage,
        value,
        currency,
        next_step_at,
        notes,
        created_by
      )
      VALUES (
        p_organization_id,
        v_person_id,
        p_product_id,
        p_campaign_id,
        'prospect',
        p_value,
        NULLIF(BTRIM(p_currency), ''),
        p_next_step_at,
        NULLIF(BTRIM(p_deal_notes), ''),
        v_actor_id
      )
      RETURNING id INTO v_deal_id;

      INSERT INTO public.interactions (
        organization_id,
        person_id,
        type,
        summary,
        next_step_at,
        occurred_at,
        deal_id,
        campaign_id,
        product_id,
        created_by
      )
      VALUES (
        p_organization_id,
        v_person_id,
        v_interaction_type,
        COALESCE(
          NULLIF(BTRIM(p_interaction_summary), ''),
          FORMAT('Campaign member converted to deal from "%s"', v_campaign.name)
        ),
        p_next_step_at,
        now(),
        v_deal_id,
        p_campaign_id,
        p_product_id,
        v_actor_id
      )
      RETURNING id INTO v_interaction_id;

      v_created_deals := v_created_deals + 1;
      v_result_rows := v_result_rows || jsonb_build_array(
        jsonb_build_object(
          'person_id', v_person_id,
          'person_name', v_person_name,
          'status', 'created',
          'duplicate_deal_id', v_existing_duplicate_deal_id,
          'deal_id', v_deal_id,
          'interaction_id', v_interaction_id,
          'error', NULL
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_errors := v_errors + 1;
        v_result_rows := v_result_rows || jsonb_build_array(
          jsonb_build_object(
            'person_id', v_person_id,
            'person_name', COALESCE(v_person_name, NULL),
            'status', 'error',
            'duplicate_deal_id', v_existing_duplicate_deal_id,
            'deal_id', NULL,
            'interaction_id', NULL,
            'error', SQLERRM
          )
        );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'total_requested', v_total_requested,
    'created_deals', v_created_deals,
    'skipped_duplicates', v_skipped_duplicates,
    'errors', v_errors,
    'results', v_result_rows
  );
END;
$$;

-- ===================
-- 4. RPC EXECUTE RIGHTS
-- ===================

REVOKE ALL ON FUNCTION public.convert_campaign_lead(
  UUID,
  UUID,
  TEXT,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.person_lifecycle,
  UUID,
  NUMERIC,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  public.interaction_type
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.convert_campaign_lead(
  UUID,
  UUID,
  TEXT,
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  public.person_lifecycle,
  UUID,
  NUMERIC,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  public.interaction_type
) TO authenticated;

REVOKE ALL ON FUNCTION public.preview_bulk_campaign_deal_duplicates(
  UUID,
  UUID,
  UUID[],
  UUID
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.preview_bulk_campaign_deal_duplicates(
  UUID,
  UUID,
  UUID[],
  UUID
) TO authenticated;

REVOKE ALL ON FUNCTION public.bulk_convert_campaign_members_to_deals(
  UUID,
  UUID,
  UUID[],
  UUID,
  TEXT,
  NUMERIC,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  public.interaction_type
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.bulk_convert_campaign_members_to_deals(
  UUID,
  UUID,
  UUID[],
  UUID,
  TEXT,
  NUMERIC,
  TEXT,
  TIMESTAMPTZ,
  TEXT,
  TEXT,
  public.interaction_type
) TO authenticated;
