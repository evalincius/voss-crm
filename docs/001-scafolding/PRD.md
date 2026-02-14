# PRD: CoEngineers Platform Scaffolding

**Version**: 1.2.0
**Created**: 2026-02-12
**Status**: Draft
**Scope**: Recreate the app scaffolding with fully functional Login, Signup, Multi-Tenancy, and Supabase integration only. All domain features are excluded.

---

## 1. Product Overview

CoEngineers is a dark-themed SaaS platform built with React 19, Vite 6, TypeScript 5.6 (strict mode), Tailwind CSS 4, and Supabase. It uses a **vertical slice architecture** and a **"Modern Fintech Minimalism"** design system inspired by Stripe, Linear, and Notion.

This PRD covers **only** the foundational scaffolding:

- Project setup and build tooling
- Authentication (login/signup)
- Multi-tenancy (organizations, members, invitations)
- App shell (layout, sidebar, header)
- Design system (tokens, fonts, utilities)
- Supabase integration (client, database, RLS)

---

## 2. Technology Stack

### Dependencies

| Category           | Package                                                                                                                                                                             | Version         | Notes                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------- |
| Framework          | react, react-dom                                                                                                                                                                    | ^19.0.0         | Resolves to 19.2.x                                   |
| Routing            | react-router-dom                                                                                                                                                                    | ^7.0.0          | Resolves to 7.13.x                                   |
| State              | @tanstack/react-query                                                                                                                                                               | ^5.56.0         | Resolves to 5.90.x                                   |
| State (devtools)   | @tanstack/react-query-devtools                                                                                                                                                      | ^5.56.0         | Resolves to 5.91.x                                   |
| Forms              | react-hook-form                                                                                                                                                                     | ^7.55.0         | Min 7.55.0 required by @hookform/resolvers v5        |
| Form resolvers     | @hookform/resolvers                                                                                                                                                                 | ^5.2.2          | Supports Zod 4; requires RHF >=7.55.0                |
| Validation         | zod                                                                                                                                                                                 | ^4.3.6          | Major upgrade from v3. Use `zod-v3-to-v4` codemod    |
| Backend            | @supabase/supabase-js                                                                                                                                                               | ^2.45.0         | Resolves to 2.95.x. No v3 exists                     |
| UI primitives      | @radix-ui/react-alert-dialog, react-avatar, react-dialog, react-dropdown-menu, react-label, react-scroll-area, react-select, react-separator, react-slot, react-tabs, react-tooltip | (latest)        | All currently at latest                              |
| Component variants | class-variance-authority                                                                                                                                                            | ^0.7.0          |                                                      |
| CSS utilities      | clsx, tailwind-merge                                                                                                                                                                | ^2.1.1 / ^3.4.0 | tailwind-merge v3 is for Tailwind CSS 4              |
| Theme              | next-themes                                                                                                                                                                         | ^0.4.6          | Adds React 19 peer dep. No breaking API changes      |
| Notifications      | sonner                                                                                                                                                                              | ^2.0.7          | v2: `data-theme` attr renamed to `data-sonner-theme` |
| Icons              | lucide-react                                                                                                                                                                        | ^0.563.0        |                                                      |
| Query keys         | @lukemorales/query-key-factory                                                                                                                                                      | ^1.3.4          | Already at latest                                    |

### Dev Dependencies

| Category        | Package                        | Version     | Notes                                                 |
| --------------- | ------------------------------ | ----------- | ----------------------------------------------------- |
| Language        | typescript                     | ~5.9.3      | Improved inference; may surface new type errors       |
| Bundler         | vite                           | ^7.3.1      | Drops Node 18. Requires Node >=20.19 or >=22.12       |
| React transform | @vitejs/plugin-react-swc       | ^4.2.3      | Peer dep supports Vite 4–7                            |
| CSS             | tailwindcss, @tailwindcss/vite | ^4.0.0      | Resolves to 4.1.x                                     |
| Path aliases    | vite-tsconfig-paths            | ^6.1.1      | Peer dep `vite: '*'`                                  |
| Testing         | vitest, @vitest/coverage-v8    | ^4.0.18     | Works with Vite 6 or 7. `poolOptions` config removed  |
| Testing (DOM)   | @testing-library/react         | ^16.0.1     | Resolves to 16.3.x                                    |
| Testing (DOM)   | @testing-library/jest-dom      | ^6.5.0      | Resolves to 6.9.x                                     |
| Testing (DOM)   | @testing-library/user-event    | ^14.5.2     | Resolves to 14.6.x                                    |
| Testing (DOM)   | @testing-library/dom           | ^10.4.1     | Already at latest                                     |
| Testing (DOM)   | jsdom                          | ^28.0.0     |                                                       |
| Linting         | eslint, @eslint/js             | ^9.9.1      | Stay on v9 — ESLint 10 blocked by ecosystem           |
| Linting         | typescript-eslint              | ^8.4.0      | Resolves to 8.55.x                                    |
| Linting         | eslint-plugin-react            | ^7.35.2     | Resolves to 7.37.x                                    |
| Linting         | eslint-plugin-react-hooks      | ^5.1.0-rc.0 | Stay on v5 — v7 lacks ESLint 10 peer dep              |
| Linting         | eslint-plugin-react-refresh    | ^0.5.0      |                                                       |
| Linting         | globals                        | ^15.9.0     | Stay on v15 — v17 is for ESLint 10                    |
| Formatting      | prettier                       | ^3.3.3      | Resolves to 3.8.x                                     |
| Formatting      | prettier-plugin-tailwindcss    | ^0.7.2      | Better Tailwind 4 support                             |
| Git hooks       | husky                          | ^9.1.5      | Resolves to 9.1.7                                     |
| Git hooks       | lint-staged                    | ^15.2.10    | Stay on v15 — v16 removes `--shell` flag              |
| Types           | @types/react, @types/react-dom | ^19.0.0     | Resolves to 19.2.x                                    |
| Types           | @types/node                    | ^22.5.4     | Keep v22 — matches Node.js 22 runtime. Do NOT use v25 |

### NOT included (domain-specific, add later)

- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (deal pipeline DnD)
- @elevenlabs/react (call simulations)
- @uiw/react-md-editor (artifact editing)
- buffer, gray-matter (markdown parsing)
- date-fns (date formatting — add when first feature needs it)
- zod-to-json-schema (AI structured output)
- @radix-ui/react-checkbox, react-progress, react-radio-group (add via shadcn when needed)

### Upgrade Notes

**Zod 3 → 4** (highest-effort migration):

- `.email()`, `.url()`, `.uuid()` on strings deprecated — use top-level `z.email()`, `z.url()`, `z.uuid()`
- `z.uuid()` is now strict RFC 9562 — use `z.guid()` for old permissive behavior
- Error customization: `message` param → `error` param; `invalid_type_error`/`required_error` removed
- `.format()`/`.flatten()` on ZodError deprecated → use `z.treeifyError()`
- `.merge()` deprecated → use `.extend()`
- `z.record()` requires both key and value schemas
- Codemod available: `npx zod-v3-to-v4`

**Vite 6 → 7**:

- Requires Node.js >=20.19 or >=22.12 (drops Node 18)
- Default browser target changed from `'modules'` to `'baseline-widely-available'`
- `splitVendorChunkPlugin` removed — use `build.rollupOptions.output.manualChunks`

**Vitest 2 → 4**:

- `poolOptions` config key removed — move thread/VM options to top level of test config
- `vi.restoreAllMocks()` no longer resets `vi.fn()` mocks (only `vi.spyOn()`)

**tailwind-merge 2 → 3**:

- Drops Tailwind CSS v3 support entirely — designed for Tailwind CSS v4 only
- Default `twMerge`/`cn()` works with minimal changes

**Sonner 1 → 2**:

- `data-theme` CSS attribute renamed to `data-sonner-theme`

**ESLint ecosystem — DO NOT upgrade** (Feb 2026):

- ESLint 10 released but `typescript-eslint` v8 does not support it
- `eslint-plugin-react-hooks` v7 also lacks ESLint 10 peer dep
- Wait for ecosystem to catch up before upgrading

---

## 3. Project Structure

```
/
├── .env.example
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
│
├── public/                          # Static assets (fonts, favicon)
│
├── src/
│   ├── main.tsx                     # App entry point
│   ├── vite-env.d.ts
│   │
│   ├── app/
│   │   ├── App.tsx                  # Provider composition root
│   │   └── router.tsx               # Route definitions
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx        # Authenticated shell (sidebar + header + outlet)
│   │   │   ├── AuthLayout.tsx       # Unauthenticated layout (login/signup)
│   │   │   ├── Header.tsx           # Top header bar with page title + user menu
│   │   │   ├── Sidebar.tsx          # Navigation sidebar with org switcher
│   │   │   └── index.ts
│   │   │
│   │   ├── shared/
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── PageLoader.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── ui/                      # shadcn/ui — only components used by scaffolding
│   │       ├── alert-dialog.tsx     # Org delete confirmation
│   │       ├── avatar.tsx           # User avatars in header + members list
│   │       ├── badge.tsx            # Role/status badges
│   │       ├── button.tsx           # Primary UI element
│   │       ├── card.tsx             # Auth forms, settings sections
│   │       ├── dialog.tsx           # Create org, invite member modals
│   │       ├── dropdown-menu.tsx    # User menu, org switcher
│   │       ├── input.tsx            # Form inputs
│   │       ├── label.tsx            # Form labels
│   │       ├── scroll-area.tsx      # Sidebar scroll
│   │       ├── select.tsx           # Role selection
│   │       ├── separator.tsx        # Visual dividers
│   │       ├── skeleton.tsx         # Loading placeholders
│   │       ├── sonner.tsx           # Toast notifications
│   │       ├── table.tsx            # Members + invitations lists
│   │       ├── tabs.tsx             # Org settings tabs
│   │       └── tooltip.tsx          # Sidebar collapsed tooltips
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── SignupForm.tsx
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── schemas/
│   │   │   │   └── auth.schema.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── organizations/
│   │       ├── components/
│   │       │   ├── CreateOrgDialog.tsx
│   │       │   ├── InvitationAcceptPage.tsx
│   │       │   ├── InvitationsList.tsx
│   │       │   ├── InviteMemberDialog.tsx
│   │       │   ├── MembersList.tsx
│   │       │   ├── OrgSettingsView.tsx
│   │       │   └── OrgSwitcher.tsx
│   │       ├── hooks/
│   │       │   ├── useCurrentOrganization.ts
│   │       │   ├── useInvitations.ts
│   │       │   ├── useOrganizationMembers.ts
│   │       │   └── useOrganizations.ts
│   │       ├── schemas/
│   │       │   └── index.ts
│   │       ├── services/
│   │       │   └── organizationService.ts
│   │       ├── types/
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── constants.ts             # ROUTES, APP_NAME, SIDEBAR dimensions
│   │   ├── database.types.ts        # Auto-generated (npm run db:types)
│   │   ├── queryClient.ts           # TanStack Query client config
│   │   ├── queryKeys.ts             # Query key factory
│   │   ├── supabase.ts              # Supabase client init
│   │   └── utils.ts                 # cn() helper
│   │
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   ├── DashboardPage.tsx        # Placeholder (empty shell)
│   │   ├── OrgSettingsPage.tsx
│   │   ├── InvitationAcceptPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── index.ts
│   │
│   ├── providers/
│   │   ├── AuthProvider.tsx         # Auth + organization context
│   │   ├── QueryProvider.tsx
│   │   ├── ThemeProvider.tsx
│   │   └── index.ts
│   │
│   ├── styles/
│   │   ├── fonts.css
│   │   ├── globals.css
│   │   └── tokens.css
│   │
│   └── types/
│       └── index.ts                 # Shared utility types (Database re-exports, NavItem, ApiResult)
│
├── supabase/
│   ├── config.toml
│   ├── seed.sql
│   └── migrations/                  # See Section 7
│
└── tests/
    ├── setup.ts
    ├── unit/
    ├── features/
    │   ├── auth/
    │   └── organizations/
    └── integration/
```

---

## 4. Functional Requirements

### 4.1 Authentication

#### FR-AUTH-001: Email/Password Login

- Users sign in with email and password via Supabase Auth
- Zod validation: valid email, non-empty password
- On success: session stored, redirect to `/app/dashboard`
- On failure: inline error message

#### FR-AUTH-002: Email/Password Signup

- Register with email, password, and optional full name
- Zod validation: valid email, 8+ char password (uppercase + lowercase + digit), password confirmation match
- On success: `handle_new_user` trigger creates profile + personal workspace + owner membership
- Email confirmation disabled for local dev

#### FR-AUTH-003: Session Persistence

- Supabase `localStorage` token with auto-refresh
- Stored session checked synchronously on mount (prevents login page flash)
- 5-second safety timeout prevents infinite loading

#### FR-AUTH-004: Sign Out

- Clears Supabase session, TanStack Query cache, and organization state
- Redirects to `/login`

#### FR-AUTH-005: Protected Routes

- All `/app/*` routes wrapped in `ProtectedRoute`
- Unauthenticated users redirected to `/login`
- Auth routes redirect authenticated users to `/app/dashboard`

#### FR-AUTH-006: Auth Layout vs App Layout

- `/login`, `/signup` render inside `AuthLayout` (no sidebar/header)
- `/app/*` routes render inside `AppLayout` (sidebar + header + outlet)

### 4.2 Multi-Tenancy / Organizations

#### FR-ORG-001: Automatic Personal Workspace on Signup

- `handle_new_user()` trigger on `auth.users` INSERT creates: profile, organization (`{name}'s Workspace`), owner membership, sets `current_organization_id`
- Frontend fallback via `create_organization_with_membership` RPC if trigger fails

#### FR-ORG-002: Organization Data Isolation

- RLS policies enforce membership-based access on all org-scoped tables
- SELECT uses `user_current_organization_id()` — user sees only active org data
- INSERT checks `organization_id = ANY(user_organization_ids())`
- Zero cross-org data leakage (P0 security requirement)

#### FR-ORG-003: Organization Switching

- `OrgSwitcher` in sidebar lists all user organizations
- Switching updates `profiles.current_organization_id` + calls `queryClient.clear()`

#### FR-ORG-004: Create Organization

- Any authenticated user can create via `create_organization_with_membership` RPC
- Slug auto-generated from name with random suffix

#### FR-ORG-005: Organization Settings

- Owner-only settings page at `/app/org/settings`
- Edit name/logo, manage members, manage invitations, delete org (with confirmation)

#### FR-ORG-006: Member Management

- Two roles: `owner` (full control) and `member` (data access, read-only settings)
- Owners invite via email, change roles, remove members
- Members can leave (except last owner)

#### FR-ORG-007: Invitation System

- Token-based shareable link (`/accept-invitation?token=...`)
- 7-day expiry, status lifecycle: `pending` → `accepted` | `expired` | `revoked`
- `validate_invitation_token()` + `accept_invitation()` RPCs
- Works for both logged-in and new users

#### FR-ORG-008: Organization Context in AuthProvider

- `AuthProvider` manages: `currentOrganization`, `organizations[]`, `switchOrganization()`, `refreshOrganizations()`
- `useCurrentOrganizationId()` hook
- Falls back to first available org if current is inaccessible

### 4.3 App Shell

#### FR-SHELL-001: Sidebar

- Collapsible (64px / 240px), contains: logo, org switcher, nav items
- Active: thin vertical orange bar + orange icon (`#F7931A`)
- Inactive icons: `#7B8198`

#### FR-SHELL-002: Header

- Page title based on current route, theme toggle, user menu (avatar + sign out)

#### FR-SHELL-003: Routing

Routes in scope:

- `/` → redirect to `/app/dashboard`
- `/login`, `/signup` — AuthLayout
- `/app/dashboard` — Placeholder (AppLayout)
- `/app/org/settings` — Org settings (AppLayout, lazy)
- `/accept-invitation` — Public invitation acceptance
- `*` — 404 page

#### FR-SHELL-004: Provider Stack

```
ErrorBoundary
  └── QueryProvider
       └── ThemeProvider (dark default)
            └── AuthProvider
                 └── TooltipProvider
                      ├── AppRouter
                      └── Toaster
```

---

## 5. Design System — "Modern Fintech Minimalism"

### 5.1 Color Tokens (Dark Mode — Default)

| Token                      | Value     | Usage                    |
| -------------------------- | --------- | ------------------------ |
| `--color-primary`          | `#F7931A` | CTAs, active states ONLY |
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

### 5.2 Light Mode Overrides

| Token                      | Value     |
| -------------------------- | --------- |
| `--color-bg-app`           | `#F8F9FA` |
| `--color-bg-surface`       | `#FFFFFF` |
| `--color-bg-surface-hover` | `#F1F3F4` |
| `--color-text-primary`     | `#1A1D21` |
| `--color-text-secondary`   | `#5F6368` |
| `--color-text-muted`       | `#9AA0A6` |
| `--color-border-fintech`   | `#E0E0E0` |

### 5.3 Typography

- **Headings (h1–h3)**: Satoshi Variable, 500–700, `letter-spacing: -0.02em`
- **Headings (h4–h6)**: Nunito, 700
- **Body**: Nunito, 400, `line-height: 1.5`
- **Code**: JetBrains Mono

CSS vars: `--font-heading`, `--font-body`, `--font-mono`

### 5.4 Shadows

```css
--shadow-soft: 0 1px 1px rgba(0, 0, 0, 0.4), 0 8px 24px rgba(0, 0, 0, 0.35);
--shadow-soft-sm: 0 1px 2px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.25);
--shadow-soft-lg: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 32px rgba(0, 0, 0, 0.4);
--shadow-soft-hover: 0 2px 4px rgba(0, 0, 0, 0.4), 0 12px 28px rgba(0, 0, 0, 0.38);
```

### 5.5 Layout & Spacing

- Cards: 24–32px padding, 12px border-radius, no heavy borders
- 8px grid: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64px
- Radius: `sm: 6px`, `md: 8px`, `lg: 12px`, `xl: 16px`
- Transitions: 150–200ms ease-out, no bounce/shake

### 5.6 CSS Utilities (Tailwind @utility)

| Class                                               | Purpose                                 |
| --------------------------------------------------- | --------------------------------------- |
| `card-surface`                                      | Surface bg + lg radius + soft shadow    |
| `card-surface-interactive`                          | + hover brightness/elevation            |
| `shadow-soft` / `shadow-soft-sm` / `shadow-soft-lg` | Shadow levels                           |
| `text-fintech-primary` / `secondary` / `muted`      | Text colors                             |
| `nav-indicator`                                     | Thin vertical orange bar for active nav |

### 5.7 Tailwind @theme

Maps CSS custom properties to Tailwind utilities in `globals.css`:

- `--color-primary` → `bg-primary`, `text-primary`
- `--color-primary-foreground` → `#000000`
- shadcn semantic colors: `card`, `popover`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `sidebar`

---

## 6. Supabase Configuration

### 6.1 Local Dev (`supabase/config.toml`)

| Setting             | Value                   |
| ------------------- | ----------------------- |
| API port            | 54341                   |
| DB port             | 54342                   |
| Studio port         | 54343                   |
| Inbucket port       | 54344                   |
| PostgreSQL          | 15                      |
| Auth site_url       | `http://127.0.0.1:3000` |
| Email confirmations | disabled                |
| Signup              | enabled                 |
| JWT expiry          | 3600s                   |

### 6.2 Environment Variables (`.env.example`)

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<local-anon-key>
VITE_APP_NAME=CoEngineers Base
VITE_APP_URL=http://localhost:3000
```

### 6.3 Supabase Client

```typescript
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});
```

### 6.4 TanStack Query Config

```typescript
queries: { staleTime: 5min, gcTime: 30min, retry: 1, refetchOnWindowFocus: false }
mutations: { retry: 0 }
```

---

## 7. Database Schema

Four tables + helper functions. All other domain tables (contacts, segments, deals, activities, artifacts, streaks, validation_challenges) are **out of scope**.

### 7.1 `profiles`

```sql
CREATE TYPE public.user_role AS ENUM ('admin', 'user');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user',
  current_organization_id UUID,  -- FK added after organizations table
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- RLS: user can read own profile + co-workers in same orgs
-- RLS: user can update own profile only
```

### 7.2 `organizations`

```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_by UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT — id = ANY(user_organization_ids())
-- RLS: INSERT — auth.uid() = created_by
-- RLS: UPDATE/DELETE — user is owner via organization_members
```

### 7.3 `organization_members`

```sql
CREATE TYPE public.organization_role AS ENUM ('owner', 'member');

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  invited_by UUID REFERENCES auth.users,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

ALTER TABLE public.organization_members
  ADD CONSTRAINT organization_members_profiles_fk
  FOREIGN KEY (user_id) REFERENCES public.profiles(id);

ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT — org members can see other members
-- RLS: INSERT — owner only
-- RLS: UPDATE — owner can change roles
-- RLS: DELETE — owner or self-leave
```

### 7.4 `organization_invitations`

```sql
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'revoked');

CREATE TABLE public.organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations ON DELETE CASCADE,
  email TEXT NOT NULL,
  role organization_role NOT NULL DEFAULT 'member',
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '7 days',
  created_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX org_invitations_pending_unique
  ON organization_invitations (organization_id, email) WHERE status = 'pending';

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;
-- RLS: SELECT — org owner or invitee (email matches profile)
-- RLS: INSERT/UPDATE/DELETE — owner only
```

### 7.5 FK: `profiles.current_organization_id`

```sql
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_current_org_fk
  FOREIGN KEY (current_organization_id) REFERENCES organizations(id)
  ON DELETE SET NULL;
```

### 7.6 Helper Functions

**`user_organization_ids()`** — Returns `UUID[]` of all orgs user belongs to. `SECURITY DEFINER`.

```sql
CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT COALESCE(array_agg(om.organization_id), ARRAY[]::uuid[])
  FROM public.organization_members om WHERE om.user_id = auth.uid();
$$;
```

**`user_current_organization_id()`** — Returns user's active org UUID. `SECURITY DEFINER`.

```sql
CREATE OR REPLACE FUNCTION public.user_current_organization_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT p.current_organization_id FROM public.profiles p WHERE p.id = auth.uid();
$$;
```

**`validate_invitation_token(invitation_token TEXT)`** — Returns JSONB `{ valid, error, organization_name, inviter_name, role }`. Callable by `anon` + `authenticated`.

**`accept_invitation(invitation_token TEXT)`** — Returns JSONB `{ success, error, organization_id, organization_name }`. Creates membership + updates invitation. `FOR UPDATE` locking. `authenticated` only.

**`create_organization_with_membership(org_name TEXT, org_slug TEXT DEFAULT NULL, org_logo_url TEXT DEFAULT NULL)`** — Returns JSONB `{ success, error, id, name, slug }`. Atomic org + owner creation. `authenticated` only.

**`handle_new_user()`** — Trigger on `auth.users` INSERT:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  new_org_id UUID;
  user_name TEXT;
BEGIN
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, full_name) VALUES (NEW.id, NEW.email, user_name);

  new_org_id := gen_random_uuid();
  INSERT INTO public.organizations (id, name, slug, created_by) VALUES (
    new_org_id,
    user_name || '''s Workspace',
    lower(regexp_replace(user_name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8),
    NEW.id
  );

  INSERT INTO public.organization_members (organization_id, user_id, role) VALUES (new_org_id, NEW.id, 'owner');

  UPDATE public.profiles SET current_organization_id = new_org_id WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**`update_updated_at()`** — Generic timestamp trigger, applied to `profiles` and `organizations`.

### 7.7 RLS Policy Pattern (for future domain tables)

```sql
-- SELECT: current org only
CREATE POLICY "select" ON table FOR SELECT USING (
  organization_id = public.user_current_organization_id()
);
-- INSERT: any org + audit trail
CREATE POLICY "insert" ON table FOR INSERT WITH CHECK (
  organization_id = ANY(public.user_organization_ids()) AND auth.uid() = user_id
);
-- UPDATE/DELETE: any org user belongs to
CREATE POLICY "update" ON table FOR UPDATE USING (
  organization_id = ANY(public.user_organization_ids())
);
```

### 7.8 Seed Data

```sql
-- Test user: test@example.com / password123
-- handle_new_user trigger auto-creates profile + workspace + membership
```

---

## 8. Build Configuration

### 8.1 Vite (`vite.config.ts`)

Plugins: `react()` (SWC), `tailwindcss()`, `tsconfigPaths()`

- Dev server: port 3000, auto-open
- Build: manual chunks (react, router, query, radix, forms, supabase, icons, misc), 600KB warning limit
- Test: jsdom, single fork pool, 10s timeout, v8 coverage

### 8.2 TypeScript (`tsconfig.json`)

- Target: ES2022, strict mode with all extra checks enabled
- Path alias: `@/*` → `./src/*`
- Includes: `src`, `tests`

### 8.3 ESLint (flat config)

- `consistent-type-imports: 'error'`
- `no-unused-vars` with `^_` ignore
- `no-misused-promises` (async in attributes)
- Ignores: `dist`, `node_modules`, `coverage`, `supabase/functions`

---

## 9. NPM Scripts

| Script          | Command                                                             | Purpose                |
| --------------- | ------------------------------------------------------------------- | ---------------------- |
| `dev`           | `vite`                                                              | Dev server (port 3000) |
| `build`         | `tsc -b && vite build`                                              | Type-check + build     |
| `lint`          | `eslint .`                                                          | Lint                   |
| `lint:fix`      | `eslint . --fix`                                                    | Auto-fix               |
| `format`        | `prettier --write .`                                                | Format                 |
| `typecheck`     | `tsc --noEmit`                                                      | Type-check only        |
| `test`          | `vitest`                                                            | Tests (watch mode)     |
| `test:coverage` | `vitest run --coverage`                                             | Tests with coverage    |
| `db:start`      | `supabase start`                                                    | Start local Supabase   |
| `db:stop`       | `supabase stop`                                                     | Stop local Supabase    |
| `db:reset`      | `supabase db reset`                                                 | Reset DB + seed        |
| `db:types`      | `supabase gen types typescript --local > src/lib/database.types.ts` | Regenerate types       |
| `prepare`       | `husky`                                                             | Install git hooks      |

---

## 10. Key Patterns

### Vertical Slice Architecture

```
src/features/<name>/
├── components/    # React components
├── hooks/         # TanStack Query hooks
├── schemas/       # Zod schemas
├── services/      # Supabase queries
├── types/         # TypeScript types
└── index.ts       # Barrel export
```

No cross-feature imports. Shared code in `src/lib/`.

### Data Flow

```
Supabase (PostgreSQL + RLS) → Service → Hook (TanStack Query) → Component → Page → Router
```

### Organization-Scoped Queries

- Include `organization_id` in query keys for cache isolation
- `queryClient.clear()` on org switch
- RLS enforces server-side; application queries SHOULD also filter for clarity

---

## 11. Acceptance Criteria

1. **Signup**: New user signs up → lands on dashboard with personal workspace
2. **Login**: Existing user logs in → correct organization loaded
3. **Session**: Page refresh → user stays logged in
4. **Org switching**: Switch orgs → data refreshes, no cross-org leakage
5. **Org creation**: Create org → become owner → switch to it
6. **Invitations**: Invite → link → accept → member added
7. **Org settings**: Edit name, manage members/invitations, delete org
8. **RLS**: Direct queries cannot access other orgs' data
9. **Protected routes**: `/app/*` redirects unauthenticated to `/login`
10. **Design system**: Dark theme, correct tokens, soft shadows
11. **Type-safe**: `tsc --noEmit` passes
12. **Lint-clean**: `eslint .` passes
13. **Tests pass**: `vitest run` passes
