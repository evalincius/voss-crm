-- ==========================================================================
-- D5: Dashboard follow-ups performance indexes
-- ==========================================================================

CREATE INDEX deals_org_next_step_due_idx
  ON public.deals (organization_id, next_step_at)
  WHERE next_step_at IS NOT NULL AND stage <> 'lost';
