-- ==========================================================================
-- D6: Template Markdown Bulk Import
-- ==========================================================================

-- ===================
-- 1. PREVIEW RPC
-- ===================

CREATE OR REPLACE FUNCTION public.preview_bulk_template_markdown_import(
  p_organization_id UUID,
  p_rows JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id UUID := auth.uid();
  v_row JSONB;
  v_row_ord BIGINT;
  v_row_index INTEGER;
  v_source_id TEXT;
  v_file_name TEXT;
  v_title TEXT;
  v_title_normalized TEXT;
  v_category_text TEXT;
  v_status_text TEXT;
  v_body TEXT;
  v_category public.template_category;
  v_status public.template_status;
  v_template_ids UUID[];
  v_template_id UUID;
  v_action TEXT;
  v_messages TEXT[];
  v_has_error BOOLEAN;
  v_product_ids UUID[];
  v_product_id_text TEXT;
  v_product_name TEXT;
  v_name_matches UUID[];
  v_missing_product_ids UUID[];
  v_result_rows JSONB := '[]'::JSONB;
  v_total INTEGER := 0;
  v_valid INTEGER := 0;
  v_errors INTEGER := 0;
  v_create_count INTEGER := 0;
  v_update_count INTEGER := 0;
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

  FOR v_row, v_row_ord IN
    SELECT value, ordinality
    FROM pg_catalog.jsonb_array_elements(p_rows) WITH ORDINALITY
  LOOP
    v_total := v_total + 1;
    v_messages := ARRAY[]::TEXT[];
    v_has_error := FALSE;
    v_product_ids := ARRAY[]::UUID[];
    v_template_id := NULL;
    v_category := NULL;
    v_status := NULL;

    IF (v_row ? 'row_index') AND COALESCE(v_row->>'row_index', '') ~ '^[0-9]+$' THEN
      v_row_index := (v_row->>'row_index')::INTEGER;
    ELSE
      v_row_index := v_row_ord::INTEGER;
    END IF;

    v_source_id := NULLIF(pg_catalog.btrim(COALESCE(v_row->>'source_id', '')), '');
    v_file_name := COALESCE(
      NULLIF(pg_catalog.btrim(COALESCE(v_row->>'file_name', '')), ''),
      pg_catalog.format('row-%s.md', v_row_ord)
    );

    v_title := pg_catalog.btrim(COALESCE(v_row->>'title', ''));
    v_title_normalized := pg_catalog.lower(v_title);
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
        v_messages := array_append(v_messages, 'category must be one of: cold_email, warm_outreach, content, paid_ads, offer');
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

    IF (v_row ? 'linked_product_ids') AND pg_catalog.jsonb_typeof(v_row->'linked_product_ids') = 'array' THEN
      FOR v_product_id_text IN
        SELECT value
        FROM pg_catalog.jsonb_array_elements_text(v_row->'linked_product_ids')
      LOOP
        BEGIN
          v_product_ids := array_append(v_product_ids, pg_catalog.btrim(v_product_id_text)::UUID);
        EXCEPTION
          WHEN OTHERS THEN
            v_has_error := TRUE;
            v_messages := array_append(v_messages, pg_catalog.format('linked_product_ids contains invalid UUID: %s', v_product_id_text));
        END;
      END LOOP;
    ELSIF (v_row ? 'linked_product_ids') AND pg_catalog.jsonb_typeof(v_row->'linked_product_ids') <> 'null' THEN
      v_has_error := TRUE;
      v_messages := array_append(v_messages, 'linked_product_ids must be an array');
    END IF;

    IF COALESCE(array_length(v_product_ids, 1), 0) > 0 THEN
      SELECT COALESCE(array_agg(req.id), ARRAY[]::UUID[])
      INTO v_missing_product_ids
      FROM unnest(v_product_ids) AS req(id)
      LEFT JOIN public.products p
        ON p.organization_id = p_organization_id
       AND p.id = req.id
       AND p.is_archived = FALSE
      WHERE p.id IS NULL;

      IF COALESCE(array_length(v_missing_product_ids, 1), 0) > 0 THEN
        v_has_error := TRUE;
        v_messages := array_append(
          v_messages,
          pg_catalog.format(
            'linked_product_ids contains unknown or archived products: %s',
            array_to_string(v_missing_product_ids, ', ')
          )
        );
      END IF;
    END IF;

    IF (v_row ? 'linked_product_names') AND pg_catalog.jsonb_typeof(v_row->'linked_product_names') = 'array' THEN
      FOR v_product_name IN
        SELECT pg_catalog.btrim(value)
        FROM pg_catalog.jsonb_array_elements_text(v_row->'linked_product_names')
      LOOP
        IF v_product_name = '' THEN
          v_has_error := TRUE;
          v_messages := array_append(v_messages, 'linked_product_names contains an empty value');
          CONTINUE;
        END IF;

        SELECT array_agg(p.id)
        INTO v_name_matches
        FROM public.products p
        WHERE p.organization_id = p_organization_id
          AND p.is_archived = FALSE
          AND pg_catalog.lower(pg_catalog.btrim(p.name)) = pg_catalog.lower(v_product_name);

        IF COALESCE(array_length(v_name_matches, 1), 0) = 0 THEN
          v_has_error := TRUE;
          v_messages := array_append(v_messages, pg_catalog.format('linked_product_names not found: %s', v_product_name));
          CONTINUE;
        END IF;

        IF COALESCE(array_length(v_name_matches, 1), 0) > 1 THEN
          v_has_error := TRUE;
          v_messages := array_append(v_messages, pg_catalog.format('linked_product_names is ambiguous: %s', v_product_name));
          CONTINUE;
        END IF;

        v_product_ids := array_append(v_product_ids, v_name_matches[1]);
      END LOOP;
    ELSIF (v_row ? 'linked_product_names') AND pg_catalog.jsonb_typeof(v_row->'linked_product_names') <> 'null' THEN
      v_has_error := TRUE;
      v_messages := array_append(v_messages, 'linked_product_names must be an array');
    END IF;

    SELECT COALESCE(array_agg(DISTINCT item.id), ARRAY[]::UUID[])
    INTO v_product_ids
    FROM unnest(v_product_ids) AS item(id);

    IF v_title <> '' THEN
      SELECT array_agg(t.id ORDER BY t.created_at DESC)
      INTO v_template_ids
      FROM public.templates t
      WHERE t.organization_id = p_organization_id
        AND pg_catalog.lower(pg_catalog.btrim(t.title)) = v_title_normalized;

      IF COALESCE(array_length(v_template_ids, 1), 0) > 1 THEN
        v_has_error := TRUE;
        v_messages := array_append(v_messages, 'title matches multiple templates; cannot upsert deterministically');
      ELSIF COALESCE(array_length(v_template_ids, 1), 0) = 1 THEN
        v_template_id := v_template_ids[1];
      END IF;
    END IF;

    IF v_has_error THEN
      v_action := 'error';
      v_errors := v_errors + 1;
    ELSE
      IF v_template_id IS NULL THEN
        v_action := 'create';
        v_create_count := v_create_count + 1;
      ELSE
        v_action := 'update';
        v_update_count := v_update_count + 1;
      END IF;
      v_valid := v_valid + 1;
    END IF;

    v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
      pg_catalog.jsonb_build_object(
        'row_index', v_row_index,
        'source_id', v_source_id,
        'file_name', v_file_name,
        'title', v_title,
        'category', COALESCE(v_category::TEXT, v_category_text),
        'status', COALESCE(v_status::TEXT, v_status_text),
        'action', v_action,
        'template_id', v_template_id,
        'resolved_product_ids', to_jsonb(v_product_ids),
        'messages', to_jsonb(v_messages)
      )
    );
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'total_requested', v_total,
    'valid_rows', v_valid,
    'errors', v_errors,
    'create_count', v_create_count,
    'update_count', v_update_count,
    'rows', v_result_rows
  );
END;
$$;

-- ===================
-- 2. COMMIT RPC
-- ===================

CREATE OR REPLACE FUNCTION public.commit_bulk_template_markdown_import(
  p_organization_id UUID,
  p_rows JSONB,
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
  v_row_ord BIGINT;
  v_row_index INTEGER;
  v_source_id TEXT;
  v_file_name TEXT;
  v_title TEXT;
  v_dry_run_action TEXT;
  v_result_action TEXT;
  v_template_id UUID;
  v_category public.template_category;
  v_status public.template_status;
  v_body TEXT;
  v_messages TEXT[];
  v_resolved_product_ids UUID[];
  v_result_rows JSONB := '[]'::JSONB;
  v_total_requested INTEGER := 0;
  v_preview_errors INTEGER := 0;
  v_created INTEGER := 0;
  v_updated INTEGER := 0;
  v_failed INTEGER := 0;
  v_aborted INTEGER := 0;
  v_applied BOOLEAN := FALSE;
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

  v_preview := public.preview_bulk_template_markdown_import(p_organization_id, p_rows);
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
        v_result_action := 'error';
        v_failed := v_failed + 1;
      ELSE
        v_result_action := 'aborted';
        v_aborted := v_aborted + 1;
        v_messages := array_append(v_messages, 'aborted because commit mode is abort_all and preview contains errors');
      END IF;

      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'dry_run_action', v_dry_run_action,
          'action', v_result_action,
          'template_id', NULL,
          'messages', to_jsonb(v_messages)
        )
      );
    END LOOP;

    RETURN pg_catalog.jsonb_build_object(
      'mode', p_commit_mode,
      'applied', FALSE,
      'total_requested', v_total_requested,
      'created', 0,
      'updated', 0,
      'failed', v_failed,
      'aborted', v_aborted,
      'rows', v_result_rows
    );
  END IF;

  FOR v_preview_row, v_row_ord IN
    SELECT value, ordinality
    FROM pg_catalog.jsonb_array_elements(COALESCE(v_preview->'rows', '[]'::JSONB)) WITH ORDINALITY
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
      CONTINUE;
    END IF;

    SELECT value
    INTO v_source_row
    FROM pg_catalog.jsonb_array_elements(p_rows) WITH ORDINALITY
    WHERE ordinality = v_row_ord;

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
      v_template_id := NULL;

      SELECT COALESCE(array_agg(value::UUID), ARRAY[]::UUID[])
      INTO v_resolved_product_ids
      FROM pg_catalog.jsonb_array_elements_text(COALESCE(v_preview_row->'resolved_product_ids', '[]'::JSONB));

      IF v_dry_run_action = 'create' THEN
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

        v_created := v_created + 1;
        v_result_action := 'created';
      ELSE
        v_template_id := NULLIF(v_preview_row->>'template_id', '')::UUID;
        IF v_template_id IS NULL THEN
          RAISE EXCEPTION 'missing template_id for update row';
        END IF;

        UPDATE public.templates
        SET title = v_title,
            category = v_category,
            status = v_status,
            body = v_body
        WHERE organization_id = p_organization_id
          AND id = v_template_id;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'template % no longer exists in organization %', v_template_id, p_organization_id;
        END IF;

        v_updated := v_updated + 1;
        v_result_action := 'updated';
      END IF;

      DELETE FROM public.template_products
      WHERE organization_id = p_organization_id
        AND template_id = v_template_id;

      IF COALESCE(array_length(v_resolved_product_ids, 1), 0) > 0 THEN
        INSERT INTO public.template_products (
          organization_id,
          template_id,
          product_id,
          created_by
        )
        SELECT DISTINCT
          p_organization_id,
          v_template_id,
          item.id,
          v_actor_id
        FROM unnest(v_resolved_product_ids) AS item(id);
      END IF;

      v_result_rows := v_result_rows || pg_catalog.jsonb_build_array(
        pg_catalog.jsonb_build_object(
          'row_index', v_row_index,
          'source_id', v_source_id,
          'file_name', v_file_name,
          'title', v_title,
          'dry_run_action', v_dry_run_action,
          'action', v_result_action,
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

  v_applied := TRUE;

  RETURN pg_catalog.jsonb_build_object(
    'mode', p_commit_mode,
    'applied', v_applied,
    'total_requested', v_total_requested,
    'created', v_created,
    'updated', v_updated,
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
  JSONB
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.preview_bulk_template_markdown_import(
  UUID,
  JSONB
) TO authenticated;

REVOKE ALL ON FUNCTION public.commit_bulk_template_markdown_import(
  UUID,
  JSONB,
  TEXT
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.commit_bulk_template_markdown_import(
  UUID,
  JSONB,
  TEXT
) TO authenticated;
