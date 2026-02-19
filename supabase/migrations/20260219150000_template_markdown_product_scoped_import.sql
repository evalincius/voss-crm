-- ==========================================================================
-- D6: Template Markdown Import (Product-scoped, create-only)
-- ==========================================================================

-- ===================
-- 1. PREVIEW RPC (PRODUCT-SCOPED)
-- ===================

CREATE OR REPLACE FUNCTION public.preview_bulk_template_markdown_import(
  p_organization_id UUID,
  p_rows JSONB,
  p_product_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_row JSONB;
  v_row_ordinal BIGINT;
  v_row_index INTEGER;
  v_source_id TEXT;
  v_file_name TEXT;
  v_title TEXT;
  v_category_text TEXT;
  v_status_text TEXT;
  v_category public.template_category;
  v_status public.template_status;
  v_body TEXT;
  v_messages TEXT[];
  v_has_error BOOLEAN;
  v_final_title TEXT;
  v_final_normalized TEXT;
  v_base_normalized TEXT;
  v_suffix INTEGER;
  v_reserved_titles TEXT[];
  v_result_rows JSONB := '[]'::JSONB;
  v_total_requested INTEGER := 0;
  v_valid_rows INTEGER := 0;
  v_errors INTEGER := 0;
  v_create_count INTEGER := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (p_organization_id = ANY(public.user_organization_ids())) THEN
    RAISE EXCEPTION 'User does not belong to organization %', p_organization_id;
  END IF;

  IF p_rows IS NULL OR pg_catalog.jsonb_typeof(p_rows) <> 'array' THEN
    RAISE EXCEPTION 'rows payload must be a JSON array';
  END IF;

  PERFORM 1
  FROM public.products p
  WHERE p.organization_id = p_organization_id
    AND p.id = p_product_id
    AND p.is_archived = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Active product % not found in organization %', p_product_id, p_organization_id;
  END IF;

  SELECT COALESCE(array_agg(pg_catalog.lower(pg_catalog.btrim(t.title))), ARRAY[]::TEXT[])
  INTO v_reserved_titles
  FROM public.templates t
  WHERE t.organization_id = p_organization_id;

  FOR v_row, v_row_ordinal IN
    SELECT value, ordinality
    FROM pg_catalog.jsonb_array_elements(p_rows) WITH ORDINALITY
  LOOP
    v_total_requested := v_total_requested + 1;
    v_messages := ARRAY[]::TEXT[];
    v_has_error := FALSE;
    v_category := NULL;
    v_status := NULL;

    IF (v_row ? 'row_index') AND COALESCE(v_row->>'row_index', '') ~ '^[0-9]+$' THEN
      v_row_index := (v_row->>'row_index')::INTEGER;
    ELSE
      v_row_index := v_row_ordinal::INTEGER;
    END IF;

    v_source_id := NULLIF(pg_catalog.btrim(COALESCE(v_row->>'source_id', '')), '');
    v_file_name := COALESCE(
      NULLIF(pg_catalog.btrim(COALESCE(v_row->>'file_name', '')), ''),
      pg_catalog.format('row-%s.md', v_row_ordinal)
    );

    IF v_row ? 'linked_product_ids' OR v_row ? 'linked_product_names' THEN
      v_has_error := TRUE;
      v_messages := array_append(
        v_messages,
        'linked product metadata is not allowed; select product in import dialog'
      );
    END IF;

    v_title := pg_catalog.btrim(COALESCE(v_row->>'title', ''));
    IF v_title = '' THEN
      v_has_error := TRUE;
      v_messages := array_append(v_messages, 'title is required');
    END IF;

    v_category_text := pg_catalog.btrim(COALESCE(v_row->>'category', ''));
    BEGIN
      v_category := v_category_text::public.template_category;
    EXCEPTION
      WHEN OTHERS THEN
        v_has_error := TRUE;
        v_messages := array_append(
          v_messages,
          'category must be one of: cold_email, warm_outreach, content, paid_ads, offer'
        );
    END;

    v_status_text := NULLIF(pg_catalog.btrim(COALESCE(v_row->>'status', '')), '');
    IF v_status_text IS NULL THEN
      v_status_text := 'draft';
    END IF;
    BEGIN
      v_status := v_status_text::public.template_status;
    EXCEPTION
      WHEN OTHERS THEN
        v_has_error := TRUE;
        v_messages := array_append(v_messages, 'status must be one of: draft, approved, archived');
    END;

    v_body := COALESCE(v_row->>'body', '');
    IF pg_catalog.btrim(v_body) = '' THEN
      v_has_error := TRUE;
      v_messages := array_append(v_messages, 'body is required');
    END IF;

    IF v_has_error THEN
      v_errors := v_errors + 1;
      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_ordinal', v_row_ordinal,
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'category', COALESCE(v_category::TEXT, v_category_text),
          'status', COALESCE(v_status::TEXT, v_status_text),
          'action', 'error',
          'template_id', NULL,
          'resolved_product_ids', '[]'::JSONB,
          'messages', to_jsonb(v_messages)
        )
      );
      CONTINUE;
    END IF;

    v_final_title := v_title;
    v_base_normalized := pg_catalog.lower(pg_catalog.btrim(v_title));
    v_final_normalized := v_base_normalized;
    v_suffix := 1;

    WHILE v_final_normalized = ANY(v_reserved_titles) LOOP
      v_final_title := pg_catalog.format('%s (%s)', v_title, v_suffix);
      v_final_normalized := pg_catalog.lower(pg_catalog.btrim(v_final_title));
      v_suffix := v_suffix + 1;
    END LOOP;

    IF v_final_title <> v_title THEN
      v_messages := array_append(
        v_messages,
        pg_catalog.format('duplicate title found; will create "%s"', v_final_title)
      );
    END IF;

    v_reserved_titles := array_append(v_reserved_titles, v_final_normalized);
    v_valid_rows := v_valid_rows + 1;
    v_create_count := v_create_count + 1;

    v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'row_ordinal', v_row_ordinal,
        'row_index', v_row_index,
        'source_id', v_source_id,
        'file_name', v_file_name,
        'title', v_final_title,
        'category', v_category::TEXT,
        'status', v_status::TEXT,
        'action', 'create',
        'template_id', NULL,
        'resolved_product_ids', pg_catalog.jsonb_build_array(p_product_id),
        'messages', to_jsonb(v_messages)
      )
    );
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'total_requested', v_total_requested,
    'valid_rows', v_valid_rows,
    'errors', v_errors,
    'create_count', v_create_count,
    'rows', v_result_rows
  );
END;
$$;

-- ===================
-- 2. COMMIT RPC (PRODUCT-SCOPED, CREATE-ONLY)
-- ===================

CREATE OR REPLACE FUNCTION public.commit_bulk_template_markdown_import(
  p_organization_id UUID,
  p_rows JSONB,
  p_product_id UUID,
  p_commit_mode TEXT DEFAULT 'partial'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_preview JSONB;
  v_preview_row JSONB;
  v_source_row JSONB;
  v_row_ordinal BIGINT;
  v_row_index INTEGER;
  v_source_id TEXT;
  v_file_name TEXT;
  v_title TEXT;
  v_category public.template_category;
  v_status public.template_status;
  v_body TEXT;
  v_dry_run_action TEXT;
  v_messages TEXT[];
  v_template_id UUID;
  v_result_rows JSONB := '[]'::JSONB;
  v_total_requested INTEGER := 0;
  v_preview_errors INTEGER := 0;
  v_created INTEGER := 0;
  v_failed INTEGER := 0;
  v_aborted INTEGER := 0;
BEGIN
  IF v_actor_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (p_organization_id = ANY(public.user_organization_ids())) THEN
    RAISE EXCEPTION 'User does not belong to organization %', p_organization_id;
  END IF;

  IF p_commit_mode NOT IN ('partial', 'abort_all') THEN
    RAISE EXCEPTION 'Invalid commit mode: %', p_commit_mode;
  END IF;

  v_preview := public.preview_bulk_template_markdown_import(
    p_organization_id,
    p_rows,
    p_product_id
  );

  v_total_requested := COALESCE((v_preview->>'total_requested')::INTEGER, 0);
  v_preview_errors := COALESCE((v_preview->>'errors')::INTEGER, 0);

  IF p_commit_mode = 'abort_all' AND v_preview_errors > 0 THEN
    FOR v_preview_row IN
      SELECT value
      FROM pg_catalog.jsonb_array_elements(COALESCE(v_preview->'rows', '[]'::JSONB))
    LOOP
      v_dry_run_action := COALESCE(v_preview_row->>'action', 'error');
      v_row_index := COALESCE((v_preview_row->>'row_index')::INTEGER, 0);
      v_source_id := NULLIF(pg_catalog.btrim(COALESCE(v_preview_row->>'source_id', '')), '');
      v_file_name := COALESCE(v_preview_row->>'file_name', 'unknown.md');
      v_title := COALESCE(v_preview_row->>'title', '');

      SELECT COALESCE(array_agg(value), ARRAY[]::TEXT[])
      INTO v_messages
      FROM pg_catalog.jsonb_array_elements_text(COALESCE(v_preview_row->'messages', '[]'::JSONB));

      IF v_dry_run_action = 'error' THEN
        v_failed := v_failed + 1;
        v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'row_index', v_row_index,
            'source_id', v_source_id,
            'file_name', v_file_name,
            'title', v_title,
            'dry_run_action', v_dry_run_action,
            'action', 'error',
            'template_id', NULL,
            'messages', to_jsonb(v_messages)
          )
        );
      ELSE
        v_aborted := v_aborted + 1;
        v_messages := array_append(
          v_messages,
          'aborted because commit mode is abort_all and preview contains errors'
        );
        v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'row_index', v_row_index,
            'source_id', v_source_id,
            'file_name', v_file_name,
            'title', v_title,
            'dry_run_action', v_dry_run_action,
            'action', 'aborted',
            'template_id', NULL,
            'messages', to_jsonb(v_messages)
          )
        );
      END IF;
    END LOOP;

    RETURN pg_catalog.jsonb_build_object(
      'mode', p_commit_mode,
      'applied', FALSE,
      'total_requested', v_total_requested,
      'created', 0,
      'failed', v_failed,
      'aborted', v_aborted,
      'rows', v_result_rows
    );
  END IF;

  FOR v_preview_row IN
    SELECT value
    FROM pg_catalog.jsonb_array_elements(COALESCE(v_preview->'rows', '[]'::JSONB))
  LOOP
    v_dry_run_action := COALESCE(v_preview_row->>'action', 'error');
    v_row_index := COALESCE((v_preview_row->>'row_index')::INTEGER, 0);
    v_row_ordinal := COALESCE((v_preview_row->>'row_ordinal')::BIGINT, 0);
    v_source_id := NULLIF(pg_catalog.btrim(COALESCE(v_preview_row->>'source_id', '')), '');
    v_file_name := COALESCE(v_preview_row->>'file_name', 'unknown.md');
    v_title := COALESCE(v_preview_row->>'title', '');

    SELECT COALESCE(array_agg(value), ARRAY[]::TEXT[])
    INTO v_messages
    FROM pg_catalog.jsonb_array_elements_text(COALESCE(v_preview_row->'messages', '[]'::JSONB));

    IF v_dry_run_action = 'error' THEN
      v_failed := v_failed + 1;
      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'dry_run_action', v_dry_run_action,
          'action', 'error',
          'template_id', NULL,
          'messages', to_jsonb(v_messages)
        )
      );
      CONTINUE;
    END IF;

    SELECT value
    INTO v_source_row
    FROM pg_catalog.jsonb_array_elements(p_rows) WITH ORDINALITY t(value, ordinality)
    WHERE t.ordinality = v_row_ordinal;

    IF v_source_row IS NULL THEN
      v_failed := v_failed + 1;
      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'dry_run_action', v_dry_run_action,
          'action', 'error',
          'template_id', NULL,
          'messages', to_jsonb(array_append(v_messages, 'source row payload was not found during commit'))
        )
      );
      CONTINUE;
    END IF;

    BEGIN
      v_category := (v_preview_row->>'category')::public.template_category;
      v_status := (v_preview_row->>'status')::public.template_status;
      v_body := COALESCE(v_source_row->>'body', '');

      INSERT INTO public.templates (
        organization_id,
        title,
        category,
        status,
        body,
        created_by
      )
      VALUES (
        p_organization_id,
        v_title,
        v_category,
        v_status,
        v_body,
        v_actor_id
      )
      RETURNING id INTO v_template_id;

      INSERT INTO public.template_products (
        organization_id,
        template_id,
        product_id,
        created_by
      )
      VALUES (
        p_organization_id,
        v_template_id,
        p_product_id,
        v_actor_id
      );

      v_created := v_created + 1;

      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'dry_run_action', v_dry_run_action,
          'action', 'created',
          'template_id', v_template_id,
          'messages', to_jsonb(v_messages)
        )
      );
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
          pg_catalog.jsonb_build_object(
            'row_index', v_row_index,
            'source_id', v_source_id,
            'file_name', v_file_name,
            'title', v_title,
            'dry_run_action', v_dry_run_action,
            'action', 'error',
            'template_id', NULL,
            'messages', to_jsonb(array_append(v_messages, SQLERRM))
          )
        );
    END;
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'mode', p_commit_mode,
    'applied', TRUE,
    'total_requested', v_total_requested,
    'created', v_created,
    'failed', v_failed,
    'aborted', v_aborted,
    'rows', v_result_rows
  );
END;
$$;

-- ===================
-- 3. RPC EXECUTE RIGHTS
-- ===================

REVOKE ALL ON FUNCTION public.preview_bulk_template_markdown_import(
  UUID,
  JSONB,
  UUID
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.preview_bulk_template_markdown_import(
  UUID,
  JSONB,
  UUID
) TO authenticated;

REVOKE ALL ON FUNCTION public.commit_bulk_template_markdown_import(
  UUID,
  JSONB,
  UUID,
  TEXT
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.commit_bulk_template_markdown_import(
  UUID,
  JSONB,
  UUID,
  TEXT
) TO authenticated;
