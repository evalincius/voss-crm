# D6 Performance Pass Notes

## People List (target: up to 10k records with pagination)

- **Server-side pagination**: 20 records per page via Supabase `.range()`, no client-side filtering of full dataset
- **Index coverage**: All filter/sort columns have composite indexes starting with `organization_id`:
  - `people_org_updated_idx` (organization_id, updated_at DESC)
  - `people_org_created_idx` (organization_id, created_at DESC)
  - `people_org_lifecycle_idx` (organization_id, lifecycle)
  - `people_org_archived_idx` (organization_id, is_archived)
  - `people_org_full_name_idx`, `people_org_email_idx`, `people_org_phone_idx` for search
- **UX optimization**: `keepPreviousData` prevents layout flash between pages
- **Derived filters** (product interest, source campaign, has open deal): Pre-filter phase fetches matching person IDs via indexed joins, then applies `.in()` filter
- **Assessment**: Meets PRD target. No slow paths identified.

## Deals Board (target: interactive <= 2s on typical datasets)

- **Single query load**: All deals fetched in one org-scoped query with joined person/product names
- **Index coverage**:
  - `deals_org_stage_idx` (organization_id, stage)
  - `deals_org_product_idx` (organization_id, product_id)
  - `deals_org_person_idx` (organization_id, person_id)
  - `deals_org_updated_idx` (organization_id, updated_at DESC)
- **Optimistic updates**: Stage changes via `useUpdateDealStage` use `onMutate` to update cache immediately, with rollback on error
- **Person search**: Client-side filter on pre-loaded cards (acceptable for typical deal volumes < 500)
- **Assessment**: Meets PRD target. Optimistic updates provide instant feedback on drag/drop.

## Bundle Size

- **Manual chunk splitting** in `vite.config.ts` separates: react, router, query, radix, dndkit, forms, supabase, icons
- **Chunk size warning limit**: 600KB
- **No new dependencies added** in D6 (CSV export uses built-in Blob API)

## Query Cache Strategy

- **All query keys** include `organization_id` for tenant isolation
- **Org switch** calls `queryClient.clear()` to prevent stale cross-org data
- **TanStack Query defaults**: staleTime 0 (always revalidate), gcTime 5min

## Conclusion

No critical performance issues found. Architecture follows established best practices for multi-tenant SaaS with proper indexing, pagination, and optimistic updates.
