# AGENTS.md

## 1. What this repo is

- **Project:** CoEngineers Platform — dark-themed SaaS scaffolding
- **Goal:** Fully functional authentication, multi-tenancy (organizations/members/invitations), app shell (sidebar + header + routing), design system ("Modern Fintech Minimalism"), and Supabase integration. All domain features (contacts, deals, activities, gamification, builder, etc.) are **out of scope**.
- **Primary users:** Internal engineering team and AI agents building on top of this scaffolding

## 2. What the agent should do

- **Do:**
  - Follow vertical slice architecture (`src/features/<name>/`)
  - Use Zod v4 APIs (`z.email()`, `z.extend()`, `z.treeifyError()`)
  - Use `SECURITY DEFINER` helper functions for RLS (`user_organization_ids()`, `user_current_organization_id()`)
  - Include `organization_id` in TanStack Query keys for cache isolation
  - Use `bg-bg-surface` (not `bg-card`) for cards on the app background
  - Use black (`#000000`) text on orange backgrounds (9.1:1 AAA)
  - Use `text-base` for 1rem text size
  - Use `border-radius: 2px` for nav indicator bars
  - Use `data-sonner-theme` (Sonner v2)
  - Apply RLS to every new table — no exceptions
- **Don't:**
  - Import across features — shared code goes in `src/lib/`
  - Use `z.string().email()` (deprecated in Zod 4) — use `z.email()`
  - Use `z.uuid()` for permissive matching — use `z.guid()` instead
  - Use `text-m` (not a valid Tailwind class)
  - Use `rounded-full` on nav indicators
  - Use white text on `#F7931A` (2.3:1 fails WCAG)
  - Use light mode muted text (`#9AA0A6`) for essential content (fails all WCAG levels)
  - Use arcade shadow tokens in new work
  - Upgrade to ESLint 10, @types/node v25, globals v17, or lint-staged v16
  - Use `poolOptions` in Vitest config (removed in v4)
  - Add domain-specific packages (@dnd-kit/\*, @elevenlabs/react, date-fns, etc.)
- **Constraints:**
  - **Security:** Zero cross-org data leakage (P0). RLS on every table. No API keys in client-side `VITE_` env vars.
  - **Performance:** 600KB chunk warning limit. Manual chunks for react, router, query, radix, forms, supabase, icons.
  - **Node:** Requires >=20.19 or >=22.12 (Vite 7 drops Node 18)

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
│   └── ui/                          # shadcn/ui components (scaffolding only)
├── features/
│   ├── auth/                        # Login, signup, session, sign out
│   └── organizations/               # Org CRUD, members, invitations, switcher
├── lib/                             # constants, database.types, queryClient, queryKeys, supabase, utils
├── pages/                           # LoginPage, SignupPage, DashboardPage, OrgSettingsPage, etc.
├── providers/                       # AuthProvider, QueryProvider, ThemeProvider
├── styles/                          # tokens.css, fonts.css, globals.css
└── types/                           # Database re-exports, NavItem, ApiResult

supabase/
├── config.toml                      # Local dev config (ports, auth settings)
├── seed.sql                         # Test user: test@example.com / password123
└── migrations/                      # 4 tables + helper functions + RLS policies

tests/
├── setup.ts
├── unit/
├── features/{auth,organizations}/
└── integration/
```

- **Key entry points:** `src/main.tsx` → `src/app/App.tsx` → `src/app/router.tsx`
- **Key config files:** `vite.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `supabase/config.toml`

## 4. Setup & commands

- **Install:** `npm install`
- **Run (dev):** `npm run dev` (Vite, port 3000, auto-open) + `npm run db:start` (local Supabase, requires Docker)
- **Lint:** `npm run lint` / `npm run lint:fix`
- **Format:** `npm run format`
- **Test:** `npm run test` (watch) / `npm run test:coverage` (with v8 coverage)
- **Build:** `npm run build` (`tsc -b && vite build`)
- **Typecheck:** `npm run typecheck` (`tsc --noEmit`)
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
- **Key migration note:** Supabase is replacing the legacy `anon` JWT key with a new **publishable key** (format `sb_publishable_...`). Use `VITE_SUPABASE_PUBLISHABLE_KEY` for new work. The local Supabase CLI does not yet support publishable keys, so for local dev you can still pass the local anon key via this env var. Both key types work with `createClient()`. See [Supabase API keys docs](https://supabase.com/docs/guides/api/api-keys) for details.
- **Secrets policy:** Never add API keys with `VITE_` prefix — they are exposed in the browser bundle. Publishable keys are designed to be safe for client-side use. Third-party keys (Gemini, ElevenLabs, Gamma) are domain-feature concerns and out of scope for scaffolding.

## 6. Architecture

- **UI:** React 19 + shadcn/ui (Radix primitives) + Tailwind CSS 4 + class-variance-authority. "Modern Fintech Minimalism" design system with dark mode default.
- **State:** TanStack Query v5 for server state (staleTime: 5min, gcTime: 30min, retry: 1, refetchOnWindowFocus: false). React context for auth/org state via `AuthProvider`.
- **Navigation:** React Router v7. `/login` + `/signup` use `AuthLayout`. `/app/*` uses `AppLayout` (sidebar + header + outlet). `ProtectedRoute` guards all `/app/*` routes.
- **Data layer:** Supabase (PostgreSQL 15 + RLS). Data flow: `Supabase → Service → Hook (TanStack Query) → Component → Page → Router`. Organization-scoped queries include `organization_id` in query keys; `queryClient.clear()` on org switch.
- **Error handling:** `ErrorBoundary` wraps the provider stack. Inline form errors via Zod validation. Toast notifications via Sonner.
- **Logging/analytics:** None in scaffolding scope.

### Provider Stack

```
ErrorBoundary
  └── QueryProvider
       └── ThemeProvider (dark default)
            └── AuthProvider
                 └── TooltipProvider
                      ├── AppRouter
                      └── Toaster
```

### Supabase Client Config

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});
```

### Local Supabase Ports

| Service  | Port  |
| -------- | ----- |
| API      | 54341 |
| Database | 54342 |
| Studio   | 54343 |
| Inbucket | 54344 |

Auth: email confirmations disabled, signup enabled, JWT expiry 3600s, site_url `http://127.0.0.1:3000`.

## 7. Conventions & standards

### Language + style

- TypeScript ~5.9.3, strict mode with all extra checks
- ESLint 9 flat config: `consistent-type-imports: 'error'`, `no-unused-vars` with `^_` ignore, `no-misused-promises`
- Prettier + prettier-plugin-tailwindcss
- Path alias: `@/*` → `./src/*`

### Naming

- Files: PascalCase for components (`LoginForm.tsx`), camelCase for hooks (`useAuth.ts`), kebab-case for schemas (`auth.schema.ts`)
- Exports: barrel `index.ts` per feature subdirectory

### Folder/file conventions — Vertical Slice

```
src/features/<name>/
├── components/    # React components
├── hooks/         # TanStack Query hooks
├── schemas/       # Zod v4 schemas
├── services/      # Supabase queries
├── types/         # TypeScript types
└── index.ts       # Barrel export (public API)
```

No cross-feature imports. Shared code in `src/lib/`.

### Components

- shadcn/ui in `src/components/ui/` (scaffolding subset: alert-dialog, avatar, badge, button, card, dialog, dropdown-menu, input, label, scroll-area, select, separator, skeleton, sonner, table, tabs, tooltip)
- Layout in `src/components/layout/` (AppLayout, AuthLayout, Header, Sidebar)
- Shared in `src/components/shared/` (ErrorBoundary, LoadingSpinner, PageLoader, ProtectedRoute)

### API/services

- Services call Supabase directly, return typed results
- Hooks wrap services with TanStack Query, include `organization_id` in query keys
- RPC calls for org operations: `create_organization_with_membership`, `validate_invitation_token`, `accept_invitation`

### Design system — "Modern Fintech Minimalism"

**Philosophy:** Reduce visual noise. Let hierarchy + spacing do the work. Use orange for intent only. Flat depth with soft shadows. UX-first.

**Color tokens (dark mode default):**

| Token                      | Value     | Usage                                      |
| -------------------------- | --------- | ------------------------------------------ |
| `--color-primary`          | `#F7931A` | CTAs, active states ONLY                   |
| `--color-bg-app`           | `#0E0F12` | App background                             |
| `--color-bg-surface`       | `#151821` | Card/surface backgrounds                   |
| `--color-bg-surface-hover` | `#1C2030` | Hover states                               |
| `--color-border-fintech`   | `#23283A` | Borders, dividers                          |
| `--color-text-primary`     | `#E6E8EE` | Main text                                  |
| `--color-text-secondary`   | `#A2A8BD` | Supporting text                            |
| `--color-text-muted`       | `#6E748A` | Disabled/placeholder                       |
| `--color-success`          | `#22C55E` | Success                                    |
| `--color-warning`          | `#EAB308` | Warning (matches Tailwind v4 `yellow-500`) |
| `--color-error`            | `#EF4444` | Error/destructive                          |

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

**Tailwind @theme:** Maps CSS custom properties in `globals.css`. `--color-primary-foreground` is `#000000` (the `@theme` override wins over the `#FFFFFF` token layer value).

**Typography:**

| Role           | Font                                | Weight  | Letter Spacing             |
| -------------- | ----------------------------------- | ------- | -------------------------- |
| Headings h1–h3 | Satoshi Variable (`--font-heading`) | 500–700 | `-0.02em`                  |
| Headings h4–h6 | Nunito (`--font-body`)              | 700     | normal                     |
| Body           | Nunito (`--font-body`)              | 400     | normal, `line-height: 1.5` |
| Code           | JetBrains Mono (`--font-mono`)      | —       | —                          |
| Numbers/KPIs   | Satoshi                             | medium  | tabular-nums               |

**Shadows (dark mode):**

```css
--shadow-soft: 0 1px 1px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-soft-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
--shadow-soft-lg: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.4);
--shadow-soft-hover: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.38);
```

**Layout:** Cards 24–32px padding, 12px border-radius. 4px base grid. Radius: `sm: 6px`, `md: 8px`, `lg: 12px`, `xl: 16px`. Transitions: 150–200ms ease-out, no bounce/shake.

**CSS utilities (@utility):** `card-surface`, `card-surface-interactive`, `shadow-soft[-sm|-lg]`, `text-fintech-primary|secondary|muted`, `nav-indicator`.

**Navigation:** Sidebar darker than content. Active indicator: 3px orange bar, `border-radius: 2px`. Icons: inactive `#7B8198`, active `#F7931A`, size `h-5 w-5`, item height `h-10`.

### Accessibility

- Muted text (`#6E748A` dark / `#9AA0A6` light) fails AA for normal text — use only for non-essential content
- White on orange (2.3:1) fails WCAG — always use black on orange
- Orange on light surfaces (2.3:1) fails — use orange only for non-text elements in light mode
- Focus: `outline: 2px solid #F7931A; outline-offset: 2px`
- Buttons: `focus-visible:ring-[3px] focus-visible:ring-ring/50`

## 8. Workflow

- **Branching:** Feature branches off `main`
- **Commits:** Conventional commits, lowercase subjects (enforced by commitlint via husky + lint-staged)
- **PR expectations:** Lint clean, typecheck passes, tests pass, RLS on all new tables
- **Review checklist:**
  - [ ] No cross-feature imports
  - [ ] Organization-scoped queries include `organization_id` in query key
  - [ ] RLS policies on any new/modified tables
  - [ ] Zod v4 APIs used (not deprecated v3 patterns)
  - [ ] Design tokens used correctly (not hardcoded colors)
  - [ ] No `VITE_` prefixed secrets

## 9. Testing

- **Tools:** Vitest ^4.0.18 + @testing-library/react + jsdom
- **Where tests live:** `tests/unit/`, `tests/features/{auth,organizations}/`, `tests/integration/`
- **How to run:** `npm run test` (watch) / `npm run test:coverage` (v8 coverage)
- **Expectations:**
  - Tests must pass (`vitest run`)
  - Vitest v4: `poolOptions` removed — thread/VM options at top level
  - `vi.restoreAllMocks()` no longer resets `vi.fn()` mocks (only `vi.spyOn()`)
  - 10-second timeout per test, single fork pool

## 10. Feature implementation playbook

1. Create feature directory: `src/features/<feature-name>/`
2. Define types: `src/features/<feature-name>/types/index.ts`
3. Create Zod schemas (v4 APIs): `src/features/<feature-name>/schemas/`
4. Create Supabase service: `src/features/<feature-name>/services/`
5. Create TanStack Query hook (include `organization_id` in query keys): `src/features/<feature-name>/hooks/`
6. Build components: `src/features/<feature-name>/components/`
7. Barrel export: `src/features/<feature-name>/index.ts`
8. Create page: `src/pages/<Name>Page.tsx`
9. Export page: add to `src/pages/index.ts`
10. Add route constant: `ROUTES.<NAME>` in `src/lib/constants.ts`
11. Register route: add to children in `src/app/router.tsx`
12. Add nav item in `src/components/layout/Sidebar.tsx`
13. Add page title mapping in `src/components/layout/Header.tsx`
14. Write tests: `tests/features/<feature-name>/`
15. If DB needed: create migration with RLS policies, run `npm run db:types`

### Database table template (for future domain tables)

```sql
-- Enable RLS
ALTER TABLE public.<table> ENABLE ROW LEVEL SECURITY;

-- SELECT: current org only
CREATE POLICY "select" ON <table> FOR SELECT USING (
  organization_id = public.user_current_organization_id()
);
-- INSERT: any org user belongs to + audit trail
CREATE POLICY "insert" ON <table> FOR INSERT WITH CHECK (
  organization_id = ANY(public.user_organization_ids()) AND auth.uid() = user_id
);
-- UPDATE/DELETE: any org user belongs to
CREATE POLICY "update" ON <table> FOR UPDATE USING (
  organization_id = ANY(public.user_organization_ids())
);
```

### Routing table (scaffolding)

| Route                | Layout     | Notes                        |
| -------------------- | ---------- | ---------------------------- |
| `/`                  | —          | Redirect to `/app/dashboard` |
| `/login`             | AuthLayout |                              |
| `/signup`            | AuthLayout |                              |
| `/app/dashboard`     | AppLayout  | Placeholder shell            |
| `/app/org/settings`  | AppLayout  | Lazy-loaded                  |
| `/accept-invitation` | —          | Public invitation acceptance |
| `*`                  | —          | 404 page                     |

## 11. Definition of Done

- [ ] `npm run lint` passes (zero warnings/errors)
- [ ] `npm run typecheck` passes (TypeScript strict)
- [ ] `npm run test` passes
- [ ] Handles loading, error, and empty states
- [ ] No secrets committed (no `VITE_` API keys)
- [ ] RLS enabled on all new tables with correct policies
- [ ] Design tokens used (no hardcoded colors)
- [ ] Conventional commit message (lowercase subject)
- [ ] Docs updated if needed

## 12. Troubleshooting

### Common issues

| Issue                                  | Fix                                                                                                         |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `text-m` not working                   | Not a valid Tailwind class — use `text-base` (1rem)                                                         |
| White text on orange buttons           | Never use — 2.3:1 WCAG fail. `--color-primary-foreground` is `#000000` via Tailwind `@theme`.               |
| Primary foreground renders wrong color | Token layer has `#FFFFFF`, Tailwind `@theme` overrides to `#000000`. The Tailwind value wins in components. |
| Nav indicator too rounded              | Uses `border-radius: 2px`, NOT `rounded-full`                                                               |
| `z.string().email()` type error        | Deprecated in Zod 4 — use `z.email()`                                                                       |
| `z.uuid()` too strict                  | Zod 4 is strict RFC 9562 — use `z.guid()` for permissive matching                                           |
| Vitest `poolOptions` error             | Removed in Vitest 4 — move thread/VM options to top level                                                   |
| Sonner theme not applying              | `data-theme` renamed to `data-sonner-theme` in Sonner v2                                                    |
| ESLint peer dep conflicts              | Do NOT upgrade to ESLint 10 — ecosystem not ready (Feb 2026). Stay on ESLint 9, globals v15.                |
| `@types/node` type errors              | Keep v22 — do NOT use v25                                                                                   |
| lint-staged `--shell` error            | Stay on v15 — v16 removes the `--shell` flag                                                                |
| Cross-org data visible                 | Check RLS policies use `user_current_organization_id()` for SELECT                                          |
| Stale data after org switch            | Ensure `queryClient.clear()` is called in `switchOrganization()`                                            |

### Reset steps

```bash
# Full reset: dependencies + database
rm -rf node_modules && npm install
npm run db:reset          # Resets DB, applies all migrations, runs seed.sql
npm run db:types          # Regenerate TypeScript types
npm run dev               # Restart dev server
```

### Technology versions (reference)

| Package             | Version  | Critical Notes                     |
| ------------------- | -------- | ---------------------------------- |
| typescript          | ~5.9.3   | May surface new type errors vs 5.6 |
| vite                | ^7.3.1   | Node >=20.19 or >=22.12            |
| vitest              | ^4.0.18  | No `poolOptions`                   |
| zod                 | ^4.3.6   | Major API changes from v3          |
| react-hook-form     | ^7.55.0  | Required by @hookform/resolvers v5 |
| @hookform/resolvers | ^5.2.2   | Supports Zod 4                     |
| tailwind-merge      | ^3.4.0   | For Tailwind CSS 4 only            |
| sonner              | ^2.0.7   | `data-sonner-theme`                |
| eslint              | ^9.9.1   | Do NOT upgrade to v10              |
| lint-staged         | ^15.2.10 | Do NOT upgrade to v16              |

### Database schema (scaffolding only)

Four tables: `profiles`, `organizations`, `organization_members`, `organization_invitations`.

**Helper functions:** `user_organization_ids()`, `user_current_organization_id()`, `validate_invitation_token()`, `accept_invitation()`, `create_organization_with_membership()`, `handle_new_user()` (trigger), `update_updated_at()` (trigger).

**Seed data:** `test@example.com` / `password123` — `handle_new_user` trigger auto-creates profile + workspace + membership.
