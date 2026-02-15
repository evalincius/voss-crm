# BACKLOG: Simple Sales CRM (B2C) - Phase 2

## 1. Overview

This backlog converts the Phase 2 CRM PRD into an implementation-ready sequence of vertical slices that can be developed, demoed, and validated independently. The plan keeps strict alignment with the scaffold architecture (React + Supabase + RLS + TanStack Query + vertical slices) and prioritizes end-to-end behavior over layer-by-layer buildout.

The delivery plan follows the PRD phase intent (People/Interactions -> Library -> Library navigation refinement -> Campaigns -> Deals -> Dashboard -> Polish), with an explicit `D0` shell/foundation slice to reduce integration risk. Every deliverable includes binary acceptance criteria, manual test steps, and atomic dependency-aware tasks.

## 2. Assumptions

- The scaffold PRD is already complete and all scaffold acceptance criteria have passed.
- Existing auth, org context, app shell, and RLS helper SQL functions are available and unchanged.
- Optional items in the PRD remain optional unless explicitly promoted by product direction: tags filters, `Won` stage, and global quick search.
- Owner filtering is deferred until multi-user ownership workflows are enabled (as stated in PRD).
- CSV import uses browser-side parsing; `papaparse` is only added if native parsing becomes too brittle.
- "Deals board interactive <=2s" is measured on typical seeded datasets in local/dev conditions.

## 3. Requirements (R#) + Constraints (C#)

### Requirements

- `R1` Add CRM sidebar items under AppLayout: Dashboard, People, Campaigns, Deals, Library.
- `R2` Add protected routes: `/app/dashboard`, `/app/people`, `/app/people/:id`, `/app/campaigns`, `/app/campaigns/:id`, `/app/deals`, `/app/library/products`, `/app/library/products/:id`, `/app/library/templates`, `/app/library/templates/:id`.
- `R3` Provide org-aware Global Quick Add for Person, Interaction, Deal, Campaign, Template.
- `R4` Support Person create/edit/archive with fields and lifecycle (`new|contacted|engaged|customer`).
- `R5` People list supports search (name/email/phone), lifecycle filter, sorting, and pagination/infinite loading.
- `R6` People list supports derived filters (product interest, source campaign, has open deal) and optional tags filter.
- `R7` CSV import flow supports upload, column mapping, preview, and import summary (`created/updated/skipped/errors`).
- `R8` CSV import enforces default lifecycle `new` and dedupe order: email -> phone -> create.
- `R9` Person detail hub shows header, timeline, deals, campaign memberships, templates used.
- `R10` Person detail primary actions: Add Interaction, Create Deal (manual), Add to Campaign.
- `R11` Interactions support types: `email|call|dm|meeting|note|form_submission|other`.
- `R12` Interactions require `person_id`; optional `deal_id|campaign_id|template_id|product_id`; contextual defaults from Deal/Campaign entry points.
- `R13` Interactions support `next_step_at`.
- `R14` Manual deal creation from Person detail, Campaign member list, and Quick Add; required person + primary product; optional source campaign/value/currency/next step; default stage `prospect`.
- `R15` Deal stage model: `prospect -> offer_sent -> interested -> objection -> validated -> lost` (`won` optional).
- `R16` Deal drag/drop stage changes persist after refresh.
- `R17` Deals board filters by product and person, with optional tags.
- `R18` Deal card shows person, product badge, next-step status, and last interaction relative timestamp.
- `R19` Deal drawer shows header, deal interactions subset, add interaction, template attachment via interaction association, edit next step/value.
- `R20` Multiple deals per person are allowed; warn (but allow) when open deal exists for same product.
- `R21` Campaign CRUD with fields: name, type, linked products, linked templates.
- `R22` Campaign membership supports bulk add from People list and search/add from Campaign detail; memberships visible on Person detail.
- `R23` Campaign metrics show people added, engaged people, and deals created.
- `R24` Product CRUD; product required for deal creation.
- `R25` Product detail shows pipeline counts by stage, related campaigns, linked templates, and deep link to filtered Deals board.
- `R26` Template CRUD with fields: title, category, status, body.
- `R27` Template-to-product linking (`0..n`) and template filtering by product.
- `R28` Template detail "Used In" visibility from interactions, campaigns, and deal-linked interactions.
- `R29` Dashboard follow-ups due combines deals and interactions next steps and links to target records.
- `R30` Dashboard stale deals uses configurable inactivity threshold `X` days.
- `R31` Dashboard pipeline snapshot shows per-stage counts (and optional value total).
- `R32` Dashboard top products and top campaigns use simple rank metrics from associations.
- `R33` Add org-scoped domain tables: `people`, `products`, `templates`, `template_products`, `campaigns`, `campaign_people`, `campaign_products`, `campaign_templates`, `deals`, `interactions` with audit/timestamps.
- `R34` Apply mandated RLS policy pattern to every domain table.
- `R35` Enforce integrity rules: same-org references, deal/person coherence guardrail, required deal constraints.
- `R36` Add per-org seed data: 20 People, 3 Products, 10 Templates, 4 Campaigns, 15 Deals, 30 Interactions.
- `R37` Ensure TanStack Query keys include `organization_id` and cache clears on org switch.
- `R38` Add CSV export for People and Deals.
- `R39` Complete UX refinements and performance pass; decide/implement optional global quick search.

### Constraints

- `C1` Start only after scaffold PRD acceptance criteria pass.
- `C2` Use scaffold stack and architecture patterns (React/Vite/TS/Tailwind, TanStack Query, RHF+Zod, Supabase+RLS, vertical slices).
- `C3` Additional deps limited to `@dnd-kit/*`, `date-fns`, and optional `papaparse`.
- `C4` Shared utilities stay in `src/lib/*`; no cross-feature imports.
- `C5` B2C-only model; no Companies/Accounts object.
- `C6` Manual conversion only; never auto-create deals.
- `C7` People-first model; every interaction must attach to a person.
- `C8` Metrics must be derived from explicit associations.
- `C9` Multi-tenancy isolation: no cross-org reads/writes, including direct Supabase access.
- `C10` Performance targets: People list up to 10k records with pagination/infinite; Deals board interactive <=2s on typical datasets.
- `C11` Quality gates pass: `tsc --noEmit`, `eslint .`, `vitest run`.
- `C12` Keyboard support required for core flows, including non-drag stage movement fallback.
- `C13` Keep scaffold design system and shell styling conventions.

## 4. Epics (E#) referencing R/C IDs

- `E1` CRM shell extension and org-aware foundations. Refs: `R1,R2,R3,R37,C1,C2,C13`.
- `E2` People and Interactions lifecycle workflow. Refs: `R4,R5,R6,R7,R8,R9,R10,R11,R12,R13,R35,C5,C6,C7,C12`.
- `E3` Library domain (Products + Templates). Refs: `R24,R25,R26,R27,R28,R33,R34,C2,C4,C13`.
- `E4` Campaign management and attribution metrics. Refs: `R21,R22,R23,R33,R34,C8,C9`.
- `E5` Deals pipeline, movement, and detail workflow. Refs: `R14,R15,R16,R17,R18,R19,R20,R33,R34,R35,C3,C6,C10,C12`.
- `E6` Dashboard operational insights. Refs: `R29,R30,R31,R32,C8,C10`.
- `E7` Data governance and QA readiness. Refs: `R33,R34,R35,R36,R37,C9,C11`.
- `E8` Polish, exports, performance hardening, and release gating. Refs: `R38,R39,C10,C11,C13`.

## 5. Delivery order + critical dependencies

### Deliverable order

`D0 -> D1 -> D2 -> D2.1 -> D3 -> D4 -> D5 -> D6`

### Critical dependencies

- `D0` gates all downstream work by establishing routes/nav/quick-add entry and org-aware query-key baseline.
- `D1` must land before `D3`, `D4`, and `D5` because campaigns/deals/dashboard depend on People + Interactions.
- `D2` must land before `D4` because Deal creation requires Product.
- `D2.1` should land after `D2` and before `D3` to establish a canonical Library entry point and improve discoverability of Templates.
- `D3` should land before `D5` to enable campaign-driven metrics and follow-up context.
- `D4` must land before `D5` because dashboard pipeline and follow-ups depend on deals.
- `D6` is final hardening/release gate and requires `D0-D5` complete.

## 6. Deliverables (D0..Dn)

### D0

- **Title**: CRM Shell Extension + Org Context Foundation
- **Goal**: Expose all CRM entry points in the app shell and establish org-scoped client-state conventions before domain implementation.
- **In scope**: Add CRM routes and placeholders, sidebar/header integration, global Quick Add entry, org-aware query key helpers and cache-clear usage on org switch.
- **Out of scope**: Domain CRUD persistence and dashboard/deal/person business logic.
- **Refs**: `R1,R2,R3,R37,C1,C2,C13`.

**Acceptance criteria**

- [x] Sidebar displays Dashboard, People, Campaigns, Deals, Library under authenticated app shell.
- [x] All PRD CRM routes resolve under protected `/app/*` routing and render non-error placeholder pages.
- [x] Global Quick Add can open from header and presents create intents for Person, Interaction, Deal, Campaign, Template.
- [x] Quick Add flows include current `organization_id` context in navigation/state handoff.
- [x] Query key helpers include `organization_id`, and org switch clears query cache.

**Manual test steps**

1. Log in and confirm sidebar shows all CRM nav items with scaffold-consistent active state.
2. Visit each CRM route directly and verify auth guard redirects unauthenticated users.
3. Use Quick Add from header for each entity type and confirm navigation opens the correct create entry point.
4. Switch organization and verify cached list data resets before reloading for the new org.
5. Edge case: open two tabs in two orgs and confirm tab-local route states do not leak cached records across org contexts.

**Expected outcomes**

- CRM shell is navigable end-to-end with safe org-context propagation.
- Downstream feature slices can plug into stable route and quick-add entry points.

**Artifacts produced**

- `src/app/router.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/lib/queryKeys.ts`
- `src/lib/constants.ts`
- `src/pages/*Page.tsx` (CRM placeholders)
- `tests/unit/router/*.test.tsx`

**Tasks**

#### T-D0-01 - Add CRM protected routes and placeholder pages

- **Description**: Register all required CRM paths and minimal page components using existing layouts.
- **Dependencies**: None.
- **Steps**: Define route constants; add route entries; scaffold page files with loading/error-safe placeholders.
- **Definition of Done**: Every required path renders successfully behind `ProtectedRoute`.
- **Acceptance checks**: `npm run typecheck`; route smoke tests pass.
- **Expected files/modules**: `src/app/router.tsx`, `src/pages/*`.

#### T-D0-02 - Extend sidebar/header navigation

- **Description**: Add CRM nav items and page-title mappings using existing design tokens and nav indicator styles.
- **Dependencies**: `T-D0-01`.
- **Steps**: Update sidebar config; map route titles; verify active states and icon behaviors.
- **Definition of Done**: Navigation is discoverable and consistent with scaffold style.
- **Acceptance checks**: Manual nav walkthrough; UI snapshot tests if present.
- **Expected files/modules**: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`.

#### T-D0-03 - Implement Global Quick Add entry

- **Description**: Add a global create launcher that routes users into entity create flows with org context.
- **Dependencies**: `T-D0-01`.
- **Steps**: Add header button/menu; wire entity intents; pass org context as route state/params.
- **Definition of Done**: All required create intents are accessible and route correctly.
- **Acceptance checks**: Manual Quick Add flow; route assertion tests.
- **Expected files/modules**: `src/components/layout/Header.tsx`, `src/components/shared/*`.

#### T-D0-04 - Establish org-aware query key baseline

- **Description**: Add/confirm query-key conventions and cache clear integration on org switch.
- **Dependencies**: None.
- **Steps**: Update query key helpers; audit auth/org switch logic; add tests for cache clear behavior.
- **Definition of Done**: Query keys include `organization_id` and org switch invalidates stale org data.
- **Acceptance checks**: Unit tests for query keys/switch behavior.
- **Expected files/modules**: `src/lib/queryKeys.ts`, `src/providers/AuthProvider.tsx`, `tests/unit/lib/queryKeys.test.ts`.

**Implementation notes**

- Implemented CRM route constants and protected routes for all D0 paths, with non-error placeholder pages for each route target.
- Extended sidebar navigation to Dashboard, People, Campaigns, Deals, and Library with nested-route active-state matching.
- Added header `Quick Add` dropdown (`Person`, `Interaction`, `Deal`, `Campaign`, `Template`) and org-aware route state handoff:
  - `state.quickAdd.intent`
  - `state.quickAdd.organization_id`
- Kept org-switch `queryClient.clear()` behavior in `AuthProvider` and updated query-key helpers to include explicit org scope token format (`organization_id:<id>`).
- Added D0 test coverage:
  - `tests/unit/router/crmRoutes.test.tsx`
  - `tests/unit/components/QuickAddMenu.test.tsx`
  - `tests/unit/lib/queryKeys.test.ts`
  - `tests/unit/providers/AuthProvider.test.tsx`
- Assumptions used:
  - D0 create intents route into placeholder entry points (not full CRUD forms).
  - Interaction quick add routes to `/app/people` until D1 interaction UI exists.
- Run/demo:
  1. `npm run typecheck`
  2. `npm run lint`
  3. `npm run test -- --run tests/unit/router tests/unit/components tests/unit/lib/queryKeys.test.ts tests/unit/providers/AuthProvider.test.tsx`
  4. `npm run dev` and validate sidebar routes + header Quick Add manually

### D1

- **Title**: People + Interactions + CSV Import
- **Goal**: Deliver the primary People-first workflow: capture leads, manage timeline interactions, and import contacts from CSV.
- **In scope**: People CRUD/archive/list/detail hub, interactions with associations and next-step dates, CSV import with mapping/preview/dedupe/summary, DB migrations for people/interactions with RLS/integrity.
- **Out of scope**: Deal board UI and campaign/product/template management screens.
- **Refs**: `R4,R5,R7,R8,R9,R10,R11,R12,R13,R33,R34,R35,R37,C2,C4,C5,C6,C7,C9,C11,C12,C13`.

**Acceptance criteria**

- [x] Person create/edit/archive works; archived people are excluded from default list views.
- [x] People list supports search (name/email/phone), lifecycle filter, sorting, and pagination/infinite loading.
- [x] Person detail renders header, timeline, and action entry points for interaction/deal/campaign.
- [x] Interaction create supports required person, allowed types, optional associations, and `next_step_at`.
- [x] CSV import provides mapping, preview, and summary counts (`created/updated/skipped/errors`).
- [x] CSV dedupe order and default lifecycle behavior match PRD rules.
- [x] `people` and `interactions` tables enforce org-scoped RLS and integrity constraints.

**Manual test steps**

1. Create a person with only `full_name`, then edit optional fields and verify persistence.
2. Archive the person and verify they disappear from default list but remain accessible via non-default archive view/filter.
3. Add several interactions of different types and confirm timeline ordering and persisted associations.
4. Run CSV import with mixed rows (new, existing by email, existing by phone, invalid) and validate summary counts.
5. Edge case: attempt cross-org interaction/person association using direct query tooling; verify RLS denial.
6. Edge case: create interaction with mismatched `deal_id/person_id` (when deal exists) and verify guardrail rejection.

**Expected outcomes**

- Team can onboard leads quickly and maintain person-centric activity history.
- Import flow supports practical data onboarding without duplicate sprawl.

**Artifacts produced**

- `supabase/migrations/*_people_interactions.sql`
- `src/features/people/*`
- `src/features/interactions/*`
- `src/pages/PeoplePage.tsx`
- `src/pages/PersonDetailPage.tsx`
- `tests/features/people/*`
- `tests/features/interactions/*`

**Tasks**

#### T-D1-01 - Create people/interactions schema and RLS migration

- **Description**: Add `people` and `interactions` tables with required fields, constraints, indexes, and mandated RLS policies.
- **Dependencies**: `T-D0-04`.
- **Steps**: Write migration; enforce same-org constraints; enable/select/insert/update policies; regenerate DB types.
- **Definition of Done**: Migration applies cleanly and blocks cross-org access.
- **Acceptance checks**: `npm run db:reset`; RLS SQL verification queries; type generation succeeds.
- **Expected files/modules**: `supabase/migrations/*`, `src/lib/database.types.ts`.

#### T-D1-02 - Implement People service/hooks/schemas

- **Description**: Build typed people CRUD/archive/list stack with org-scoped query keys.
- **Dependencies**: `T-D1-01`.
- **Steps**: Add Zod schemas; add service methods; wrap with TanStack Query hooks; implement pagination/search/sort/filter params.
- **Definition of Done**: People data layer is fully functional and org-isolated.
- **Acceptance checks**: Unit tests for services/hooks; manual CRUD checks.
- **Expected files/modules**: `src/features/people/schemas/*`, `src/features/people/services/*`, `src/features/people/hooks/*`.

#### T-D1-03 - Build People list + Person detail hub

- **Description**: Implement list and detail UI with actions and timeline container.
- **Dependencies**: `T-D1-02`.
- **Steps**: Build list table/cards; add search/filter/sort controls; build detail layout blocks and primary actions.
- **Definition of Done**: Person flows are navigable and stable across refresh.
- **Acceptance checks**: Feature tests for list/detail rendering and archive behavior.
- **Expected files/modules**: `src/features/people/components/*`, `src/pages/PeoplePage.tsx`, `src/pages/PersonDetailPage.tsx`.

#### T-D1-04 - Implement Interactions form and timeline integration

- **Description**: Add interaction creation with type selection, optional associations, and `next_step_at`.
- **Dependencies**: `T-D1-01`, `T-D1-03`.
- **Steps**: Build schema/service/hook; add contextual defaults; render timeline events in person detail.
- **Definition of Done**: Interaction creation persists and appears immediately in timeline.
- **Acceptance checks**: Interaction feature tests; manual multi-type creation checks.
- **Expected files/modules**: `src/features/interactions/*`, `src/features/people/components/*`.

#### T-D1-05 - Build CSV import workflow

- **Description**: Create CSV uploader with mapping, preview, import execution, and result summary.
- **Dependencies**: `T-D1-02`.
- **Steps**: Parse file; map source columns; validate rows; apply dedupe rules; report counts.
- **Definition of Done**: Import handles happy path and malformed rows without data corruption.
- **Acceptance checks**: CSV fixture-based tests; manual import with mixed rows.
- **Expected files/modules**: `src/features/people/components/PeopleCsvImport*`, `tests/features/people/csv-import*.test.ts`.

#### T-D1-06 - Add feature and RLS tests for D1 scope

- **Description**: Validate people/interactions behavior and multi-tenant safety.
- **Dependencies**: `T-D1-01`, `T-D1-02`, `T-D1-03`, `T-D1-04`, `T-D1-05`.
- **Steps**: Add unit/integration tests and direct-query RLS checks.
- **Definition of Done**: D1 tests pass locally and cover edge cases.
- **Acceptance checks**: `vitest run tests/features/people tests/features/interactions`.
- **Expected files/modules**: `tests/features/people/*`, `tests/features/interactions/*`, `tests/integration/*`.

**Implementation notes**

- Implemented D1 database migration and org-scoped schema:
  - `supabase/migrations/20260215123000_people_interactions.sql`
  - Added enums: `person_lifecycle`, `interaction_type`
  - Added tables: `people`, `interactions`
  - Added RLS policies (`select/insert/update/delete`) and `update_updated_at` triggers for both tables
  - Added same-org person integrity via composite FK: `interactions(organization_id, person_id) -> people(organization_id, id)`
- Updated generated DB typings manually (local `db:types` generation was unavailable in this environment):
  - `src/lib/database.types.ts`
- Added org-aware query key helpers for D1:
  - `src/lib/queryKeys.ts` with `peopleKeys` and `interactionKeys`
- Implemented People feature slice:
  - `src/features/people/{types,schemas,services,hooks,components}/*`
  - Includes create/edit/archive, searchable/filterable/sortable paginated list, and CSV import workflow with mapping + preview + summary
- Implemented Interactions feature slice:
  - `src/features/interactions/{types,schemas,services,hooks,components}/*`
  - Includes interaction creation with required `person_id`, allowed types, optional association IDs, and `next_step_at`
- Replaced D0 placeholders with D1 pages:
  - `src/pages/PeoplePage.tsx`
  - `src/pages/PersonDetailPage.tsx`
- Added D1 tests and supporting RLS verification checklist:
  - `tests/features/people/*`
  - `tests/features/interactions/*`
  - `tests/integration/d1-rls-verification.md`
  - Updated: `tests/unit/router/crmRoutes.test.tsx`, `tests/unit/lib/queryKeys.test.ts`
- Assumptions/decisions applied:
  - Numbered pagination implemented (not infinite scroll)
  - CSV parsing uses browser-native `Blob.text()` + internal parser (no new dependency)
  - Optional interaction association FK/guardrails for `deal_id`, `campaign_id`, `template_id`, `product_id` are intentionally deferred to D2-D4, while D1 enforces required person same-org integrity
  - Person detail includes action entry points for deal/campaign and empty-state related blocks without implementing D3/D4 feature logic
- Run/demo commands:
  1. `npm run typecheck`
  2. `npm run lint`
  3. `npm run test -- --run tests/features/people tests/features/interactions tests/unit/router/crmRoutes.test.tsx`
  4. `npm run test -- --run tests/unit/lib/queryKeys.test.ts`
  5. `npm run dev` and validate People list/detail, interaction creation, archive filter behavior, and CSV import flow

### D2

- **Title**: Library (Products + Templates)
- **Goal**: Enable management of products and reusable templates with product linkage and usage visibility.
- **In scope**: Product CRUD, template CRUD, template-product linking/filtering, product detail performance view, template used-in view, DB migrations for products/templates/template_products with RLS.
- **Out of scope**: Deal board interaction and campaign membership UI.
- **Refs**: `R24,R25,R26,R27,R28,R33,R34,R35,C2,C4,C9,C11,C13`.

**Acceptance criteria**

- [x] Products can be created, edited, archived, and listed.
- [x] Templates can be created, edited, archived, and listed with category/status/body.
- [x] Templates can be linked to zero or more products, and template lists can filter by product.
- [x] Product detail shows stage counts, related campaigns, linked templates, and a Deals deep link with product filter state.
- [x] Template detail "Used In" shows derived usage from available interactions/campaign links.
- [x] Library tables enforce org-scoped RLS and reference integrity.

**Manual test steps**

1. Create products and templates; link/unlink templates to products and verify filters update.
2. Open product detail and validate stage counts render (zero-safe before deals exist).
3. Open template detail and verify usage blocks render with empty and non-empty states.
4. Use product detail deep link to Deals and confirm product filter state transfers.
5. Edge case: archive linked product/template and verify associations remain historically readable where required.

**Expected outcomes**

- Sales team can maintain a clean catalog of products and reusable outreach templates.
- Product/template linkage becomes available for downstream deal/campaign workflows.

**Artifacts produced**

- `supabase/migrations/*_products_templates.sql`
- `src/features/library/products/*`
- `src/features/library/templates/*`
- `src/pages/LibraryProductsPage.tsx`
- `src/pages/LibraryTemplatesPage.tsx`
- `tests/features/library/*`

**Tasks**

#### T-D2-01 - Create products/templates schema and RLS migration

- **Description**: Add `products`, `templates`, and `template_products` tables with constraints and mandated policies.
- **Dependencies**: `T-D0-04`.
- **Steps**: Define schema/enums; apply RLS; add indexes; regenerate DB types.
- **Definition of Done**: Migration and types are stable; cross-org access is blocked.
- **Acceptance checks**: `npm run db:reset`; integration checks for RLS.
- **Expected files/modules**: `supabase/migrations/*`, `src/lib/database.types.ts`.

#### T-D2-02 - Implement Product data layer and UI

- **Description**: Build product CRUD list/detail with archive and performance widgets.
- **Dependencies**: `T-D2-01`.
- **Steps**: Add schemas/services/hooks; build list/detail components; wire deep link to deals filter state.
- **Definition of Done**: Product flows are fully operable and org-scoped.
- **Acceptance checks**: Product feature tests; manual CRUD walkthrough.
- **Expected files/modules**: `src/features/library/products/*`, `src/pages/LibraryProductsPage.tsx`.

#### T-D2-03 - Implement Template data layer and UI

- **Description**: Build template CRUD with category/status/body and product-linking controls.
- **Dependencies**: `T-D2-01`.
- **Steps**: Add schemas/services/hooks; create editor/list/detail; implement product filter.
- **Definition of Done**: Template flows and linking persist correctly.
- **Acceptance checks**: Template feature tests; manual link/unlink checks.
- **Expected files/modules**: `src/features/library/templates/*`, `src/pages/LibraryTemplatesPage.tsx`.

#### T-D2-04 - Add derived usage queries for Template and Product detail

- **Description**: Compute and display "used in" and performance summaries from linked records.
- **Dependencies**: `T-D2-02`, `T-D2-03`.
- **Steps**: Implement aggregate queries; render empty/loading/error states; validate null-safe outputs.
- **Definition of Done**: Usage/performance views are accurate with available domain data.
- **Acceptance checks**: Integration tests for aggregates.
- **Expected files/modules**: `src/features/library/*/services/*`, `tests/features/library/*`.

#### T-D2-05 - Add D2 tests and quality checks

- **Description**: Lock in behavior with unit/feature tests and static checks.
- **Dependencies**: `T-D2-02`, `T-D2-03`, `T-D2-04`.
- **Steps**: Add test coverage for CRUD/linking/aggregation; run lint/typecheck.
- **Definition of Done**: D2 scope is regression-protected.
- **Acceptance checks**: `npm run typecheck`; `npm run lint`; `vitest run tests/features/library`.
- **Expected files/modules**: `tests/features/library/*`.

**Implementation notes**

- Implemented D2 migration and schema hardening:
  - `supabase/migrations/20260216100000_products_templates.sql`
  - Added enums: `template_category`, `template_status`
  - Added tables: `products`, `templates`, `template_products`
  - Added RLS policies (`select/insert/update/delete`) and update triggers
  - Added D2 integrity rollout for `interactions.product_id` and `interactions.template_id`:
    - null-safe backfill for pre-D2 values
    - same-org FKs to `products` and `templates`
- Regenerated DB types from local Supabase schema:
  - `src/lib/database.types.ts`
- Implemented Products slice and pages:
  - `src/features/library/products/{types,schemas,services,hooks,components,index}.ts`
  - `src/pages/LibraryProductsPage.tsx`
  - `src/pages/LibraryProductDetailPage.tsx`
- Implemented Templates slice and pages:
  - `src/features/library/templates/{types,schemas,services,hooks,components,index}.ts`
  - `src/pages/LibraryTemplatesPage.tsx`
  - `src/pages/LibraryTemplateDetailPage.tsx`
- Added D2 deep-link verification enabler:
  - `src/pages/DealsPage.tsx` now reads `product_id` query param and renders filter-state banner (no D4 logic implemented)
- Added org-scoped query keys for Library domain:
  - `src/lib/queryKeys.ts` (`productKeys`, `templateKeys`)
- Added D2 tests:
  - `tests/features/library/productsService.test.ts`
  - `tests/features/library/templatesService.test.ts`
  - `tests/features/library/libraryProductsPage.test.tsx`
  - `tests/features/library/libraryTemplatesPage.test.tsx`
  - `tests/features/library/productDetailView.test.tsx`
  - `tests/features/library/templateDetailView.test.tsx`
  - Updated `tests/unit/lib/queryKeys.test.ts`

- Locked assumptions/decisions used:
  - Product detail stage metrics are zero-safe in D2 (full deal-stage aggregates land in D4 when deals domain exists)
  - Template used-in derives from interactions now, with zero-safe campaign/deal sections
  - Template archive model uses `status = archived` (no separate archive flag)
  - Deals deep link contract uses URL query param: `/app/deals?product_id=<id>`

- Run/demo:
  1. `npm run db:start`
  2. `npm run db:reset`
  3. `npm run db:types`
  4. `npm run typecheck`
  5. `npm run lint`
  6. `npm run test -- --run tests/features/library tests/unit/lib/queryKeys.test.ts tests/unit/router/crmRoutes.test.tsx`
  7. `npm run dev` and validate Library products/templates flows, linking/filtering, used-in display, and Deals deep-link banner

### D2.1

- **Title**: Library Switcher + Canonical Library Route
- **Goal**: Make Templates discoverable and establish a single visible Library entry with tabbed navigation.
- **In scope**: Add canonical `/app/library` route, visible Products/Templates tabs, Sidebar/Quick Add routing alignment, backward-compatible redirects from legacy list routes, and tests.
- **Out of scope**: Product/template detail behavior changes, D3/D4 domain logic, DB schema changes.
- **Refs**: `R1,R2,R3,R24,R26,C2,C13`.

**Acceptance criteria**

- [ ] Sidebar Library item opens `/app/library`.
- [ ] `/app/library` shows a visible `Products | Templates` switcher and defaults to `Products`.
- [ ] Quick Add Template opens `/app/library?tab=templates`.
- [ ] Legacy list URLs redirect to canonical tabbed route:
  - `/app/library/products` -> `/app/library?tab=products`
  - `/app/library/templates` -> `/app/library?tab=templates`
- [ ] Product/template detail routes remain unchanged and functional.
- [ ] Header title mapping still resolves `Library` for all library routes.
- [ ] Router/quick-add/library tests pass.

**Manual test steps**

1. Click Library in Sidebar and confirm `/app/library` opens with Products tab active.
2. Switch to Templates tab and verify template list/actions are visible.
3. Trigger Quick Add -> Template and confirm templates tab opens in Library.
4. Navigate directly to `/app/library/products` and `/app/library/templates` and verify redirects land on canonical tab query URL.
5. Open product/template detail routes and verify detail pages render as before.

**Expected outcomes**

- Library has a single, discoverable entry point with clear tabbed navigation.
- Existing deep links remain compatible through redirects.

**Artifacts produced**

- `src/pages/LibraryView.tsx`
- `src/lib/constants.ts`
- `src/app/router.tsx`
- `src/components/layout/{Sidebar,Header}.tsx`
- `src/components/shared/QuickAddMenu.tsx`
- `tests/unit/router/crmRoutes.test.tsx`
- `tests/unit/components/QuickAddMenu.test.tsx`
- `tests/features/library/libraryView.test.tsx`

**Tasks**

#### T-D2.1-01 - Add canonical Library route and tabbed view

- **Description**: Introduce `/app/library` as the canonical list route and render a visible Products/Templates switcher.
- **Dependencies**: `T-D2-02`, `T-D2-03`.
- **Steps**: Create `LibraryView`; resolve tab from URL query (`tab`), default to products, support template quick-add fallback when tab query missing.
- **Definition of Done**: Users can switch products/templates from one Library page.
- **Acceptance checks**: Library view tests for default/explicit/invalid tab behavior.
- **Expected files/modules**: `src/pages/LibraryView.tsx`.

#### T-D2.1-02 - Align routing and backward-compatible redirects

- **Description**: Make `/app/library` canonical while preserving existing list URLs.
- **Dependencies**: `T-D2.1-01`.
- **Steps**: Add `ROUTES.LIBRARY`; route `/app/library`; redirect old list routes to canonical query URLs.
- **Definition of Done**: Legacy URLs resolve through redirects without breaking details.
- **Acceptance checks**: Router tests for authenticated/unauthenticated coverage and redirect behavior.
- **Expected files/modules**: `src/lib/constants.ts`, `src/app/router.tsx`.

#### T-D2.1-03 - Update shell entry points (Sidebar, Header, Quick Add)

- **Description**: Align navigation affordances to the canonical Library route.
- **Dependencies**: `T-D2.1-02`.
- **Steps**: Sidebar Library href -> `/app/library`; header title matcher includes `/app/library`; Quick Add Template target -> `/app/library?tab=templates`.
- **Definition of Done**: All primary entry points lead users into canonical Library flow.
- **Acceptance checks**: Quick Add unit tests and manual shell navigation walkthrough.
- **Expected files/modules**: `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`, `src/components/shared/QuickAddMenu.tsx`.

#### T-D2.1-04 - Add and update tests for switcher behavior

- **Description**: Add coverage for tab routing and update existing expectations.
- **Dependencies**: `T-D2.1-01`, `T-D2.1-02`, `T-D2.1-03`.
- **Steps**: Add `libraryView` tests; update router and quick-add tests for canonical route/query-based behavior.
- **Definition of Done**: Regression coverage protects canonical Library UX.
- **Acceptance checks**: `npm run test -- --run tests/unit/router/crmRoutes.test.tsx tests/unit/components/QuickAddMenu.test.tsx tests/features/library`.
- **Expected files/modules**: `tests/features/library/libraryView.test.tsx`, `tests/unit/router/crmRoutes.test.tsx`, `tests/unit/components/QuickAddMenu.test.tsx`.

### D3

- **Title**: Campaigns + Membership + Metrics
- **Goal**: Deliver campaign management as lead-gen containers with membership workflows and derived metrics.
- **In scope**: Campaign CRUD, campaign/product/template linking, membership flows from people list and campaign detail, metrics cards, DB migrations for campaigns and M2M tables with RLS.
- **Out of scope**: Kanban board behavior and dashboard-wide analytics.
- **Refs**: `R21,R22,R23,R33,R34,R35,C2,C4,C8,C9,C11,C13`.

**Acceptance criteria**

- [ ] Campaign create/edit/archive/list/detail works with type and linked products/templates.
- [ ] People can be added to campaigns from People list (bulk) and Campaign detail (search/add).
- [ ] Person detail displays campaign memberships.
- [ ] Campaign metrics compute correctly: people added, engaged people, deals created.
- [ ] Campaign tables and membership tables enforce org-scoped RLS and relationship integrity.

**Manual test steps**

1. Create one campaign per type and link products/templates.
2. Bulk-add people from People list and verify campaign member counts update.
3. Add person from Campaign detail search and verify it appears on Person detail memberships.
4. Record interaction with campaign association and verify engaged count increments.
5. Edge case: duplicate membership add attempt is ignored or blocked without duplicate rows.

**Expected outcomes**

- Campaign operations become actionable and measurable through explicit relationship data.
- Campaign membership is visible in both campaign-centric and person-centric views.

**Artifacts produced**

- `supabase/migrations/*_campaigns.sql`
- `src/features/campaigns/*`
- `src/pages/CampaignsPage.tsx`
- `src/pages/CampaignDetailPage.tsx`
- `tests/features/campaigns/*`

**Tasks**

#### T-D3-01 - Create campaigns schema and RLS migration

- **Description**: Add `campaigns`, `campaign_people`, `campaign_products`, `campaign_templates` with constraints and policies.
- **Dependencies**: `T-D0-04`, `T-D1-01`, `T-D2-01`.
- **Steps**: Define schema; enforce unique M2M combinations; apply RLS and same-org constraints.
- **Definition of Done**: Campaign data model is secure and consistent.
- **Acceptance checks**: Migration apply/reset; direct-query RLS verification.
- **Expected files/modules**: `supabase/migrations/*`, `src/lib/database.types.ts`.

#### T-D3-02 - Implement Campaign CRUD and linking UI

- **Description**: Build campaign forms/list/detail with product/template link controls.
- **Dependencies**: `T-D3-01`.
- **Steps**: Add schemas/services/hooks; implement route pages and form validation.
- **Definition of Done**: Campaign CRUD works end-to-end in org scope.
- **Acceptance checks**: Campaign feature tests and manual CRUD run.
- **Expected files/modules**: `src/features/campaigns/*`, `src/pages/CampaignsPage.tsx`, `src/pages/CampaignDetailPage.tsx`.

#### T-D3-03 - Implement campaign membership flows

- **Description**: Add bulk add from People list and search/add from Campaign detail; expose membership on Person detail.
- **Dependencies**: `T-D3-02`, `T-D1-03`.
- **Steps**: Add membership services/hooks; build selection UX; update person detail block.
- **Definition of Done**: Membership updates are reflected consistently across screens.
- **Acceptance checks**: Feature tests for both entry points.
- **Expected files/modules**: `src/features/campaigns/components/*`, `src/features/people/components/*`.

#### T-D3-04 - Add campaign metrics derivation

- **Description**: Compute `people added`, `engaged`, and `deals created` from association records.
- **Dependencies**: `T-D3-03`.
- **Steps**: Build aggregate queries; render metric cards; verify against fixture data.
- **Definition of Done**: Metrics match expected counts for test datasets.
- **Acceptance checks**: Metrics integration tests.
- **Expected files/modules**: `src/features/campaigns/services/*`, `tests/features/campaigns/*`.

#### T-D3-05 - Add D3 tests and quality checks

- **Description**: Cover CRUD/membership/metrics and enforce static quality gates.
- **Dependencies**: `T-D3-02`, `T-D3-03`, `T-D3-04`.
- **Steps**: Add tests; run lint/typecheck/feature suite.
- **Definition of Done**: D3 functionality is stable and regressions are guarded.
- **Acceptance checks**: `npm run typecheck`; `npm run lint`; `vitest run tests/features/campaigns`.
- **Expected files/modules**: `tests/features/campaigns/*`, `tests/integration/*`.

### D4

- **Title**: Deals Kanban + Drawer + Manual Conversion
- **Goal**: Deliver the universal pipeline with manual deal creation, movement, filtering, and deal-level activity workflow.
- **In scope**: Deals schema + RLS, manual creation entry points, kanban board columns, drag/drop persistence, keyboard fallback controls, board filters, deal cards, deal drawer, duplicate-open warning.
- **Out of scope**: Dashboard aggregate widgets.
- **Refs**: `R14,R15,R16,R17,R18,R19,R20,R33,R34,R35,R37,C2,C3,C6,C9,C10,C11,C12,C13`.

**Acceptance criteria**

- [ ] Deals can be created manually from Person detail, Campaign member context, and Quick Add.
- [ ] Deal creation enforces required person + product and defaults stage to `prospect`.
- [ ] Kanban board renders required stage columns and supports drag/drop stage changes that persist.
- [ ] Keyboard fallback controls can move a deal between stages without drag interaction.
- [ ] Board filters by product and person return accurate visible card sets.
- [ ] Deal cards and drawer expose required fields/actions.
- [ ] Same-person same-product open deal warning is shown while still allowing creation.

**Manual test steps**

1. Create a deal from Person detail and confirm it appears in Prospect column.
2. Create a deal from campaign member action and Quick Add and confirm field defaults/context.
3. Drag a deal across columns, refresh page, and verify persisted stage.
4. Move another deal using keyboard fallback controls and verify stage update.
5. Filter board by product and person and verify counts/cards match expectations.
6. Open drawer, add interaction, update next step/value, and verify card indicators update.
7. Edge case: create second open deal for same person+product and confirm warning appears but creation remains allowed.

**Expected outcomes**

- Teams can run daily pipeline workflow with both pointer and keyboard interactions.
- Manual conversion principle is enforced while still allowing flexible deal history per person.

**Artifacts produced**

- `supabase/migrations/*_deals.sql`
- `src/features/deals/*`
- `src/pages/DealsPage.tsx`
- `tests/features/deals/*`

**Tasks**

#### T-D4-01 - Create deals schema and RLS migration

- **Description**: Add `deals` table with stage constraints, required relations, and mandated RLS.
- **Dependencies**: `T-D1-01`, `T-D2-01`, `T-D0-04`.
- **Steps**: Define schema and enums; add same-org integrity checks; apply indexes for board queries.
- **Definition of Done**: Deals table is secure, constrained, and performant for board retrieval.
- **Acceptance checks**: Migration/reset; direct-query policy verification.
- **Expected files/modules**: `supabase/migrations/*`, `src/lib/database.types.ts`.

#### T-D4-02 - Implement manual deal creation flows and validations

- **Description**: Build create flow from all required entry points with duplicate-open warning.
- **Dependencies**: `T-D4-01`, `T-D1-03`, `T-D3-03`, `T-D0-03`.
- **Steps**: Add schema/service/hook; wire entry points; add validation and warning UX.
- **Definition of Done**: All entry points create valid deals with expected defaults.
- **Acceptance checks**: Feature tests for creation paths.
- **Expected files/modules**: `src/features/deals/schemas/*`, `src/features/deals/services/*`, `src/features/deals/hooks/*`.

#### T-D4-03 - Build Kanban board UI and filters

- **Description**: Implement stage columns, card layout, and board-level filtering.
- **Dependencies**: `T-D4-02`.
- **Steps**: Build board and cards; add product/person filters; render empty/loading/error states.
- **Definition of Done**: Board is usable and filter results are accurate.
- **Acceptance checks**: Board feature tests; manual filter verification.
- **Expected files/modules**: `src/features/deals/components/DealsBoard*`, `src/pages/DealsPage.tsx`.

#### T-D4-04 - Add drag/drop persistence and keyboard fallback controls

- **Description**: Integrate `@dnd-kit/*` for drag flow and non-drag stage movement actions.
- **Dependencies**: `T-D4-03`.
- **Steps**: Implement drag handlers; persist stage updates; add keyboard-accessible move controls.
- **Definition of Done**: Stage movement works with mouse and keyboard and persists after refresh.
- **Acceptance checks**: Interaction tests for DnD and keyboard fallback.
- **Expected files/modules**: `src/features/deals/components/*`, `src/features/deals/hooks/*`.

#### T-D4-05 - Implement Deal drawer and deal-scoped interactions

- **Description**: Build drawer with header, timeline subset, add interaction, and editable next-step/value.
- **Dependencies**: `T-D4-02`, `T-D1-04`.
- **Steps**: Add drawer UI; integrate interaction association defaults; update card indicators on save.
- **Definition of Done**: Drawer supports core deal management without page navigation.
- **Acceptance checks**: Drawer flow tests and manual walkthrough.
- **Expected files/modules**: `src/features/deals/components/DealDrawer*`, `src/features/interactions/*`.

#### T-D4-06 - Add D4 tests and performance sanity checks

- **Description**: Validate board/drawer behavior and run target performance sanity pass.
- **Dependencies**: `T-D4-03`, `T-D4-04`, `T-D4-05`.
- **Steps**: Add tests for movement/filtering/persistence; run timings on seeded dataset.
- **Definition of Done**: Deals scope is stable and meets baseline responsiveness targets.
- **Acceptance checks**: `vitest run tests/features/deals`; manual interactive timing spot-check.
- **Expected files/modules**: `tests/features/deals/*`, `tests/integration/*`.

### D5

- **Title**: Dashboard + Cross-Feature Derived Insights
- **Goal**: Provide daily execution dashboard and finish cross-feature derived filters/links.
- **In scope**: Follow-ups due, stale deals, pipeline snapshot, top products/campaigns, deep links to person/deal contexts, people derived filters (product interest/source campaign/has open deal), full-domain seed data.
- **Out of scope**: CSV export and broad polish backlog items.
- **Refs**: `R6,R29,R30,R31,R32,R36,R37,C2,C8,C9,C10,C11,C13`.

**Acceptance criteria**

- [ ] Follow-ups due list merges deal and interaction next steps and links to deal drawer/person page.
- [ ] Stale deals list/count respects configurable `X` day threshold.
- [ ] Pipeline snapshot renders per-stage counts (value optional).
- [ ] Top products and top campaigns render with PRD-allowed simple ranking logic.
- [ ] People list supports derived filters for product interest, source campaign, and has open deal.
- [ ] Seed dataset is available per org with required volumes and isolated data.

**Manual test steps**

1. Seed data for at least one org and load dashboard.
2. Verify follow-ups include both interaction and deal next-step records.
3. Set stale threshold and confirm stale list updates against last interaction activity.
4. Validate stage counts against deals board column totals.
5. Apply people derived filters and confirm matching rows.
6. Edge case: empty org dataset shows informative empty states (no crashes).

**Expected outcomes**

- Users can start day-to-day work from dashboard cues and jump directly into actionable records.
- Cross-feature aggregations are coherent and consistent with source records.

**Artifacts produced**

- `src/features/dashboard/*`
- `src/pages/DashboardPage.tsx`
- `supabase/seed.sql` (or domain seed extension files)
- `tests/features/dashboard/*`
- `tests/integration/*`

**Tasks**

#### T-D5-01 - Implement dashboard aggregate queries

- **Description**: Build query layer for follow-ups, stale deals, pipeline, and top lists.
- **Dependencies**: `T-D1-04`, `T-D3-04`, `T-D4-05`.
- **Steps**: Create services/hooks with org-scoped keys; add configurable stale horizon.
- **Definition of Done**: Aggregates are correct and query performance is acceptable.
- **Acceptance checks**: Integration tests comparing aggregate results to fixtures.
- **Expected files/modules**: `src/features/dashboard/services/*`, `src/features/dashboard/hooks/*`.

#### T-D5-02 - Build dashboard UI with deep links

- **Description**: Render actionable dashboard cards/lists and navigation links.
- **Dependencies**: `T-D5-01`.
- **Steps**: Implement widgets; wire links to deal drawer/person detail; handle loading/empty/error states.
- **Definition of Done**: Dashboard is usable as daily launch point.
- **Acceptance checks**: Dashboard feature tests; manual link verification.
- **Expected files/modules**: `src/features/dashboard/components/*`, `src/pages/DashboardPage.tsx`.

#### T-D5-03 - Add people derived filters powered by campaign/deal/product links

- **Description**: Complete remaining people filters requiring cross-feature relationships.
- **Dependencies**: `T-D3-03`, `T-D4-03`.
- **Steps**: Extend people query/filter controls and filter chips; verify result correctness.
- **Definition of Done**: Derived filters return accurate subsets.
- **Acceptance checks**: Feature tests for each derived filter.
- **Expected files/modules**: `src/features/people/hooks/*`, `src/features/people/components/*`.

#### T-D5-04 - Add org-isolated QA seed data

- **Description**: Add and verify seed data volumes required for manual QA and demo.
- **Dependencies**: `T-D1-01`, `T-D2-01`, `T-D3-01`, `T-D4-01`.
- **Steps**: Populate required entities and links; verify no cross-org contamination.
- **Definition of Done**: Seed script consistently produces PRD-required dataset shape.
- **Acceptance checks**: `npm run db:reset`; spot-check counts per table and org.
- **Expected files/modules**: `supabase/seed.sql`, `tests/integration/seed*.test.ts`.

#### T-D5-05 - Add D5 tests and quality checks

- **Description**: Lock down dashboard and derived filter behavior.
- **Dependencies**: `T-D5-02`, `T-D5-03`, `T-D5-04`.
- **Steps**: Add feature/integration tests; run static and test suites.
- **Definition of Done**: D5 behavior is stable and regression-protected.
- **Acceptance checks**: `npm run typecheck`; `npm run lint`; `vitest run tests/features/dashboard tests/integration`.
- **Expected files/modules**: `tests/features/dashboard/*`, `tests/integration/*`.

### D6

- **Title**: Polish, Exports, Accessibility, and Release Gates
- **Goal**: Close out with exports, UX/performance hardening, optional quick-search decision, and full quality/security verification.
- **In scope**: People/Deals CSV export, UX cleanup, performance tuning pass, keyboard/a11y pass for core flows, full quality gate run, explicit decision on optional global quick search.
- **Out of scope**: New domain objects beyond PRD scope.
- **Refs**: `R38,R39,R34,R35,R37,C2,C3,C9,C10,C11,C12,C13`.

**Acceptance criteria**

- [ ] People and Deals can be exported as CSV from their respective screens.
- [ ] Core keyboard flows pass manual a11y checks, including non-drag stage movement and drawer/list navigation.
- [ ] Performance pass is documented and major slow-paths addressed for People list and Deals board targets.
- [ ] RLS and integrity checks pass for all domain tables in direct-query validation.
- [ ] `npm run typecheck`, `npm run lint`, and `vitest run` all pass.
- [ ] Optional global quick search has a recorded decision: implemented or explicitly deferred.

**Manual test steps**

1. Export People and Deals CSV and verify headers/row counts match current filtered dataset expectations.
2. Navigate list -> person -> deals -> drawer using keyboard only.
3. Move deal stages using fallback controls without drag.
4. Run final quality gates and confirm zero failures.
5. Execute direct-query cross-org read/write attempts for each domain table and verify denial.
6. Edge case: export on empty dataset returns valid empty CSV structure.

**Expected outcomes**

- CRM Phase 2 is release-ready with operational exports, accessibility coverage, and validated security/quality gates.
- Optional quick search status is explicitly captured to avoid ambiguous scope drift.

**Artifacts produced**

- `src/features/people/components/*Export*`
- `src/features/deals/components/*Export*`
- `src/lib/*` (performance helpers/constants as needed)
- `tests/integration/rls*.test.ts`
- `docs/002-ux-flow/*` (decision notes, if maintained in docs)

**Tasks**

#### T-D6-01 - Implement People and Deals CSV export flows

- **Description**: Add export actions and serializers for list/board datasets.
- **Dependencies**: `T-D1-03`, `T-D4-03`.
- **Steps**: Add export triggers; format CSV columns; verify encoding and empty-state export.
- **Definition of Done**: CSV exports are accurate and downloadable for both domains.
- **Acceptance checks**: Manual export validation; export unit tests.
- **Expected files/modules**: `src/features/people/*`, `src/features/deals/*`, `tests/features/*`.

#### T-D6-02 - Run performance hardening pass

- **Description**: Profile and optimize list/board bottlenecks against PRD targets.
- **Dependencies**: `T-D5-05`.
- **Steps**: Measure baseline timings; tune query shapes/indexes/render paths; re-measure and record results.
- **Definition of Done**: No critical regressions; performance outcomes documented.
- **Acceptance checks**: Repeatable timing checklist on seeded dataset.
- **Expected files/modules**: `src/features/people/*`, `src/features/deals/*`, `supabase/migrations/*` (if index changes).

#### T-D6-03 - Complete accessibility and keyboard support audit

- **Description**: Verify and patch keyboard navigation/focus behavior for core CRM flows.
- **Dependencies**: `T-D4-04`, `T-D5-02`.
- **Steps**: Run keyboard walkthroughs; patch focus order/labels/shortcuts; add regression tests where feasible.
- **Definition of Done**: Core workflows operate without drag/mouse dependence.
- **Acceptance checks**: Manual a11y checklist; relevant UI tests.
- **Expected files/modules**: `src/features/deals/components/*`, `src/features/people/components/*`, `src/components/*`.

#### T-D6-04 - Final security and integrity verification sweep

- **Description**: Validate RLS and data-integrity rules across all domain tables and associations.
- **Dependencies**: `T-D6-02`.
- **Steps**: Execute direct-query checks for cross-org access; validate relationship constraints and guardrails.
- **Definition of Done**: No cross-org leakage and integrity checks all pass.
- **Acceptance checks**: Integration/security test suite.
- **Expected files/modules**: `tests/integration/rls*.test.ts`, `tests/integration/integrity*.test.ts`.

#### T-D6-05 - Run final quality gates and record quick-search decision

- **Description**: Execute full project checks and capture optional quick-search implementation/defer decision.
- **Dependencies**: `T-D6-01`, `T-D6-03`, `T-D6-04`.
- **Steps**: Run `typecheck`, `lint`, `vitest`; record quick-search outcome in docs/changelog.
- **Definition of Done**: Release gate status is green and optional scope is explicitly resolved.
- **Acceptance checks**: `npm run typecheck`; `npm run lint`; `vitest run`.
- **Expected files/modules**: `docs/002-ux-flow/*`, `tests/*`.
