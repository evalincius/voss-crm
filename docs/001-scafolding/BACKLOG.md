# BACKLOG: CoEngineers Platform Scaffolding

**PRD Version**: 1.2.0
**Generated**: 2026-02-14
**Status**: Ready for implementation

---

## 1. Overview

This backlog implements the CoEngineers platform scaffolding from scratch: a React 19 + Vite 7 + TypeScript + Tailwind CSS 4 + Supabase SaaS application with email/password authentication, multi-tenant organizations (create, switch, invite, manage), an app shell (sidebar, header, routing), and a dark-first "Modern Fintech Minimalism" design system. The project currently has only empty directory stubs — no source files, config files, or database schema exist yet.

The backlog is organized as 6 vertical-slice deliverables that build on each other, from project tooling through to the invitation system. Each deliverable produces a runnable, demo-able increment.

---

## 2. Assumptions

- **A1**: Node.js >=20.19 or >=22.12 is installed on the dev machine.
- **A2**: Supabase CLI is installed globally or via npx for local development.
- **A3**: Fonts (Satoshi Variable, Nunito, JetBrains Mono) will be self-hosted in `public/fonts/`.
- **A4**: No CI/CD pipeline is in scope — this is local-dev only.
- **A5**: shadcn/ui components will be hand-written to match the PRD specs (no `npx shadcn` CLI, since versions/configs may diverge).
- **A6**: Email confirmation is disabled in local Supabase; signup is immediate.
- **A7**: The `dist/` and `node_modules/` directories already exist and will be replaced/regenerated.
- **A8**: Tests use Vitest + @testing-library/react with jsdom.

---

## 3. Requirements

### Functional Requirements

| ID  | Requirement                                                                           | Source       |
| --- | ------------------------------------------------------------------------------------- | ------------ |
| R1  | Email/password login with Zod validation, session redirect                            | FR-AUTH-001  |
| R2  | Email/password signup with validation, auto profile+workspace creation                | FR-AUTH-002  |
| R3  | Session persistence with auto-refresh, no login flash, 5s timeout                     | FR-AUTH-003  |
| R4  | Sign out clears session, cache, org state; redirects to /login                        | FR-AUTH-004  |
| R5  | Protected routes redirect unauthenticated users to /login                             | FR-AUTH-005  |
| R6  | Auth layout (no shell) vs App layout (sidebar+header)                                 | FR-AUTH-006  |
| R7  | Automatic personal workspace on signup via DB trigger                                 | FR-ORG-001   |
| R8  | RLS-enforced org data isolation, zero cross-org leakage                               | FR-ORG-002   |
| R9  | Org switcher in sidebar, updates current_organization_id + clears cache               | FR-ORG-003   |
| R10 | Create organization via RPC, auto-generated slug                                      | FR-ORG-004   |
| R11 | Org settings page (owner-only): edit name/logo, manage members, delete                | FR-ORG-005   |
| R12 | Member management: two roles (owner/member), invite, change role, remove              | FR-ORG-006   |
| R13 | Token-based invitation system with 7-day expiry, RPCs                                 | FR-ORG-007   |
| R14 | AuthProvider manages org context, switchOrganization, fallback                        | FR-ORG-008   |
| R15 | Collapsible sidebar with logo, org switcher, nav, active indicator                    | FR-SHELL-001 |
| R16 | Header with page title, theme toggle, user menu                                       | FR-SHELL-002 |
| R17 | Route definitions as specified (/, /login, /signup, /app/\*, /accept-invitation, 404) | FR-SHELL-003 |
| R18 | Provider stack: ErrorBoundary > Query > Theme > Auth > Tooltip > Router + Toaster     | FR-SHELL-004 |

### Constraints / Non-Functional Requirements

| ID  | Constraint                                                                              | Source                   |
| --- | --------------------------------------------------------------------------------------- | ------------------------ |
| C1  | React 19, Vite 7, TypeScript 5.9 strict, Tailwind CSS 4                                 | Section 2                |
| C2  | Zod 4 (not v3) with updated API                                                         | Section 2, Upgrade Notes |
| C3  | Dark-first design system: "Modern Fintech Minimalism" tokens, fonts, shadows            | Section 5                |
| C4  | Vertical slice architecture: features/{name}/{components,hooks,schemas,services,types}  | Section 3, 10            |
| C5  | Path alias @/_ -> ./src/_                                                               | Section 8.2              |
| C6  | ESLint 9 flat config with consistent-type-imports, no-unused-vars ^\_                   | Section 8.3              |
| C7  | Prettier + prettier-plugin-tailwindcss                                                  | Section 2 (Dev Deps)     |
| C8  | Husky + lint-staged for git hooks                                                       | Section 2 (Dev Deps)     |
| C9  | Vitest 4 with jsdom, v8 coverage                                                        | Section 8.1              |
| C10 | Manual chunks in Vite build (react, router, query, radix, forms, supabase, icons, misc) | Section 8.1              |
| C11 | NPM scripts as specified in Section 9                                                   | Section 9                |
| C12 | Supabase local dev ports: API 54341, DB 54342, Studio 54343, Inbucket 54344             | Section 6.1              |
| C13 | `tsc --noEmit` passes, `eslint .` passes, `vitest run` passes                           | Section 11               |

---

## 4. Epics

| Epic | Title                             | Refs                                      |
| ---- | --------------------------------- | ----------------------------------------- |
| E1   | Project Setup & Build Tooling     | C1, C2, C5, C6, C7, C8, C9, C10, C11, C13 |
| E2   | Design System & UI Primitives     | C3, C4, R6, R15, R16                      |
| E3   | Database Schema & Supabase Config | C12, R7, R8                               |
| E4   | Authentication                    | R1, R2, R3, R4, R5, R6, R14, R17, R18     |
| E5   | Multi-Tenancy Core                | R7, R8, R9, R10, R14                      |
| E6   | Org Management & Invitations      | R11, R12, R13                             |

---

## 5. Delivery Order & Critical Dependencies

```
D0 (Project Setup) → D1 (Design System & App Shell) → D2 (Database & Supabase)
                                                           ↓
                                                      D3 (Authentication)
                                                           ↓
                                                      D4 (Multi-Tenancy Core)
                                                           ↓
                                                      D5 (Org Settings & Invitations)
```

- **D0** is the foundation — nothing can start without it.
- **D1** depends on D0 (needs build tooling to render).
- **D2** depends on D0 (needs project config) and can run in parallel with D1 in theory, but D3 needs both D1 and D2.
- **D3** depends on D1 (layouts) + D2 (auth tables + Supabase client).
- **D4** depends on D3 (needs authenticated user to test org features).
- **D5** depends on D4 (needs org context, member tables, org switching).

---

## 6. Deliverables

---

### D0: Project Setup & Build Tooling

**Goal**: From empty repo to a running `npm run dev` with all tooling configured — Vite dev server shows a "Hello World" page at `localhost:3000`.

**In scope**: package.json, all dependencies, Vite config, TypeScript config, ESLint config, Prettier config, Husky + lint-staged, Vitest setup, index.html, main.tsx stub, test setup, npm scripts.

**Out of scope**: Design system, Supabase, authentication, any real UI.

**Refs**: C1, C2, C5, C6, C7, C8, C9, C10, C11, C13

**Acceptance criteria**:

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts Vite on port 3000, browser shows a page
- [ ] `npm run build` succeeds (tsc + vite build)
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] `npm run format` runs without error
- [ ] `npm run test` runs Vitest (at least one passing test)
- [ ] Path alias `@/*` resolves correctly
- [ ] ESLint enforces `consistent-type-imports`
- [ ] Husky pre-commit hook runs lint-staged

**Manual test steps**:

1. Run `npm install` — expect clean install, no peer dep errors that block install.
2. Run `npm run dev` — expect terminal shows Vite server on port 3000. Open browser to `http://localhost:3000` — see rendered page.
3. Run `npm run build` — expect `dist/` folder created with compiled assets.
4. Run `npm run typecheck` — expect exit code 0.
5. Run `npm run lint` — expect exit code 0.
6. Run `npm run test` — expect at least 1 test passes.
7. Create a file with a non-type import from a type-only export — run `npm run lint` — expect error about `consistent-type-imports`.
8. Commit a file with lint errors — expect husky/lint-staged to block the commit.

**Expected outcomes**: All commands exit cleanly. Dev server renders a page. Build produces optimized output with manual chunks.

**Artifacts produced**:

- `package.json`
- `index.html`
- `vite.config.ts`
- `tsconfig.json`
- `eslint.config.js`
- `.prettierrc`
- `.prettierignore`
- `.env.example`
- `src/main.tsx`
- `src/vite-env.d.ts`
- `src/app/App.tsx` (minimal stub)
- `src/lib/utils.ts` (`cn()` helper)
- `tests/setup.ts`

#### Tasks

**T-D0-01: Create package.json with all dependencies**

- Description: Create `package.json` with all production and dev dependencies from PRD Section 2, plus all npm scripts from Section 9.
- Dependencies: none
- Steps:
  1. Create `package.json` with name, version, type "module", scripts from Section 9
  2. List all production dependencies with exact version ranges from PRD
  3. List all dev dependencies with exact version ranges from PRD
  4. Run `npm install`
- DoD: `npm install` succeeds; all packages from PRD are in `node_modules`
- Acceptance checks: `npm ls --depth=0` shows all expected packages
- Expected files: `package.json`, `package-lock.json`

**T-D0-02: Configure TypeScript**

- Description: Create `tsconfig.json` with ES2022 target, strict mode, path alias `@/*`.
- Dependencies: T-D0-01
- Steps:
  1. Create `tsconfig.json` per Section 8.2
  2. Set strict mode with all extra checks
  3. Configure `@/*` path alias to `./src/*`
  4. Include `src` and `tests` directories
- DoD: `npx tsc --noEmit` passes (after stub files exist)
- Acceptance checks: `npm run typecheck` exit code 0
- Expected files: `tsconfig.json`

**T-D0-03: Configure Vite**

- Description: Create `vite.config.ts` with React SWC, Tailwind CSS, tsconfig paths, dev server port, manual chunks, test config.
- Dependencies: T-D0-01, T-D0-02
- Steps:
  1. Create `vite.config.ts` with plugins: react(), tailwindcss(), tsconfigPaths()
  2. Configure dev server: port 3000, auto-open
  3. Configure build: manual chunks per Section 8.1, 600KB warning limit
  4. Configure test: jsdom environment, single fork, 10s timeout, v8 coverage, setup file
- DoD: `npm run dev` starts; `npm run build` succeeds
- Acceptance checks: Vite starts on port 3000; build output includes chunked files
- Expected files: `vite.config.ts`

**T-D0-04: Configure ESLint (flat config)**

- Description: Create `eslint.config.js` with TypeScript, React, consistent-type-imports.
- Dependencies: T-D0-01
- Steps:
  1. Create flat ESLint config per Section 8.3
  2. Enable `consistent-type-imports: 'error'`
  3. Configure `no-unused-vars` with `^_` ignore pattern
  4. Configure `no-misused-promises`
  5. Set ignores: dist, node_modules, coverage, supabase/functions
- DoD: `npm run lint` passes on project files
- Acceptance checks: `npm run lint` exit code 0
- Expected files: `eslint.config.js`

**T-D0-05: Configure Prettier**

- Description: Create `.prettierrc` and `.prettierignore` with tailwind plugin.
- Dependencies: T-D0-01
- Steps:
  1. Create `.prettierrc` with standard config + `prettier-plugin-tailwindcss`
  2. Create `.prettierignore` (dist, node_modules, coverage, package-lock.json)
- DoD: `npm run format` runs without error
- Acceptance checks: `npx prettier --check .` passes
- Expected files: `.prettierrc`, `.prettierignore`

**T-D0-06: Configure Husky + lint-staged**

- Description: Set up git hooks for pre-commit linting.
- Dependencies: T-D0-04, T-D0-05
- Steps:
  1. Run `npx husky init`
  2. Configure pre-commit hook to run lint-staged
  3. Add lint-staged config to package.json (lint + format on staged files)
- DoD: Committing a file with lint errors is blocked by the hook
- Acceptance checks: `git commit` triggers lint-staged
- Expected files: `.husky/pre-commit`, lint-staged config in `package.json`

**T-D0-07: Create entry point files and minimal app stub**

- Description: Create `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/lib/utils.ts`.
- Dependencies: T-D0-02, T-D0-03
- Steps:
  1. Create `index.html` with root div and script tag for `/src/main.tsx`
  2. Create `src/vite-env.d.ts` with Vite client types
  3. Create `src/main.tsx` that renders App into root
  4. Create `src/app/App.tsx` as minimal component (renders "CoEngineers")
  5. Create `src/lib/utils.ts` with `cn()` helper using `clsx` + `tailwind-merge`
- DoD: `npm run dev` shows the app in the browser
- Acceptance checks: Browser at localhost:3000 renders content
- Expected files: `index.html`, `src/main.tsx`, `src/vite-env.d.ts`, `src/app/App.tsx`, `src/lib/utils.ts`

**T-D0-08: Create test setup and sample test**

- Description: Create `tests/setup.ts` and a sample unit test to verify Vitest works.
- Dependencies: T-D0-03, T-D0-07
- Steps:
  1. Create `tests/setup.ts` with `@testing-library/jest-dom` import
  2. Create a simple test (e.g., `tests/unit/utils.test.ts` testing `cn()`)
  3. Verify `npm run test` runs and passes
- DoD: `npm run test` shows at least 1 passing test
- Acceptance checks: `vitest run` exit code 0, 1+ test passes
- Expected files: `tests/setup.ts`, `tests/unit/utils.test.ts`

**T-D0-09: Create .env.example**

- Description: Create `.env.example` with Supabase and app config placeholders per Section 6.2.
- Dependencies: none
- Steps:
  1. Create `.env.example` with `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_NAME`, `VITE_APP_URL`
  2. Add `.env` to `.gitignore` if not already there
- DoD: File exists with correct variable names
- Acceptance checks: File contains all 4 env vars from Section 6.2
- Expected files: `.env.example`

---

### D1: Design System & App Shell — IMPLEMENTED

**Goal**: Implement the "Modern Fintech Minimalism" design system (tokens, fonts, utilities), core UI primitives (button, input, card, etc.), and the app shell (AppLayout with sidebar + header, AuthLayout). Navigating to `/` in the browser shows the dark-themed app shell with a collapsible sidebar.

**In scope**: CSS tokens, fonts, Tailwind @theme/@utility, shadcn-style UI components (only those needed for scaffolding), AppLayout, AuthLayout, Sidebar, Header, ErrorBoundary, LoadingSpinner, PageLoader, router setup with placeholder pages.

**Out of scope**: Authentication logic, Supabase integration, org data, protected routes (just the component shell).

**Refs**: C3, C4, R6, R15, R16, R17, R18

**Acceptance criteria**:

- [ ] Dark mode is default; light mode toggle works via next-themes
- [ ] Color tokens match PRD Section 5.1 / 5.2
- [ ] Satoshi Variable, Nunito, JetBrains Mono fonts render correctly
- [ ] `card-surface`, `shadow-soft`, `text-fintech-primary` utilities work
- [ ] AppLayout renders sidebar (collapsible) + header + content outlet
- [ ] AuthLayout renders centered card (no sidebar/header)
- [ ] Sidebar shows logo, placeholder nav items, collapse toggle
- [ ] Active nav item has orange indicator bar (#F7931A)
- [ ] Header shows page title
- [ ] All routes render correct layouts and placeholder pages
- [ ] 404 page renders for unknown routes
- [ ] Provider stack is wired correctly (ErrorBoundary > Query > Theme > Auth stub > Tooltip > Router + Toaster)
- [ ] `npm run build` and `npm run typecheck` still pass

**Manual test steps**:

1. Run `npm run dev`. Navigate to `http://localhost:3000` — expect dark-themed app shell with sidebar and header.
2. Click sidebar collapse toggle — sidebar shrinks to 64px with icon-only nav.
3. Click a nav item — active item shows orange indicator bar.
4. Toggle theme to light mode — colors switch per Section 5.2 tokens.
5. Navigate to `/login` — expect AuthLayout (no sidebar/header), centered card layout.
6. Navigate to `/signup` — same AuthLayout.
7. Navigate to `/nonexistent` — expect 404 page.
8. Resize browser to narrow width — layout should remain functional (not necessarily fully responsive, but not broken).
9. Inspect fonts in DevTools — headings use Satoshi, body uses Nunito, code uses JetBrains Mono.

**Expected outcomes**: Visually polished dark-themed shell with correct design tokens. All layouts render. Build passes.

**Artifacts produced**:

- `public/fonts/` (Satoshi, Nunito, JetBrains Mono font files)
- `src/styles/globals.css` (Tailwind imports, @theme, @utility, CSS vars)
- `src/styles/tokens.css` (color/shadow/radius tokens)
- `src/styles/fonts.css` (@font-face declarations)
- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/label.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/separator.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/skeleton.tsx`
- `src/components/ui/sonner.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/layout/AppLayout.tsx`
- `src/components/layout/AuthLayout.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/index.ts`
- `src/components/shared/ErrorBoundary.tsx`
- `src/components/shared/LoadingSpinner.tsx`
- `src/components/shared/PageLoader.tsx`
- `src/components/shared/ProtectedRoute.tsx` (shell only — logic in D3)
- `src/components/shared/index.ts`
- `src/lib/constants.ts`
- `src/providers/ThemeProvider.tsx`
- `src/providers/QueryProvider.tsx`
- `src/providers/index.ts`
- `src/app/App.tsx` (updated with provider stack)
- `src/app/router.tsx`
- `src/pages/LoginPage.tsx` (placeholder)
- `src/pages/SignupPage.tsx` (placeholder)
- `src/pages/DashboardPage.tsx` (placeholder)
- `src/pages/NotFoundPage.tsx`
- `src/pages/index.ts`
- `src/types/index.ts`
- `src/lib/queryClient.ts`

#### Tasks

**T-D1-01: Set up design tokens, fonts, and Tailwind theme**

- Description: Create CSS token files, @font-face declarations, Tailwind @theme and @utility definitions. Download/add font files.
- Dependencies: D0
- Steps:
  1. Add font files to `public/fonts/`
  2. Create `src/styles/fonts.css` with @font-face for Satoshi Variable, Nunito, JetBrains Mono
  3. Create `src/styles/tokens.css` with all CSS custom properties from Section 5 (dark default + light overrides)
  4. Update `src/styles/globals.css` with Tailwind imports, @theme mapping, @utility classes
- DoD: Tokens available as CSS vars; Tailwind utilities like `bg-primary`, `text-fintech-primary` work
- Acceptance checks: Dev tools show correct CSS var values; classes apply correct styles
- Expected files: `public/fonts/*`, `src/styles/fonts.css`, `src/styles/tokens.css`, `src/styles/globals.css`

**T-D1-02: Create core UI primitives (shadcn-style)**

- Description: Build all UI components listed in PRD Section 3 under `src/components/ui/`. Use Radix UI primitives, CVA, and the design tokens.
- Dependencies: T-D1-01
- Steps:
  1. Create each component file using Radix primitives + CVA + cn()
  2. Follow shadcn/ui patterns adapted for the fintech design system
  3. Ensure all components use the design tokens (not hardcoded colors)
  4. Create barrel exports
- DoD: All 17 UI components compile and render with correct styling
- Acceptance checks: `npm run typecheck` passes; components render in storybook-like test page
- Expected files: `src/components/ui/*.tsx`

**T-D1-03: Create constants and shared types**

- Description: Create `src/lib/constants.ts` with ROUTES, APP_NAME, SIDEBAR dimensions. Create `src/types/index.ts` with shared utility types.
- Dependencies: D0
- Steps:
  1. Define ROUTES object with all route paths
  2. Define SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH constants
  3. Define NavItem type, ApiResult type
  4. Export from `src/types/index.ts`
- DoD: Constants importable via `@/lib/constants`; types via `@/types`
- Acceptance checks: TypeScript resolves imports without error
- Expected files: `src/lib/constants.ts`, `src/types/index.ts`

**T-D1-04: Create QueryProvider and ThemeProvider**

- Description: Set up TanStack Query client with config from Section 6.4. Set up next-themes ThemeProvider with dark default.
- Dependencies: T-D1-01, T-D1-03
- Steps:
  1. Create `src/lib/queryClient.ts` with staleTime 5min, gcTime 30min, retry 1, no refetchOnWindowFocus
  2. Create `src/providers/QueryProvider.tsx` wrapping QueryClientProvider + ReactQueryDevtools
  3. Create `src/providers/ThemeProvider.tsx` wrapping next-themes with dark default
  4. Create `src/providers/index.ts` barrel
- DoD: Providers render without error; theme toggle switches dark/light
- Acceptance checks: React Query devtools appear; theme class toggles on html element
- Expected files: `src/lib/queryClient.ts`, `src/providers/QueryProvider.tsx`, `src/providers/ThemeProvider.tsx`, `src/providers/index.ts`

**T-D1-05: Create layout components (AppLayout, AuthLayout, Sidebar, Header)**

- Description: Build the app shell components. Sidebar is collapsible (64px/240px) with logo, nav items, active indicator. Header shows page title and user menu placeholder.
- Dependencies: T-D1-02, T-D1-03, T-D1-04
- Steps:
  1. Create `Sidebar.tsx` with collapse toggle, logo, nav items, active orange indicator
  2. Create `Header.tsx` with page title (from route), theme toggle, user menu placeholder
  3. Create `AppLayout.tsx` composing Sidebar + Header + Outlet
  4. Create `AuthLayout.tsx` with centered card, no sidebar/header
  5. Create `src/components/layout/index.ts` barrel
- DoD: Both layouts render correctly; sidebar collapses; header shows title
- Acceptance checks: Visual inspection at localhost:3000; sidebar toggle works
- Expected files: `src/components/layout/*.tsx`

**T-D1-06: Create shared components (ErrorBoundary, LoadingSpinner, PageLoader, ProtectedRoute stub)**

- Description: Build shared utility components.
- Dependencies: T-D1-02
- Steps:
  1. Create `ErrorBoundary.tsx` (React error boundary with fallback UI)
  2. Create `LoadingSpinner.tsx` (animated spinner with design tokens)
  3. Create `PageLoader.tsx` (full-page loading state using LoadingSpinner)
  4. Create `ProtectedRoute.tsx` (shell — passes children through for now; auth logic added in D3)
  5. Create `src/components/shared/index.ts` barrel
- DoD: Components render without error
- Acceptance checks: Wrap app in ErrorBoundary; spinner renders; PageLoader shows centered spinner
- Expected files: `src/components/shared/*.tsx`

**T-D1-07: Create router and placeholder pages**

- Description: Set up react-router-dom with all routes from FR-SHELL-003. Create placeholder page components.
- Dependencies: T-D1-05, T-D1-06
- Steps:
  1. Create placeholder pages: LoginPage, SignupPage, DashboardPage, NotFoundPage, OrgSettingsPage (lazy)
  2. Create `src/pages/index.ts` barrel
  3. Create `src/app/router.tsx` with route definitions per FR-SHELL-003
  4. `/` → redirect to `/app/dashboard`; `/login`, `/signup` → AuthLayout; `/app/*` → AppLayout; `*` → 404
- DoD: All routes render correct layouts and pages
- Acceptance checks: Navigate to each route — correct layout and content shown
- Expected files: `src/app/router.tsx`, `src/pages/*.tsx`

**T-D1-08: Wire up App.tsx with full provider stack**

- Description: Update App.tsx to compose the full provider stack per FR-SHELL-004: ErrorBoundary > QueryProvider > ThemeProvider > AuthProvider stub > TooltipProvider > Router + Toaster.
- Dependencies: T-D1-04, T-D1-07
- Steps:
  1. Update `src/app/App.tsx` with nested providers
  2. Add Sonner Toaster component
  3. Add Radix TooltipProvider
  4. AuthProvider will be a passthrough stub for now
  5. Update `src/main.tsx` if needed
- DoD: App renders with all providers; no console errors
- Acceptance checks: React Query devtools visible; toast notifications work; tooltips work
- Expected files: `src/app/App.tsx`, `src/main.tsx`

---

### D2: Database Schema & Supabase Configuration — IMPLEMENTED

**Goal**: Supabase local dev environment running with all 4 tables (profiles, organizations, organization_members, organization_invitations), helper functions, RLS policies, triggers, and seed data. `npm run db:types` generates TypeScript types.

**In scope**: Supabase config.toml, migrations (tables, types, functions, RLS, triggers), seed data, generated types, Supabase client initialization.

**Out of scope**: Frontend auth flows, org UI, invitation UI.

**Refs**: C12, R7, R8

**Acceptance criteria**:

- [x] `supabase start` launches local Supabase on configured ports
- [x] All 4 tables exist with correct columns and constraints
- [x] All enums created: `user_role`, `organization_role`, `invitation_status`
- [x] `handle_new_user()` trigger fires on signup and creates profile + workspace + membership
- [x] `user_organization_ids()` and `user_current_organization_id()` return correct values
- [x] `create_organization_with_membership()` RPC works
- [x] `validate_invitation_token()` and `accept_invitation()` RPCs work
- [x] RLS policies prevent cross-org data access
- [x] `npm run db:types` generates `src/lib/database.types.ts`
- [x] Supabase client initializes correctly with env vars
- [x] Seed user (test@example.com / password123) can sign up and auto-gets workspace
- [x] `npm run db:reset` re-creates everything cleanly

**Manual test steps**:

1. Run `npm run db:start` — expect Supabase containers start on ports 54341-54344.
2. Open Supabase Studio at `http://localhost:54343` — see all 4 tables in Table Editor.
3. Run `npm run db:reset` — expect clean database reset.
4. Sign up a user via Supabase Auth (Studio or curl) — check that `profiles`, `organizations`, `organization_members` rows are created automatically.
5. Query `user_organization_ids()` as that user — expect array with the workspace org ID.
6. Call `create_organization_with_membership('Test Org')` as that user — expect new org + owner membership.
7. Attempt to SELECT from `organizations` as a different user — expect 0 rows (RLS blocks).
8. Run `npm run db:types` — expect `src/lib/database.types.ts` generated without errors.
9. Edge case: Sign up with no `full_name` in metadata — trigger should use email prefix as name.

**Expected outcomes**: Fully functional local Supabase with complete schema, working triggers, and enforced RLS.

**Artifacts produced**:

- `supabase/config.toml`
- `supabase/migrations/00000000000000_initial_schema.sql`
- `supabase/seed.sql`
- `src/lib/supabase.ts`
- `src/lib/database.types.ts`
- `src/lib/queryKeys.ts`

#### Tasks

**T-D2-01: Create Supabase config.toml**

- Description: Configure local Supabase with ports from Section 6.1, auth settings (email confirmation disabled, signup enabled, JWT 3600s).
- Dependencies: D0
- Steps:
  1. Run `supabase init` if needed
  2. Edit `supabase/config.toml` with ports: API 54341, DB 54342, Studio 54343, Inbucket 54344
  3. Configure auth: disable email confirmations, enable signup, set site_url to http://127.0.0.1:3000
  4. Set JWT expiry to 3600s
- DoD: `supabase start` launches without errors on correct ports
- Acceptance checks: `supabase status` shows correct ports
- Expected files: `supabase/config.toml`

**T-D2-02: Create migration — tables, enums, constraints**

- Description: Write SQL migration for all 4 tables, 3 enums, FKs, unique constraints, indexes.
- Dependencies: T-D2-01
- Steps:
  1. Create enums: `user_role`, `organization_role`, `invitation_status`
  2. Create tables: `profiles`, `organizations`, `organization_members`, `organization_invitations`
  3. Add FK for `profiles.current_organization_id` → organizations
  4. Add unique constraint on `organization_members(organization_id, user_id)`
  5. Add unique partial index on `organization_invitations(organization_id, email) WHERE status = 'pending'`
  6. Enable RLS on all tables
- DoD: `supabase db reset` creates all tables; schema matches PRD Section 7
- Acceptance checks: `\dt` in psql shows all tables; `\d profiles` shows correct columns
- Expected files: `supabase/migrations/00000000000000_initial_schema.sql`

**T-D2-03: Create migration — helper functions and triggers**

- Description: Write all SQL functions: `user_organization_ids()`, `user_current_organization_id()`, `validate_invitation_token()`, `accept_invitation()`, `create_organization_with_membership()`, `handle_new_user()`, `update_updated_at()`. Create triggers.
- Dependencies: T-D2-02
- Steps:
  1. Create `user_organization_ids()` — SECURITY DEFINER, returns UUID[]
  2. Create `user_current_organization_id()` — SECURITY DEFINER, returns UUID
  3. Create `handle_new_user()` trigger function + trigger on auth.users INSERT
  4. Create `update_updated_at()` + apply to profiles and organizations
  5. Create `create_organization_with_membership()` RPC
  6. Create `validate_invitation_token()` RPC
  7. Create `accept_invitation()` RPC
- DoD: All functions exist; trigger fires on user signup
- Acceptance checks: Test trigger by inserting auth user; test RPCs via SQL
- Expected files: Same migration file or separate migration file

**T-D2-04: Create migration — RLS policies**

- Description: Write RLS policies for all 4 tables per PRD Section 7.
- Dependencies: T-D2-03
- Steps:
  1. profiles: SELECT own + co-workers, UPDATE own only
  2. organizations: SELECT by membership, INSERT by creator, UPDATE/DELETE by owner
  3. organization_members: SELECT by co-members, INSERT/UPDATE by owner, DELETE by owner or self
  4. organization_invitations: SELECT by owner or invitee, INSERT/UPDATE/DELETE by owner
- DoD: RLS prevents unauthorized access; authorized access works
- Acceptance checks: Test cross-org queries return 0 rows; same-org queries return correct data
- Expected files: Same or separate migration file

**T-D2-05: Create seed data**

- Description: Create seed.sql that creates a test user via Supabase Auth (which triggers auto-workspace creation).
- Dependencies: T-D2-03
- Steps:
  1. Create `supabase/seed.sql`
  2. Insert test user (test@example.com / password123) into auth.users
  3. The `handle_new_user` trigger will auto-create profile + workspace
- DoD: After `supabase db reset`, test user exists with workspace
- Acceptance checks: Query profiles and organizations — test user data exists
- Expected files: `supabase/seed.sql`

**T-D2-06: Create Supabase client and query key factory**

- Description: Create `src/lib/supabase.ts` with typed client initialization. Create `src/lib/queryKeys.ts` with query key factory.
- Dependencies: T-D2-02, D0
- Steps:
  1. Create `src/lib/supabase.ts` — createClient with auth config per Section 6.3
  2. Generate types: `npm run db:types`
  3. Create `src/lib/queryKeys.ts` with @lukemorales/query-key-factory for auth, organizations, members, invitations
- DoD: Supabase client initializes; types generated; query keys defined
- Acceptance checks: `import { supabase } from '@/lib/supabase'` compiles; types file exists
- Expected files: `src/lib/supabase.ts`, `src/lib/database.types.ts`, `src/lib/queryKeys.ts`

---

### D3: Authentication (Login, Signup, Session, Protected Routes) — IMPLEMENTED

**Goal**: Users can sign up, log in, persist sessions, and sign out. Protected routes enforce authentication. AuthProvider manages auth state and exposes user context. The login/signup forms use the design system and Zod 4 validation.

**In scope**: Login form, signup form, auth service, auth schemas (Zod 4), useAuth hook, AuthProvider (auth state only — org context in D4), ProtectedRoute logic, sign out, session persistence with 5s timeout.

**Out of scope**: Organization context in AuthProvider (D4), org switcher, member management, invitations.

**Refs**: R1, R2, R3, R4, R5, R6, R14 (auth portion), R17, R18

**Acceptance criteria**:

- [x] Signup form validates: valid email, 8+ chars, uppercase+lowercase+digit, password confirmation
- [x] Signup creates user → handle_new_user trigger fires → user lands on /app/dashboard
- [x] Login form validates: valid email, non-empty password
- [x] Login with correct credentials → redirect to /app/dashboard
- [x] Login with wrong credentials → inline error message
- [x] Page refresh → user stays logged in (no flash of login page)
- [x] 5-second safety timeout if auth check hangs → redirect to login
- [x] Sign out clears session + TanStack cache → redirect to /login
- [x] `/app/dashboard` redirects to `/login` when unauthenticated
- [x] `/login` redirects to `/app/dashboard` when authenticated
- [x] AuthProvider exposes `user`, `session`, `loading`, `signOut`
- [x] All forms styled per design system

**Manual test steps**:

1. Navigate to `/signup`. Submit empty form — expect validation errors displayed.
2. Enter email "bad", password "short" — expect specific validation errors (invalid email, 8+ chars, needs uppercase/lowercase/digit).
3. Enter valid email + password but mismatched confirmation — expect "passwords don't match" error.
4. Submit valid signup (e.g., `testuser@example.com`, `Password1`) — expect redirect to `/app/dashboard`.
5. Sign out (user menu) — expect redirect to `/login`.
6. Navigate to `/app/dashboard` while signed out — expect redirect to `/login`.
7. Log in with the account just created — expect redirect to `/app/dashboard`.
8. Log in with wrong password — expect inline error "Invalid login credentials" (or similar).
9. Refresh the page while logged in — expect to stay on `/app/dashboard` (no login page flash).
10. Close and reopen browser tab — expect session persists (auto-refresh working).
11. Navigate to `/login` while logged in — expect redirect to `/app/dashboard`.
12. Edge case: Submit login form rapidly multiple times — expect no duplicate requests or errors.

**Expected outcomes**: Full auth flow working end-to-end with polished forms and zero flash on refresh.

**Artifacts produced**:

- `src/features/auth/schemas/auth.schema.ts`
- `src/features/auth/services/authService.ts`
- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/components/LoginForm.tsx`
- `src/features/auth/components/SignupForm.tsx`
- `src/features/auth/components/index.ts`
- `src/features/auth/types/index.ts`
- `src/features/auth/index.ts`
- `src/providers/AuthProvider.tsx` (auth state only)
- `src/components/shared/ProtectedRoute.tsx` (updated with logic)
- `src/pages/LoginPage.tsx` (updated with LoginForm)
- `src/pages/SignupPage.tsx` (updated with SignupForm)

#### Tasks

**T-D3-01: Create auth Zod schemas**

- Description: Create Zod 4 validation schemas for login and signup forms.
- Dependencies: D0, D2
- Steps:
  1. Create login schema: `z.email()`, non-empty password
  2. Create signup schema: `z.email()`, password 8+ with uppercase/lowercase/digit, password confirmation match, optional full_name
  3. Use Zod 4 API (not v3) — `z.email()` instead of `z.string().email()`
- DoD: Schemas validate correctly for valid and invalid inputs
- Acceptance checks: Unit test schema validation
- Expected files: `src/features/auth/schemas/auth.schema.ts`

**T-D3-02: Create auth service**

- Description: Create Supabase auth service functions: signIn, signUp, signOut, getSession.
- Dependencies: T-D2-06
- Steps:
  1. Create `signInWithEmail(email, password)` — calls `supabase.auth.signInWithPassword`
  2. Create `signUpWithEmail(email, password, fullName?)` — calls `supabase.auth.signUp` with metadata
  3. Create `signOut()` — calls `supabase.auth.signOut`
  4. Create `getSession()` — calls `supabase.auth.getSession`
  5. Return typed results with error handling
- DoD: Service functions compile and call correct Supabase methods
- Acceptance checks: TypeScript compiles; functions are callable
- Expected files: `src/features/auth/services/authService.ts`

**T-D3-03: Create AuthProvider (auth state)**

- Description: Build AuthProvider with session management, auth state, loading state with 5s timeout, and sign-out handler. Org context is a stub for now (D4 will add it).
- Dependencies: T-D3-02, T-D1-04
- Steps:
  1. Create React context with `user`, `session`, `loading`, `signOut`
  2. On mount: check session synchronously via `supabase.auth.getSession()`
  3. Subscribe to `onAuthStateChange` for session updates
  4. Implement 5-second safety timeout to prevent infinite loading
  5. `signOut`: clear session, clear queryClient, redirect to /login
  6. Export `useAuth()` hook
- DoD: AuthProvider tracks session state; loading resolves within 5s; signOut works
- Acceptance checks: Auth state available via useAuth(); no login flash on refresh
- Expected files: `src/providers/AuthProvider.tsx`, `src/features/auth/hooks/useAuth.ts`

**T-D3-04: Create LoginForm and SignupForm components**

- Description: Build auth form components using react-hook-form + @hookform/resolvers + Zod 4 schemas + design system UI components.
- Dependencies: T-D3-01, T-D3-02, T-D1-02
- Steps:
  1. Create LoginForm with email + password fields, validation errors, submit handler
  2. Create SignupForm with email + full_name + password + confirm password, validation errors, submit handler
  3. Use react-hook-form with zodResolver
  4. Show inline errors from Zod validation
  5. Show server errors (e.g., "Invalid login credentials")
  6. Style with design system components (Input, Label, Button, Card)
  7. Create barrel exports
- DoD: Forms render, validate, and submit correctly
- Acceptance checks: Visual inspection; form submission works with Supabase
- Expected files: `src/features/auth/components/LoginForm.tsx`, `src/features/auth/components/SignupForm.tsx`, `src/features/auth/components/index.ts`, `src/features/auth/types/index.ts`, `src/features/auth/index.ts`

**T-D3-05: Implement ProtectedRoute and update routing**

- Description: Add auth check to ProtectedRoute. Update pages with real form components. Wire auth redirects.
- Dependencies: T-D3-03, T-D3-04, T-D1-07
- Steps:
  1. Update `ProtectedRoute.tsx`: check useAuth() — redirect to /login if unauthenticated, show PageLoader while loading
  2. Update LoginPage to render LoginForm inside AuthLayout
  3. Update SignupPage to render SignupForm inside AuthLayout
  4. Add redirect: auth pages redirect authenticated users to /app/dashboard
  5. Wrap `/app/*` routes with ProtectedRoute in router
- DoD: Unauthenticated users cannot access /app/\*; authenticated users are redirected from /login
- Acceptance checks: Manual navigation tests per acceptance criteria
- Expected files: `src/components/shared/ProtectedRoute.tsx`, `src/pages/LoginPage.tsx`, `src/pages/SignupPage.tsx`

**T-D3-06: Write auth feature tests**

- Description: Write tests for auth schemas, auth service (mocked), and ProtectedRoute behavior.
- Dependencies: T-D3-05
- Steps:
  1. Test login schema: valid input passes, invalid email fails, empty password fails
  2. Test signup schema: password requirements, confirmation match
  3. Test ProtectedRoute: renders children when authenticated, redirects when not
  4. Place tests in `tests/features/auth/`
- DoD: All tests pass via `vitest run`
- Acceptance checks: `npm run test` — auth tests pass
- Expected files: `tests/features/auth/*.test.ts`, `tests/features/auth/*.test.tsx`

---

### D4: Multi-Tenancy Core (Org Context, Switching, Creation) — IMPLEMENTED

**Goal**: AuthProvider manages organization context. Users see their organizations, can switch between them (cache clears), and can create new organizations. OrgSwitcher component in the sidebar is functional.

**In scope**: Organization service (CRUD + switch), org hooks (useOrganizations, useCurrentOrganization), AuthProvider extended with org context, OrgSwitcher component, CreateOrgDialog, query key integration with org_id.

**Out of scope**: Org settings page, member management, invitation system (D5).

**Refs**: R7, R8, R9, R10, R14

**Acceptance criteria**:

- [x] After login, AuthProvider loads user's organizations and sets currentOrganization
- [x] OrgSwitcher in sidebar lists all user organizations
- [x] Switching org updates `profiles.current_organization_id` via Supabase, clears queryClient
- [x] Create Org dialog creates org via `create_organization_with_membership` RPC
- [x] New org appears in OrgSwitcher immediately
- [x] Query keys include organization_id for cache isolation
- [x] Falls back to first available org if current is inaccessible
- [x] Switching org does not cause full page reload — only data refreshes

**Manual test steps**:

1. Log in with test user — expect OrgSwitcher in sidebar shows "test's Workspace" (or whatever was created).
2. Click "Create Organization" in OrgSwitcher — dialog opens.
3. Enter "Acme Corp" and submit — new org created, switched to it automatically.
4. OrgSwitcher now shows both "test's Workspace" and "Acme Corp".
5. Switch back to "test's Workspace" — expect data to refresh (check network tab — new queries fired).
6. Verify `profiles.current_organization_id` updates in Supabase Studio after switch.
7. Edge case: Delete the current org from Supabase Studio, refresh page — expect fallback to another org (no crash).
8. Edge case: Create org with special characters in name (e.g., "O'Brien & Co.") — expect slug auto-generated correctly.

**Expected outcomes**: Smooth org switching with no stale data. Create org flow works end-to-end.

**Artifacts produced**:

- `src/features/organizations/services/organizationService.ts`
- `src/features/organizations/hooks/useOrganizations.ts`
- `src/features/organizations/hooks/useCurrentOrganization.ts`
- `src/features/organizations/components/OrgSwitcher.tsx`
- `src/features/organizations/components/CreateOrgDialog.tsx`
- `src/features/organizations/schemas/index.ts`
- `src/features/organizations/types/index.ts`
- `src/features/organizations/index.ts`
- `src/providers/AuthProvider.tsx` (updated with org context)
- `src/components/layout/Sidebar.tsx` (updated with OrgSwitcher)

#### Tasks

**T-D4-01: Create organization service**

- Description: Build Supabase service functions for organization CRUD and switching.
- Dependencies: D2, D3
- Steps:
  1. `fetchUserOrganizations()` — query organizations via membership
  2. `createOrganization(name, slug?, logoUrl?)` — call `create_organization_with_membership` RPC
  3. `switchOrganization(orgId)` — update `profiles.current_organization_id`
  4. `fetchCurrentOrganizationId()` — get from profile
  5. Return typed results
- DoD: All service functions work against local Supabase
- Acceptance checks: Call functions from console; verify Supabase data changes
- Expected files: `src/features/organizations/services/organizationService.ts`

**T-D4-02: Create organization hooks**

- Description: Build TanStack Query hooks for organizations.
- Dependencies: T-D4-01
- Steps:
  1. `useOrganizations()` — query with org-scoped key
  2. `useCurrentOrganization()` — derive from orgs list + current ID
  3. `useCreateOrganization()` — mutation + invalidation
  4. `useSwitchOrganization()` — mutation + queryClient.clear()
- DoD: Hooks return correct data; mutations trigger re-fetches
- Acceptance checks: React devtools show query states
- Expected files: `src/features/organizations/hooks/*.ts`

**T-D4-03: Extend AuthProvider with organization context**

- Description: Add org state to AuthProvider: `currentOrganization`, `organizations[]`, `switchOrganization()`, `refreshOrganizations()`. Load orgs after auth, set fallback.
- Dependencies: T-D4-02, T-D3-03
- Steps:
  1. After auth resolves, fetch user organizations
  2. Set currentOrganization from profile's current_organization_id
  3. If current org not accessible, fall back to first org
  4. Expose `switchOrganization` (updates profile + clears cache)
  5. Expose `refreshOrganizations`
  6. Add `useCurrentOrganizationId()` convenience hook
- DoD: AuthProvider provides org context; switching works
- Acceptance checks: `useAuth()` returns org data after login
- Expected files: `src/providers/AuthProvider.tsx` (updated)

**T-D4-04: Create OrgSwitcher and CreateOrgDialog components**

- Description: Build the OrgSwitcher dropdown (lists orgs, allows switching) and CreateOrgDialog (form to create new org).
- Dependencies: T-D4-03, T-D1-02
- Steps:
  1. Create `OrgSwitcher.tsx` using DropdownMenu — shows current org, lists all orgs, "Create Organization" action
  2. Create `CreateOrgDialog.tsx` using Dialog — name input, Zod validation, submit calls createOrganization
  3. Create org schemas (name validation)
  4. Style with design system
  5. Create barrel exports
- DoD: OrgSwitcher shows in sidebar; create org dialog works; switching works
- Acceptance checks: Visual inspection; create + switch flows work
- Expected files: `src/features/organizations/components/OrgSwitcher.tsx`, `src/features/organizations/components/CreateOrgDialog.tsx`, `src/features/organizations/schemas/index.ts`, `src/features/organizations/types/index.ts`, `src/features/organizations/index.ts`

**T-D4-05: Integrate OrgSwitcher into Sidebar**

- Description: Add OrgSwitcher to the Sidebar component.
- Dependencies: T-D4-04
- Steps:
  1. Import and render OrgSwitcher in Sidebar (below logo, above nav)
  2. Handle collapsed state (show org avatar/initial only)
  3. Ensure layout is correct in both expanded and collapsed sidebar states
- DoD: OrgSwitcher visible and functional in sidebar
- Acceptance checks: Visual check in both sidebar states
- Expected files: `src/components/layout/Sidebar.tsx` (updated)

**T-D4-06: Write organization feature tests**

- Description: Test org service (mocked), org hooks, and org context behavior.
- Dependencies: T-D4-05
- Steps:
  1. Test createOrganization service with mocked Supabase
  2. Test useOrganizations hook returns org list
  3. Test org switching clears query cache
  4. Place in `tests/features/organizations/`
- DoD: Tests pass
- Acceptance checks: `npm run test` — org tests pass
- Expected files: `tests/features/organizations/*.test.ts`

---

### D5: Organization Settings, Member Management & Invitations — IMPLEMENTED

**Goal**: Owners can manage their organization: edit name/logo, view/manage members (change role, remove), send invitations, manage pending invitations (revoke), and delete the organization. Invited users can accept invitations via a shareable link. This is the final deliverable — after this, all PRD requirements are met.

**In scope**: OrgSettingsPage with tabs (General, Members, Invitations), MembersList, InviteMemberDialog, InvitationsList, InvitationAcceptPage, member hooks, invitation hooks, invitation service, org delete with confirmation.

**Out of scope**: Email notifications (Supabase handles email if configured), advanced RBAC beyond owner/member.

**Refs**: R11, R12, R13

**Acceptance criteria**:

- [x] `/app/org/settings` renders for owners (redirects members away)
- [x] General tab: edit org name, save updates org in DB
- [x] Members tab: lists members with role badges, owner can change roles, owner can remove members
- [x] Members tab: member can leave org (except last owner)
- [x] Invitations tab: lists pending invitations with expiry, owner can revoke
- [x] Invite dialog: enter email + role, sends invitation, toast confirmation
- [x] `/accept-invitation?token=...` page: validates token, shows org info, allows acceptance
- [x] Accepting invitation creates membership + redirects to dashboard
- [x] Invalid/expired token shows error message
- [x] Delete org: confirmation dialog (type org name), deletes org, switches to another org
- [x] All tables (members, invitations) styled with design system

**Manual test steps**:

1. Log in as org owner. Navigate to `/app/org/settings` — expect tabbed settings page.
2. General tab: Change org name → save → verify name updates in sidebar OrgSwitcher.
3. Members tab: See yourself listed as "Owner". No other members yet.
4. Click "Invite Member" → enter an email + role "member" → submit. Expect toast "Invitation sent".
5. Invitations tab: See the pending invitation listed with email, role, expiry date.
6. Copy the invitation link. Open in incognito browser.
7. Invitation accept page: See org name, inviter, role. If not logged in, see signup/login prompt.
8. Sign up as new user in incognito. Accept invitation → expect redirect to dashboard with the invited org active.
9. Back in original browser: Members tab now shows the new member.
10. Change new member's role to "Owner" → verify badge updates.
11. As new member (incognito): navigate to `/app/org/settings` — should now see settings (since now owner).
12. Revoke a pending invitation (Invitations tab) → verify it disappears from list.
13. Try to accept a revoked invitation link → expect error "Invitation is no longer valid".
14. Delete org: click Delete in General tab → confirmation dialog asks to type org name → type and confirm → org deleted, switched to personal workspace.
15. Edge case: Try to leave org as the last owner → expect error preventing it.
16. Edge case: Invite same email twice → expect error about existing pending invitation.
17. Edge case: Accept invitation with expired token (set expires_at in past via Supabase Studio) → expect error.

**Expected outcomes**: Full org management flow for owners. Invitation flow works for both new and existing users. All edge cases handled with appropriate error messages.

**Artifacts produced**:

- `src/features/organizations/services/organizationService.ts` (extended)
- `src/features/organizations/hooks/useOrganizationMembers.ts`
- `src/features/organizations/hooks/useInvitations.ts`
- `src/features/organizations/components/OrgSettingsView.tsx`
- `src/features/organizations/components/MembersList.tsx`
- `src/features/organizations/components/InviteMemberDialog.tsx`
- `src/features/organizations/components/InvitationsList.tsx`
- `src/features/organizations/components/InvitationAcceptPage.tsx`
- `src/pages/OrgSettingsPage.tsx` (updated)
- `src/pages/InvitationAcceptPage.tsx`
- `src/app/router.tsx` (updated with invitation route)

#### Tasks

**T-D5-01: Extend organization service with member and invitation functions**

- Description: Add service functions for member CRUD, invitation CRUD, and org update/delete.
- Dependencies: D4
- Steps:
  1. `updateOrganization(orgId, data)` — update name/logo
  2. `deleteOrganization(orgId)` — delete org
  3. `fetchMembers(orgId)` — query organization_members with profile joins
  4. `updateMemberRole(memberId, role)` — update role
  5. `removeMember(memberId)` — delete membership
  6. `leaveOrganization(orgId)` — self-leave (with last-owner check)
  7. `sendInvitation(orgId, email, role)` — insert into organization_invitations with generated token
  8. `fetchInvitations(orgId)` — query pending invitations
  9. `revokeInvitation(invitationId)` — update status to 'revoked'
  10. `validateInvitationToken(token)` — call `validate_invitation_token` RPC
  11. `acceptInvitation(token)` — call `accept_invitation` RPC
- DoD: All functions work against local Supabase
- Acceptance checks: Test each function via integration test or manual SQL verification
- Expected files: `src/features/organizations/services/organizationService.ts` (extended)

**T-D5-02: Create member and invitation hooks**

- Description: Build TanStack Query hooks for members and invitations.
- Dependencies: T-D5-01
- Steps:
  1. `useOrganizationMembers(orgId)` — query with org-scoped key
  2. `useUpdateMemberRole()` — mutation + invalidation
  3. `useRemoveMember()` — mutation + invalidation
  4. `useLeaveOrganization()` — mutation
  5. `useInvitations(orgId)` — query
  6. `useSendInvitation()` — mutation + invalidation
  7. `useRevokeInvitation()` — mutation + invalidation
  8. `useValidateInvitation(token)` — query (for accept page)
  9. `useAcceptInvitation()` — mutation
- DoD: Hooks return correct data; mutations trigger re-fetches
- Acceptance checks: React devtools show query states
- Expected files: `src/features/organizations/hooks/useOrganizationMembers.ts`, `src/features/organizations/hooks/useInvitations.ts`

**T-D5-03: Create OrgSettingsView with tabs**

- Description: Build the settings view with General, Members, and Invitations tabs.
- Dependencies: T-D5-02, T-D1-02
- Steps:
  1. Create `OrgSettingsView.tsx` with Tabs component
  2. General tab: org name input, save button, delete org button
  3. Members tab: renders MembersList + InviteMemberDialog trigger
  4. Invitations tab: renders InvitationsList
  5. Owner check: redirect non-owners or show read-only view
  6. Update `OrgSettingsPage.tsx` to render OrgSettingsView
- DoD: Settings page renders with all tabs functional
- Acceptance checks: Navigate to /app/org/settings; tabs switch; forms submit
- Expected files: `src/features/organizations/components/OrgSettingsView.tsx`, `src/pages/OrgSettingsPage.tsx`

**T-D5-04: Create MembersList and InviteMemberDialog**

- Description: Build member management components.
- Dependencies: T-D5-02, T-D1-02
- Steps:
  1. `MembersList.tsx`: table with avatar, name, email, role badge, actions (change role, remove). Role change uses Select; remove uses AlertDialog confirmation
  2. `InviteMemberDialog.tsx`: Dialog with email input + role select + submit. Validates email format. Shows error for duplicate pending invitations
  3. Handle last-owner constraint (disable remove/role-change if last owner)
  4. Toast notifications for success/error
- DoD: Members listed; role change works; remove works; invite works
- Acceptance checks: Visual inspection + functional testing per acceptance criteria
- Expected files: `src/features/organizations/components/MembersList.tsx`, `src/features/organizations/components/InviteMemberDialog.tsx`

**T-D5-05: Create InvitationsList component**

- Description: Build the invitations management component.
- Dependencies: T-D5-02, T-D1-02
- Steps:
  1. `InvitationsList.tsx`: table with email, role, status badge, expiry date, copy link button, revoke button
  2. Copy invitation link to clipboard with toast confirmation
  3. Revoke with confirmation
  4. Show empty state if no pending invitations
- DoD: Invitations listed with actions; revoke works; copy link works
- Acceptance checks: See invitation list; copy link; revoke invitation
- Expected files: `src/features/organizations/components/InvitationsList.tsx`

**T-D5-06: Create InvitationAcceptPage**

- Description: Build the public invitation acceptance page at `/accept-invitation`.
- Dependencies: T-D5-01, T-D5-02
- Steps:
  1. Create `InvitationAcceptPage.tsx` component: reads `token` from URL query params
  2. Calls `validate_invitation_token` — shows org name, inviter, role
  3. If not authenticated: show login/signup links, then redirect back after auth
  4. If authenticated: show "Accept Invitation" button
  5. On accept: calls `accept_invitation` RPC → redirect to dashboard
  6. Handle errors: invalid token, expired, already accepted, revoked
  7. Create page at `src/pages/InvitationAcceptPage.tsx`
  8. Add route to `src/app/router.tsx`
- DoD: Invitation acceptance flow works for logged-in and new users
- Acceptance checks: Click invitation link → validate → accept → member added
- Expected files: `src/features/organizations/components/InvitationAcceptPage.tsx`, `src/pages/InvitationAcceptPage.tsx`, `src/app/router.tsx` (updated)

**T-D5-07: Implement org deletion with confirmation**

- Description: Add delete organization functionality with type-to-confirm dialog.
- Dependencies: T-D5-03
- Steps:
  1. In General tab: "Delete Organization" button (destructive styling)
  2. Opens AlertDialog: user must type org name to confirm
  3. On confirm: delete org → switch to another org (personal workspace) → redirect to dashboard
  4. Toast notification for success
  5. Prevent deletion of last org (should always have personal workspace)
- DoD: Delete flow works; user switched to fallback org
- Acceptance checks: Delete org → switched to another org; deleted org no longer in OrgSwitcher
- Expected files: Updates to `OrgSettingsView.tsx`

**T-D5-08: Write org settings and invitation tests**

- Description: Test member management, invitation flow, and org settings.
- Dependencies: T-D5-06, T-D5-07
- Steps:
  1. Test invitation validation (valid, expired, revoked tokens)
  2. Test member role change constraints
  3. Test last-owner prevention
  4. Test org deletion flow
  5. Place in `tests/features/organizations/`
- DoD: Tests pass
- Acceptance checks: `npm run test` — all org tests pass
- Expected files: `tests/features/organizations/*.test.ts`

---

## 7. Requirement Coverage Matrix

| Req | D0  | D1  | D2  | D3  | D4  | D5  |
| --- | --- | --- | --- | --- | --- | --- |
| R1  |     |     |     | x   |     |     |
| R2  |     |     |     | x   |     |     |
| R3  |     |     |     | x   |     |     |
| R4  |     |     |     | x   |     |     |
| R5  |     |     |     | x   |     |     |
| R6  |     | x   |     | x   |     |     |
| R7  |     |     | x   |     | x   |     |
| R8  |     |     | x   |     | x   |     |
| R9  |     |     |     |     | x   |     |
| R10 |     |     |     |     | x   |     |
| R11 |     |     |     |     |     | x   |
| R12 |     |     |     |     |     | x   |
| R13 |     |     |     |     |     | x   |
| R14 |     |     |     | x   | x   |     |
| R15 |     | x   |     |     |     |     |
| R16 |     | x   |     |     |     |     |
| R17 |     | x   |     | x   |     |     |
| R18 |     | x   |     | x   |     |     |
| C1  | x   |     |     |     |     |     |
| C2  | x   |     |     | x   |     |     |
| C3  |     | x   |     |     |     |     |
| C4  |     | x   |     |     |     |     |
| C5  | x   |     |     |     |     |     |
| C6  | x   |     |     |     |     |     |
| C7  | x   |     |     |     |     |     |
| C8  | x   |     |     |     |     |     |
| C9  | x   |     |     |     |     |     |
| C10 | x   |     |     |     |     |     |
| C11 | x   |     |     |     |     |     |
| C12 |     |     | x   |     |     |     |
| C13 | x   |     |     |     |     |     |
