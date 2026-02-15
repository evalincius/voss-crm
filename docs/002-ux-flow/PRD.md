# PRD: Simple Sales CRM (B2C) — Phase 2 (Post-Scaffold)

**Version**: 1.0.0
**Status**: Draft
**Depends on**: **PRD: CoEngineers Platform Scaffolding v1.2.0** (must be implemented + all acceptance criteria passed first).

---

## 1. Product Overview

### What we are building

A **simplified B2C CRM** focused on **sales + lead generation**, intentionally smaller than market-leading CRMs, but copying the best mental models:

**Core areas (5):**

- Dashboard
- People
- Campaigns
- Deals (Kanban pipeline)
- Library (Products + Templates)

**Core principles:**

- **B2C only**: no Companies/Accounts object.
- **Manual conversion only**: a deal is created only via explicit user action.
- **Everything is “People-first”**: People is the hub; Deals/Campaigns/Interactions attach back to People.
- **Associations are effortless**: user should always see what Products/Deals/Campaigns/Templates a person is related to.

### Why this exists

Market-leading CRMs are powerful but complex. This product optimizes for:

- Speed of lead capture (CSV + manual)
- Clean daily workflow (follow-ups + pipeline)
- Simple reporting (product + campaign performance)
- Minimal setup and minimal “CRM admin” work

### Preconditions (must already exist)

This PRD assumes the platform scaffold is complete: auth, multi-tenancy orgs, RLS helpers, App shell, routing patterns, design system tokens, and vertical-slice architecture.

---

## 2. Technology Stack

### Inherited from Scaffolding (MANDATED)

Use the exact stack and patterns from the Scaffolding PRD: React + Vite + TS + Tailwind, TanStack Query, RHF + Zod, Supabase Auth + Postgres + RLS, vertical-slice architecture, org-scoped queries/cache, and the “Modern Fintech Minimalism” design system.

### Domain dependencies to add (allowed, minimal)

The scaffold explicitly calls out domain-specific deps that are **not included** and should be added when needed. This CRM requires:

- `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities` (Deals Kanban drag/drop)
- `date-fns` (follow-up dates, “stale deal” calculations)

Optional (only if needed to keep implementation simple):

- `papaparse` (robust CSV parsing in browser)

---

## 3. Project Structure

Follow the scaffold’s **Vertical Slice Architecture** pattern.

Suggested feature slices:

- `src/features/people/*`
- `src/features/interactions/*` (or part of people/deals if preferred)
- `src/features/deals/*`
- `src/features/campaigns/*`
- `src/features/library/products/*`
- `src/features/library/templates/*`
- `src/features/dashboard/*`

Shared utilities remain in `src/lib/*` only.

---

## 4. Functional Requirements

### 4.1 Navigation & Routes (CRM extension)

#### FR-CRM-SHELL-001: Sidebar Nav Items

- Add sidebar items under AppLayout:
  - Dashboard, People, Campaigns, Deals, Library

- Keep styling consistent with scaffold tokens (active indicator, dark default).

#### FR-CRM-SHELL-002: Routes

- Add the following protected routes under `/app/*`:
  - `/app/dashboard`
  - `/app/people` + `/app/people/:id`
  - `/app/campaigns` + `/app/campaigns/:id`
  - `/app/deals`
  - `/app/library/products` + `/app/library/products/:id`
  - `/app/library/templates` + `/app/library/templates/:id`

#### FR-CRM-SHELL-003: Global Quick Add

- Provide a global “Quick Add” entry point (header button or command menu) to create:
  - Person, Interaction, Deal, Campaign, Template

- Quick Add must respect current organization context.

---

### 4.2 People

#### FR-PEOPLE-001: Create/Edit/Archive Person

- People fields:
  - Required: `full_name`
  - Optional: `email`, `phone`, `notes`
  - Lifecycle: `new | contacted | engaged | customer`

- Archive hides from default lists but keeps history and associations.

#### FR-PEOPLE-002: People List View

- Must support:
  - Search (name/email/phone)
  - Filters: lifecycle, product interest (derived or explicit), source campaign (derived), has open deal, tags (optional)
  - Sorting: recently updated, newest, next step soonest (optional)

- Pagination (or infinite loading) to support large lists.

#### FR-PEOPLE-003: CSV Import (People)

- Upload CSV and map columns → preview → import summary:
  - created / updated / skipped / errors

- Default lifecycle stage: `new`
- Dedupe order:
  1. email match (if provided)
  2. phone match (if provided)
  3. otherwise create new

#### FR-PEOPLE-004: Person Detail Page (Hub View)

Person detail must show 4 blocks:

- **Header**: name + key contact fields + lifecycle + tags (optional)
- **Timeline** (Interactions)
- **Deals** (open + closed)
- **Campaign memberships**
- **Templates used** (derived from interactions referencing templates, and campaign-linked templates)

Primary actions on person:

- Add Interaction
- Create Deal (manual)
- Add to Campaign

---

### 4.3 Interactions (Timeline Events)

#### FR-INT-001: Interaction Types

Supported types:

- `email`, `call`, `dm`, `meeting`, `note`, `form_submission`, `other`

#### FR-INT-002: Required + Optional Associations

- Required: `person_id`
- Optional: `deal_id`, `campaign_id`, `template_id`, `product_id`
- Associations should be selectable in the interaction form (with sensible defaults):
  - If created from Deal drawer → preselect that deal + its product
  - If created from Campaign → preselect campaign (+ optionally product)

#### FR-INT-003: Next Step Date

- Interactions can set `next_step_at`
- Dashboard “Follow-ups due” must include next steps from:
  - deals.next_step_at
  - interactions.next_step_at

---

### 4.4 Deals (Universal Pipeline)

#### FR-DEAL-001: Manual Deal Creation

- Deals can be created:
  - From Person detail
  - From Campaign member list
  - From Quick Add

- Required fields:
  - Person
  - Primary Product

- Optional:
  - Source Campaign
  - Value (minor units) + currency
  - next_step_at

- Default stage: `prospect`

#### FR-DEAL-002: Kanban Stages

- Columns:
  - Prospect → Offer Sent → Interested → Objection → Validated → Lost

- “Won” is optional (v1 can ship without it); if absent, “Validated” is the terminal “success-like” stage.

#### FR-DEAL-003: Drag & Drop Stage Updates

- Dragging a deal card between columns updates `stage`
- Must persist after refresh

#### FR-DEAL-004: Board Filters

Deals board must filter by:

- Product
- Person
- Tags (optional)
- Owner (only if multi-user workflows are enabled later)

#### FR-DEAL-005: Deal Card Minimum Fields

Deal card must show:

- Person name
- Product badge
- Next step indicator (missing/overdue/upcoming)
- Last interaction timestamp (relative)

#### FR-DEAL-006: Deal Drawer

Opening a deal shows:

- Deal header (person + product + stage)
- Timeline subset (deal interactions)
- Add Interaction
- Attach Template reference (via interaction association)
- Edit next step / value

#### FR-DEAL-007: Multiple Deals per Person (Allowed)

- A person may have multiple deals over time.
- Guardrail: if person already has an open deal for the same product, show a warning (still allow creation).

---

### 4.5 Campaigns (Lead Gen Containers)

#### FR-CAMP-001: Campaign CRUD

Campaign fields:

- name
- type: `cold_outreach | warm_outreach | content | paid_ads`
- linked products (0..n)
- linked templates (0..n)

#### FR-CAMP-002: Campaign Membership

- Add People to Campaign:
  - From People list (bulk add)
  - From Campaign detail (search + add)

- Person detail must show all campaigns they belong to.

#### FR-CAMP-003: Campaign Metrics (Simple)

Campaign detail must show:

- People added
- People engaged = count of members with at least 1 interaction linked to this campaign
- Deals created = count of deals where `source_campaign_id = this`

---

### 4.6 Library (Products + Templates)

#### FR-PROD-001: Product CRUD

- Create/edit/archive products
- Product is required for deal creation

#### FR-PROD-002: Product Detail (Performance View)

Must show:

- Pipeline counts by stage (for deals where primary_product_id = this)
- Related campaigns
- Templates linked to this product
- One-click “View on Deals board” (opens Deals with Product filter applied)

#### FR-TPL-001: Template CRUD

- Create/edit/archive templates
- Template fields:
  - title
  - category: `cold_email | warm_outreach | content | paid_ads | offer`
  - status: `draft | approved | archived`
  - body (text/markdown)

#### FR-TPL-002: Template ↔ Product Linking

- Templates can be linked to 0..n products
- Linking influences discoverability (filter templates by product)

#### FR-TPL-003: “Used In” Visibility

Template detail should show usage derived from:

- Interactions referencing this template
- Campaigns linking this template
- Deals indirectly (via interactions tied to a deal)

---

### 4.7 Dashboard

#### FR-DASH-001: Follow-ups Due

- List of follow-ups due, sourced from:
  - Deals where `next_step_at <= now() + horizon`
  - Interactions where `next_step_at <= now() + horizon`

- Must link user directly to the relevant record (deal drawer or person page).

#### FR-DASH-002: Stale Deals

- “Stale deals” = no interactions in last X days (configurable constant)
- Show count + list with quick link to deal

#### FR-DASH-003: Pipeline Snapshot

- Counts per stage (and optional total value if value is used)

#### FR-DASH-004: Top Products / Campaigns (Simple)

- Top products: by number of open deals (or deals created in last 30 days)
- Top campaigns: by engaged people and deals created

---

## 5. Database (Supabase) — Domain Tables + RLS

### 5.1 Base tables (already exist)

Organizations, memberships, invitations, profile current org, and helper functions are defined in the scaffolding PRD and must be reused.

### 5.2 New domain tables (org-scoped)

All domain tables must include:

- `organization_id uuid not null`
- `created_by uuid not null` (auth.uid audit trail)
- timestamps

Tables to add:

- `people`
- `products`
- `templates`
- `template_products` (m2m)
- `campaigns`
- `campaign_people` (m2m)
- `campaign_products` (m2m)
- `campaign_templates` (m2m)
- `deals`
- `interactions`

### 5.3 RLS policy pattern (MANDATED)

Apply the scaffold’s standard RLS policy pattern to each domain table (select current org, insert any org user belongs to, update/delete within org).

```sql
-- SELECT: current org only
CREATE POLICY "select" ON <table> FOR SELECT USING (
  organization_id = public.user_current_organization_id()
);

-- INSERT: any org + audit trail
CREATE POLICY "insert" ON <table> FOR INSERT WITH CHECK (
  organization_id = ANY(public.user_organization_ids()) AND auth.uid() = created_by
);

-- UPDATE/DELETE: any org user belongs to
CREATE POLICY "update" ON <table> FOR UPDATE USING (
  organization_id = ANY(public.user_organization_ids())
);
```

### 5.4 Integrity rules (must enforce)

- Interactions:
  - `person_id` must belong to same org as interaction
  - if `deal_id` provided, it must belong to same org
  - recommended guardrail: if `deal_id` provided, ensure deal.person_id matches interaction.person_id

- Deals:
  - person + product required
  - stage constrained to the pipeline set

---

## 6. Non-Functional Requirements

#### NFR-SEC-001: Multi-tenancy isolation

- RLS must prevent cross-org access even via direct Supabase queries.

#### NFR-PERF-001: List + board performance

- People list supports up to 10k records via pagination/infinite scrolling
- Deals board loads and becomes interactive quickly (target ≤ 2s on typical datasets)

#### NFR-QUAL-001: Quality gates (same as scaffold)

- `tsc --noEmit` passes
- `eslint .` passes
- `vitest run` passes

#### NFR-A11Y-001: Keyboard support for core flows

- Open person from list, open deal drawer, move stage via non-drag controls (fallback buttons)

---

## 7. Seed Data (Dev)

Add simple seed data (per org) to support quick manual QA:

- 20 People across lifecycle stages
- 3 Products
- 10 Templates (2 per category)
- 4 Campaigns (one per type)
- 15 Deals across stages
- 30 Interactions linked across people/deals/campaigns

Seed data must respect org isolation.

---

## 8. Key Patterns (CRM-Specific)

- **People-first linking**: every interaction attaches to a person; everything else is optional association.
- **Manual conversion**: no auto-deals; creating a deal is a deliberate action.
- **Simple metrics**: campaign metrics derived from actual associations, not “magic attribution.”
- **Org-scoped query keys**: all TanStack Query keys include current org id; clear cache on org switch (scaffold pattern).

---

## 9. Implementation Plan (After Scaffold)

This PRD starts **only after** Scaffolding PRD acceptance criteria are met.

### Phase D1 — People + Interactions + CSV Import

- DB: people, interactions + RLS
- UI: People list, Person detail (timeline), Add interaction, CSV import mapping + summary

### Phase D2 — Library (Products + Templates)

- DB: products, templates, template_products + RLS
- UI: Products list/detail with stage counts, Templates list/detail with status + used-in

### Phase D3 — Campaigns

- DB: campaigns + m2m tables + RLS
- UI: Campaign list/detail, add people (bulk), metrics, create deal from member

### Phase D4 — Deals Kanban + Drawer

- DB: deals + RLS
- UI: Kanban board with filters, dnd-kit implementation + keyboard fallback, deal drawer + logging interactions

### Phase D5 — Dashboard

- UI: follow-ups due, stale deals, pipeline snapshot, top products/campaigns

### Phase D6 — Polish

- Export CSV (People, Deals)
- Global quick search (optional)
- UX refinements + performance pass

---

## 10. Acceptance Criteria

1. **Prerequisite met**: All Scaffolding PRD acceptance criteria pass before starting this PRD.
2. **People CRUD**: Create/edit/archive person; person appears in list + search
3. **CSV import**: Upload CSV → map fields → import → correct created/updated counts
4. **Person hub**: Person detail shows timeline + deals + campaigns + templates used
5. **Interactions**: Add interaction (with optional associations) → appears on timeline and persists
6. **Manual deal**: Create deal from person → appears in “Prospect” on Deals board
7. **Kanban persist**: Drag deal stage change persists after refresh
8. **Board filters**: Filter by Product and Person shows correct results and counts
9. **Campaign membership**: Add people to campaign (bulk) → visible on person + campaign
10. **Campaign metrics**: People added/engaged + deals created compute correctly
11. **Product performance**: Product detail shows stage counts + link to filtered Deals board
12. **Dashboard follow-ups**: Follow-ups due list pulls from deals + interactions next_step
13. **RLS**: Direct Supabase queries cannot read/write other org’s CRM records
14. **Type-safe**: `tsc --noEmit` passes
15. **Lint-clean**: `eslint .` passes
16. **Tests pass**: `vitest run` passes
