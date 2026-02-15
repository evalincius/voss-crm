# AGENTS.md

## 1. What this repo is

- **Project:** CoEngineers Simple Sales CRM (B2C) — Phase 2
- **Goal:** Build a production-ready CRM on top of the completed scaffold foundation: auth, multi-tenancy, app shell, design system, and Supabase integration.
- **Depends on:** Scaffolding PRD acceptance criteria must already pass before Phase 2 CRM delivery.
- **Primary users:** Internal engineering team and AI agents implementing CRM vertical slices.

## 2. What the agent should do

- **Do:**
  - Follow vertical slice architecture (`src/features/<name>/`)
  - Use Zod v4 APIs (`z.email()`, `z.extend()`, `z.treeifyError()`)
  - Use `SECURITY DEFINER` helper functions for RLS (`user_organization_ids()`, `user_current_organization_id()`)
  - Include `organization_id` in every TanStack Query key for cache isolation
  - Keep `queryClient.clear()` on organization switch
  - Use `bg-bg-surface` (not `bg-card`) for cards on the app background
  - Use black (`#000000`) text on orange backgrounds (9.1:1 AAA)
  - Use `text-base` for 1rem text size
  - Use `border-radius: 2px` for nav indicator bars
  - Use `data-sonner-theme` (Sonner v2)
  - Apply RLS to every new table
  - Keep CRM behavior aligned with PRD principles:
    - B2C model (no Companies/Accounts object)
    - Manual conversion only (deals created by explicit user action)
    - People-first linking (interactions require `person_id`)
    - Keyboard fallback for deal stage movement (non-drag path)

- **Don't:**
  - Import across features — shared code goes in `src/lib/`
  - Use `z.string().email()` (deprecated in Zod 4) — use `z.email()`
  - Use `z.uuid()` for permissive matching — use `z.guid()` instead
  - Use `text-m` (not a valid Tailwind class)
  - Use `rounded-full` on nav indicators
  - Use white text on `#F7931A` (2.3:1 fails WCAG)
  - Use light mode muted text (`#9AA0A6`) for essential content (fails WCAG)
  - Use arcade shadow tokens in new work
  - Upgrade to ESLint 10, @types/node v25, globals v17, or lint-staged v16
  - Use `poolOptions` in Vitest config (removed in v4)

- **Dependency policy:**
  - Allowed CRM dependencies:
    - `@dnd-kit/core`
    - `@dnd-kit/sortable`
    - `@dnd-kit/utilities`
    - `date-fns`
    - `papaparse` (optional)
  - Do not add unrelated domain packages without explicit product requirement.

- **Constraints:**
  - **Security:** Zero cross-org data leakage (P0). RLS on every domain table. No secret API keys in browser-exposed `VITE_` env vars.
  - **Performance:** 600KB chunk warning limit. Manual chunks for react, router, query, radix, forms, supabase, icons.
  - **Node:** Requires >=20.19 or >=22.12 (Vite 7 drops Node 18).

## 3. Project map

```
src/
├── main.tsx                         # App entry point
├── app/
│   ├── App.tsx                      # Provider composition root
│   └── router.tsx                   # Route definitions
├── components/
│   ├── layout/                      # AppLayout, AuthLayout, Header, Sidebar
│   ├── shared/                      # ErrorBoundary, LoadingSpinner, PageLoader, ProtectedRoute
│   └── ui/                          # shadcn/ui components
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── people/
│   ├── interactions/
│   ├── deals/                       # target slice
│   ├── campaigns/                   # target slice
│   ├── library/
│   │   ├── products/                # target slice
│   │   └── templates/               # target slice
│   └── dashboard/                   # target slice
├── lib/                             # constants, database.types, queryClient, queryKeys, supabase, utils
├── pages/                           # route pages (dashboard, people, campaigns, deals, library, auth, org)
├── providers/                       # AuthProvider, QueryProvider, ThemeProvider
├── styles/                          # tokens.css, fonts.css, globals.css
└── types/                           # Database re-exports, NavItem, ApiResult

supabase/
├── config.toml                      # Local dev config (ports, auth settings)
├── seed.sql                         # Base and CRM seed data
└── migrations/                      # Base + domain tables, helper functions, RLS policies

tests/
├── setup.ts
├── unit/
├── features/
│   ├── auth/
│   ├── organizations/
│   ├── people/
│   ├── interactions/
│   ├── deals/                       # target tests
│   ├── campaigns/                   # target tests
│   ├── library/                     # target tests
│   └── dashboard/                   # target tests
└── integration/
```

- **Key entry points:** `src/main.tsx` → `src/app/App.tsx` → `src/app/router.tsx`
- **Key config files:** `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `supabase/config.toml`

## 4. Setup & commands

- **Install:** `npm install`
- **Run (dev):** `npm run dev` (Vite, port 3000) + `npm run db:start` (local Supabase, requires Docker)
- **Lint:** `npm run lint` / `npm run lint:fix`
- **Format:** `npm run format`
- **Test:** `npm run test` (watch) / `npm run test:coverage` (with v8 coverage)
- **Build:** `npm run build` (`tsc -b && vite build`)
- **Typecheck:** `npm run typecheck` (`tsc -b`)
- **Database:** `npm run db:start` / `npm run db:stop` / `npm run db:reset` / `npm run db:types`

## 5. Environment variables

- **Required env vars:**
  ```env
  VITE_SUPABASE_URL=http://127.0.0.1:54321
  VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key-or-local-anon-key>
  VITE_APP_NAME=CoEngineers Base
  VITE_APP_URL=http://localhost:3000
  ```
- **Where to put them:** `.env` (copied from `.env.example`)
- **Key migration note:** Supabase is replacing legacy `anon` JWT keys with publishable keys (`sb_publishable_...`). For local CLI flows, a local anon key may still be provided through `VITE_SUPABASE_PUBLISHABLE_KEY`.
- **Secrets policy:** Never put secret third-party credentials in `VITE_` env vars because they are exposed to client bundles. Supabase publishable keys are designed for client-side use.

## 6. Architecture

- **UI:** React 19 + shadcn/ui (Radix primitives) + Tailwind CSS 4 + class-variance-authority. "Modern Fintech Minimalism" design system with dark mode default.
- **State:** TanStack Query v5 for server state (staleTime: 5min, gcTime: 30min, retry: 1, refetchOnWindowFocus: false). React context for auth/org state via `AuthProvider`.
- **Navigation:** React Router v7 with protected CRM routes under `/app/*`.
- **Data layer:** Supabase (PostgreSQL 15 + RLS). Data flow: `Supabase -> Service -> Hook (TanStack Query) -> Component -> Page -> Router`.
- **Error handling:** `ErrorBoundary` wraps provider stack. Inline form errors via Zod validation. Toast notifications via Sonner.
- **Logging/analytics:** Not part of current CRM PRD scope.

### Provider stack

```
ErrorBoundary
  └── QueryProvider
       └── ThemeProvider (dark default)
            └── AuthProvider
                 └── TooltipProvider
                      ├── AppRouter
                      └── Toaster
```

### Supabase client config

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});
```

### Routing contract (protected CRM routes)

- `/app/dashboard`
- `/app/people`
- `/app/people/:id`
- `/app/campaigns`
- `/app/campaigns/:id`
- `/app/deals`
- `/app/library/products`
- `/app/library/products/:id`
- `/app/library/templates`
- `/app/library/templates/:id`

### Global quick add contract

- Required create intents: `Person`, `Interaction`, `Deal`, `Campaign`, `Template`
- Must carry current organization context
- Must be accessible from global shell UI (header action and/or command menu)

### Local Supabase ports

| Service  | Port  |
| -------- | ----- |
| API      | 54341 |
| Database | 54342 |
| Studio   | 54343 |
| Inbucket | 54344 |

Auth local defaults: email confirmations disabled, signup enabled, JWT expiry 3600s, site URL `http://127.0.0.1:3000`.

## 7. Conventions & standards

### Language + style

- TypeScript ~5.9.3, strict mode with all extra checks
- ESLint 9 flat config: `consistent-type-imports: 'error'`, `no-unused-vars` with `^_` ignore, `no-misused-promises`
- Prettier + prettier-plugin-tailwindcss
- Path alias: `@/*` -> `./src/*`

### Naming

- Files: PascalCase for components (`PeopleList.tsx`), camelCase for hooks (`usePeople.ts`), kebab-case for schemas (`people.schema.ts`)
- Exports: barrel `index.ts` per feature subdirectory

### Folder/file conventions — vertical slice

```
src/features/<name>/
├── components/    # React components
├── hooks/         # TanStack Query hooks
├── schemas/       # Zod v4 schemas
├── services/      # Supabase queries
├── types/         # TypeScript types
└── index.ts       # Barrel export (public API)
```

- No cross-feature imports.
- Shared utilities and cross-cutting helpers belong in `src/lib/`.

### CRM domain contracts

- **Person lifecycle:** `new | contacted | engaged | customer`
- **Interaction type:** `email | call | dm | meeting | note | form_submission | other`
- **Deal stage:** `prospect | offer_sent | interested | objection | validated | lost` (`won` optional)
- **Campaign type:** `cold_outreach | warm_outreach | content | paid_ads`
- **Template category:** `cold_email | warm_outreach | content | paid_ads | offer`
- **Template status:** `draft | approved | archived`

### API/services

- Services call Supabase directly and return typed results.
- Hooks wrap services with TanStack Query.
- All CRM query keys include `organization_id`.
- `queryClient.clear()` is mandatory during organization switch.
- RPC calls for org operations: `create_organization_with_membership`, `validate_invitation_token`, `accept_invitation`.

### Design system — "Modern Fintech Minimalism"

**Philosophy:** Reduce visual noise. Let hierarchy + spacing do the work. Use orange for intent only. Flat depth with soft shadows. UX-first.

**Color tokens (dark mode default):**

| Token                      | Value     | Usage                    |
| -------------------------- | --------- | ------------------------ |
| `--color-primary`          | `#F7931A` | CTAs, active states only |
| `--color-bg-app`           | `#0E0F12` | App background           |
| `--color-bg-surface`       | `#151821` | Card/surface backgrounds |
| `--color-bg-surface-hover` | `#1C2030` | Hover states             |
| `--color-border-fintech`   | `#23283A` | Borders, dividers        |
| `--color-text-primary`     | `#E6E8EE` | Main text                |
| `--color-text-secondary`   | `#A2A8BD` | Supporting text          |
| `--color-text-muted`       | `#6E748A` | Disabled/placeholder     |
| `--color-success`          | `#22C55E` | Success                  |
| `--color-warning`          | `#EAB308` | Warning                  |
| `--color-error`            | `#EF4444` | Error/destructive        |

**Light mode overrides:**

| Token                      | Light Value |
| -------------------------- | ----------- |
| `--color-bg-app`           | `#F8F9FA`   |
| `--color-bg-surface`       | `#FFFFFF`   |
| `--color-bg-surface-hover` | `#F1F3F4`   |
| `--color-text-primary`     | `#1A1D21`   |
| `--color-text-secondary`   | `#5F6368`   |
| `--color-text-muted`       | `#9AA0A6`   |
| `--color-border-fintech`   | `#E0E0E0`   |

**Tailwind @theme:** `--color-primary-foreground` is `#000000` (component usage must render black text on orange actions).

**Typography:**

| Role           | Font                                | Weight  | Letter Spacing             |
| -------------- | ----------------------------------- | ------- | -------------------------- |
| Headings h1-h3 | Satoshi Variable (`--font-heading`) | 500-700 | `-0.02em`                  |
| Headings h4-h6 | Nunito (`--font-body`)              | 700     | normal                     |
| Body           | Nunito (`--font-body`)              | 400     | normal, `line-height: 1.5` |
| Code           | JetBrains Mono (`--font-mono`)      | -       | -                          |
| Numbers/KPIs   | Satoshi                             | medium  | tabular-nums               |

**Shadows (dark mode):**

```css
--shadow-soft: 0 1px 1px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-soft-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
--shadow-soft-lg: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.4);
--shadow-soft-hover: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.38);
```

**Layout:** Cards 24-32px padding, 12px border-radius. 4px base grid. Radius: `sm: 6px`, `md: 8px`, `lg: 12px`, `xl: 16px`. Transitions: 150-200ms ease-out.

**CSS utilities (`@utility`):** `card-surface`, `card-surface-interactive`, `shadow-soft[-sm|-lg]`, `text-fintech-primary|secondary|muted`, `nav-indicator`.

**Navigation:** Sidebar darker than content. Active indicator: 3px orange bar, `border-radius: 2px`. Icons: inactive `#7B8198`, active `#F7931A`, size `h-5 w-5`, item height `h-10`.

### Accessibility

- Muted text (`#6E748A` dark / `#9AA0A6` light) is only for non-essential content.
- White on orange fails WCAG; use black text on primary orange.
- Orange text on light surfaces fails WCAG; use orange only for non-text accents in light mode.
- Focus: `outline: 2px solid #F7931A; outline-offset: 2px`
- Buttons: `focus-visible:ring-[3px] focus-visible:ring-ring/50`
- Deals Kanban must provide non-drag keyboard controls for stage changes.

## 8. Workflow

- **Branching:** Feature branches off `main`
- **Commits:** Conventional commits, lowercase subjects (commitlint via husky + lint-staged)
- **PR expectations:** Lint clean, typecheck passes, tests pass, RLS on all new/changed domain tables

### CRM delivery phases (target)

- **D1:** People + Interactions + CSV Import
- **D2:** Library (Products + Templates)
- **D3:** Campaigns
- **D4:** Deals Kanban + Drawer
- **D5:** Dashboard
- **D6:** Polish (CSV export, UX/perf pass, optional quick search)

### Review checklist

- [ ] No cross-feature imports
- [ ] Organization-scoped query keys include `organization_id`
- [ ] `queryClient.clear()` on organization switch remains intact
- [ ] RLS policies exist on all new/modified domain tables
- [ ] Integrity rules enforce same-org references
- [ ] Zod v4 APIs used (not deprecated patterns)
- [ ] Design tokens used correctly (no hardcoded colors)
- [ ] No secret `VITE_` env vars
- [ ] Route/nav/header/title mappings updated for any new CRM page

## 9. Testing

- **Tools:** Vitest ^4.0.18 + @testing-library/react + jsdom
- **Where tests live:**
  - `tests/unit/`
  - `tests/features/{auth,organizations,people,interactions,deals,campaigns,library,dashboard}/`
  - `tests/integration/`
- **How to run:** `npm run test` (watch) / `npm run test:coverage` (v8 coverage)
- **Quality gates:**
  - `npm run typecheck`
  - `npm run lint`
  - `vitest run`
- **Expectations:**
  - Vitest v4: `poolOptions` removed — thread/VM options live at top level
  - `vi.restoreAllMocks()` does not reset `vi.fn()` mocks
  - 10-second timeout per test, single fork pool
  - Core CRM flows have keyboard-accessible paths, including deal stage movement without drag-and-drop

## 10. Feature implementation playbook

1. Create or extend feature slice: `src/features/<feature-name>/`
2. Define types in `types/index.ts`
3. Define Zod schemas in `schemas/` using Zod v4 APIs
4. Implement Supabase service layer in `services/`
5. Implement TanStack Query hooks in `hooks/` with `organization_id` in query keys
6. Build feature components in `components/`
7. Export public API via `index.ts`
8. Add/update page in `src/pages/`
9. Export page via `src/pages/index.ts`
10. Add route constants in `src/lib/constants.ts`
11. Register route in `src/app/router.tsx`
12. Update nav item in `src/components/layout/Sidebar.tsx` if needed
13. Update page title mapping in `src/components/layout/Header.tsx`
14. Add feature tests under `tests/features/<feature-name>/`
15. If schema changes: add migration + RLS + integrity constraints, then run `npm run db:types`

### Database table template (domain tables)

```sql
-- Enable RLS
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

-- SELECT: current org only
CREATE POLICY "select" ON public.<table> FOR SELECT USING (
  organization_id = public.user_current_organization_id()
);

-- INSERT: any org user belongs to + audit trail
CREATE POLICY "insert" ON public.<table> FOR INSERT WITH CHECK (
  organization_id = ANY(public.user_organization_ids()) AND auth.uid() = created_by
);

-- UPDATE/DELETE: any org user belongs to
CREATE POLICY "update" ON public.<table> FOR UPDATE USING (
  organization_id = ANY(public.user_organization_ids())
);

CREATE POLICY "delete" ON public.<table> FOR DELETE USING (
  organization_id = ANY(public.user_organization_ids())
);
```

### Routing table (CRM)

| Route                        | Layout     | Notes                        |
| ---------------------------- | ---------- | ---------------------------- |
| `/`                          | -          | Redirect to `/app/dashboard` |
| `/login`                     | AuthLayout | Public                       |
| `/signup`                    | AuthLayout | Public                       |
| `/app/dashboard`             | AppLayout  | CRM overview                 |
| `/app/people`                | AppLayout  | People list                  |
| `/app/people/:id`            | AppLayout  | Person hub                   |
| `/app/campaigns`             | AppLayout  | Campaign list                |
| `/app/campaigns/:id`         | AppLayout  | Campaign detail              |
| `/app/deals`                 | AppLayout  | Deals board                  |
| `/app/library/products`      | AppLayout  | Products list                |
| `/app/library/products/:id`  | AppLayout  | Product detail               |
| `/app/library/templates`     | AppLayout  | Templates list               |
| `/app/library/templates/:id` | AppLayout  | Template detail              |
| `/app/org/settings`          | AppLayout  | Organization settings        |
| `/accept-invitation`         | -          | Public invitation acceptance |
| `*`                          | -          | 404                          |

## 11. Definition of done

- [ ] `npm run lint` passes (zero warnings/errors)
- [ ] `npm run typecheck` passes
- [ ] `vitest run` passes
- [ ] Loading, error, and empty states handled
- [ ] No secret credentials committed (`VITE_` exposure check)
- [ ] RLS enabled on all new domain tables with correct policies
- [ ] Same-org integrity constraints enforced for cross-table references
- [ ] Query keys remain org-scoped (`organization_id` included)
- [ ] Design tokens used (no hardcoded colors)
- [ ] Conventional commit message (lowercase subject)
- [ ] Docs updated when contracts change

## 12. Troubleshooting

### Common issues

| Issue                                       | Fix                                                                                                                |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `text-m` not working                        | Invalid Tailwind class. Use `text-base`.                                                                           |
| White text on orange buttons                | Accessibility failure. Use black foreground (`--color-primary-foreground: #000000`).                               |
| Nav indicator too rounded                   | Use `border-radius: 2px`, not `rounded-full`.                                                                      |
| `z.string().email()` type issue             | Zod v4 deprecates this usage. Use `z.email()`.                                                                     |
| `z.uuid()` rejects permissive input         | Use `z.guid()` where permissive GUID matching is required.                                                         |
| Vitest `poolOptions` error                  | Move thread/VM options to top-level Vitest config.                                                                 |
| Sonner theme not applying                   | Use `data-sonner-theme` (v2), not `data-theme`.                                                                    |
| Cross-org data appears in CRM screens       | Verify RLS policies and ensure query keys include `organization_id`; clear cache on org switch.                    |
| Interaction insert fails unexpectedly       | `person_id` is required and referenced records must belong to same `organization_id`.                              |
| Deal create fails validation                | Ensure required fields (`person_id`, `primary_product_id`) are provided and stage matches allowed pipeline values. |
| Kanban drag works but keyboard path missing | Add explicit non-drag controls for stage change to satisfy accessibility requirements.                             |
| Stale records after org switch              | Confirm `queryClient.clear()` runs in organization switching flow.                                                 |

### Reset steps

```bash
# Full reset: dependencies + database
rm -rf node_modules && npm install
npm run db:reset
npm run db:types
npm run dev
```

### Technology versions (reference)

| Package             | Version  | Critical notes                     |
| ------------------- | -------- | ---------------------------------- |
| typescript          | ~5.9.3   | Strict mode baseline               |
| vite                | ^7.3.1   | Node >=20.19 or >=22.12            |
| vitest              | ^4.0.18  | No `poolOptions`                   |
| zod                 | ^4.3.6   | Use v4 APIs                        |
| react-hook-form     | ^7.55.0  | Required by @hookform/resolvers v5 |
| @hookform/resolvers | ^5.2.2   | Supports Zod 4                     |
| tailwind-merge      | ^3.4.0   | Tailwind CSS 4 compatible          |
| sonner              | ^2.0.7   | `data-sonner-theme`                |
| eslint              | ^9.9.1   | Keep on v9                         |
| lint-staged         | ^15.2.10 | Keep on v15                        |

### Database schema (base + CRM domain)

- **Base tables:** `profiles`, `organizations`, `organization_members`, `organization_invitations`
- **Domain tables (target):**
  - `people`
  - `products`
  - `templates`
  - `template_products`
  - `campaigns`
  - `campaign_people`
  - `campaign_products`
  - `campaign_templates`
  - `deals`
  - `interactions`

**Helper functions:** `user_organization_ids()`, `user_current_organization_id()`, `validate_invitation_token()`, `accept_invitation()`, `create_organization_with_membership()`, `handle_new_user()`, `update_updated_at()`.

**Required integrity rules:**

- Cross-table references must remain within the same `organization_id`
- Interactions require `person_id`
- If interaction includes `deal_id`, guard that `deal.person_id` matches `interaction.person_id`
- Deals require person + primary product

**Seed data target (per org):** 20 People, 3 Products, 10 Templates, 4 Campaigns, 15 Deals, 30 Interactions.
