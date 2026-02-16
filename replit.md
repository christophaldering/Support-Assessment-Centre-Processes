# Replit.md

## Overview

This is the **Executive Diagnostics Platform** — an enterprise-grade, multi-tenant SaaS platform for hosting executive assessment centers. Originally developed as the "Aestimamus Executive Diagnostics Suite," it has evolved into a full blueprint architecture supporting 6 role-based portals (Admin, Moderator, Observer, Project Assistant, HR Client, Candidate), workspace theming, competency-based assessment, AI-ready infrastructure, and audit/compliance features.

The platform serves as both a neutral SaaS product and houses the "aestimamus" workspace with the Varexia SE case study. Design follows a dual approach: the neutral platform uses dark navy (#0f172a) with blue accents (#3b82f6), while the aestimamus workspace maintains copper/terracotta (hsl(14, 48%, 44%)) with Playfair Display + Inter fonts.

The app is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for persistence via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: copper/terracotta (hsl(14, 48%, 44%)), Playfair Display + Inter, pure white backgrounds
Default passwords: "Christoph" for all access (master admin, workspace admin, all platform users)
Footer credit: "© Christoph Aldering · Private initiative / concept"

## Recent Changes

- Implemented enterprise blueprint architecture with 15+ new database tables
- Added multi-tenant workspace system with per-workspace theming
- Built neutral platform landing page at `/` (dark navy, feature showcase, master admin gate)
- Added platform user authentication (email/password with forced password change on first login)
- Created workspace selector at `/workspaces` for master admin workspace management
- Built candidate portal at `/candidate` with assessment dashboard
- Created workspace dashboard at `/workspace/:slug` with dynamic theme application
- Seeded aestimamus workspace with Varexia SE exercise, 6-dimension competency model, default users
- Extended storage layer with 40+ CRUD methods for all new tables
- Added audit logging and consent management framework (tables and API)
- Preserved backward compatibility with legacy access code system

### Legacy Features (still functional)
- Applysia-inspired features: competency-based scoring, observer view, self-assessment, timed releases, radar charts, PDF reports
- Observer live view at `/observer` with real-time candidate progress polling
- Admin dashboard at `/admin` with 7 tabs
- Exercise countdown timer, progress indicator, briefing confirmation gate
- Per-participant access codes with name/email tracking
- EN/DE language toggle (dictionary-based i18n)

## System Architecture

### Access Control (Dual System)

#### New Blueprint Auth Flow
1. **Platform landing** (`/`) — Neutral SaaS landing page with master admin gate + candidate login link
2. **Platform login** (`/login`) — Email/password login for all platform users (role-based redirect)
3. **Workspace selector** (`/workspaces`) — Master admin selects and authenticates to workspaces
4. **Workspace dashboard** (`/workspace/:slug`) — Themed workspace view for admin/moderator/HR
5. **Candidate portal** (`/candidate`) — Assessment dashboard for candidates

Role-based redirects after login:
- ADMIN/MODERATOR/HR_CLIENT → `/workspace/{slug}`
- OBSERVER → `/observer`
- CANDIDATE → `/candidate`

Default platform users (all passwords: "Christoph"):
- admin@aestimamus.de (ADMIN) - Christoph Aldering
- moderator@aestimamus.de (MODERATOR) - Max Moderator
- observer@aestimamus.de (OBSERVER) - Lisa Observer
- candidate@aestimamus.de (CANDIDATE) - Thomas Kandidat
- hr@aestimamus.de (HR_CLIENT) - Sarah HR-Partnerin

#### Legacy Auth Flow (backward compatible)
1. **Legacy landing** (`/legacy` or via `/portal`) — Global password gate (aestimamus-branded)
2. **Customer portal** (`/portal`) — Customer selection (REWE, R&V, Materna)
3. **Customer exercises** (`/portal/:customerId`) — Per-customer password gate
4. **Case study** (`/case/:id/*`) — Full assessment environment
5. **Admin dashboard** (`/admin`) — Admin login (access code)
6. **Observer view** (`/observer`) — Observer login

### Competency Framework
Defined in both `client/src/lib/data.ts` (frontend) and `competency_nodes` table (database) with 6 dimensions:
- Strategic Thinking, Financial Acumen, Stakeholder Management, Decision Quality, Communication & Presence, Leadership Impact
- Each dimension has 5 behavioral anchors (Likert 1-5 scale)
- Used by: observer rating controls, self-assessment tab, radar charts, PDF reports, new blueprint rating system

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
  - `/` — Platform landing page (neutral, dark navy)
  - `/login` — Platform user login (email/password)
  - `/workspaces` — Workspace selector (master admin)
  - `/workspace/:slug` — Workspace dashboard (themed)
  - `/candidate` — Candidate portal
  - `/portal` — Legacy customer selection
  - `/portal/:customerId` — Legacy customer exercises page
  - `/case/:id/*` — Case study pages with sidebar layout
  - `/admin` — Legacy admin dashboard (7 tabs)
  - `/observer` — Observer live view with competency ratings
- **State/Data fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Charts**: Recharts for financial data visualization and radar/spider competency charts
- **Animations**: Framer Motion for page transitions and element animations
- **i18n**: Simple dictionary-based system in `client/src/lib/i18n.ts`, persisted to localStorage
- **Fonts**: Playfair Display (serif headers) + Inter (body/data text) loaded from Google Fonts
- **Structure**: Pages in `client/src/pages/`, reusable UI in `client/src/components/ui/`
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev)
- **API Pattern**: RESTful JSON API under `/api/` prefix

#### New Platform API (`/api/platform/`):
  - `POST /api/platform/auth/master` — master admin password check
  - `POST /api/platform/auth/workspace` — workspace admin login (bcrypt)
  - `POST /api/platform/auth/login` — platform user login (email/password, bcrypt)
  - `POST /api/platform/auth/change-password` — forced password change
  - `GET /api/platform/workspaces` — list all workspaces
  - `GET /api/platform/workspaces/:slug` — get workspace by slug
  - `GET /api/platform/workspaces/:workspaceId/users` — workspace users
  - `GET /api/platform/assessments/:workspaceId` — workspace assessments
  - `GET /api/platform/assessment/:assessmentId` — assessment details with exercises/candidates/observers
  - `GET /api/platform/competency-model/:modelId` — model with nodes
  - `GET /api/platform/candidate/:userId/assessments` — candidate's assessments
  - `POST /api/platform/audit` — create audit log entry
  - `GET /api/platform/audit/:workspaceId` — read audit logs

#### Legacy API (preserved):
  - `POST /api/auth/verify` — verify access codes
  - `POST /api/auth/admin` — verify admin password
  - All assessment, session, observer, self-assessment, timed-release, admin endpoints

- **Storage Layer**: `server/storage.ts` defines `IStorage` interface with 60+ methods in `DatabaseStorage`
- **Seed Data**: Auto-seeds access codes + aestimamus workspace with users, competency model, assessment, exercise

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver using a `pg.Pool`
- **Schema Location**: `shared/schema.ts` — shared between frontend and backend

#### Legacy Tables:
  - `users`, `assessment_responses`, `access_codes`, `assessment_sessions`
  - `uploaded_exercises`, `observer_ratings`, `self_assessments`
  - `timed_releases`, `observer_sessions`

#### New Blueprint Tables:
  - `workspaces` — multi-tenant workspace with theme, data residency, admin password
  - `platform_users` — users with email/password auth, roles array, workspace binding
  - `competency_models` — versioned competency models per workspace
  - `competency_nodes` — hierarchical competency dimensions with behavioral anchors
  - `scale_definitions` — configurable rating scales (Likert, etc.)
  - `assessments` — assessment events with date range, status, competency model link
  - `exercises` — exercises within assessments (case study, simulation, etc.)
  - `candidate_profiles` — candidates linked to assessments with status
  - `observer_assignments` — observer-to-assessment mappings with candidate lists
  - `exercise_competency_mappings` — which competencies each exercise measures
  - `ratings` — versioned competency ratings by observer for candidate per exercise
  - `audit_logs` — append-only audit trail per workspace
  - `consent_templates` — GDPR consent templates per workspace
  - `consent_records` — individual consent records per user

- **Migrations**: Use `npm run db:push` to push schema changes directly.

### Data Model
- Case study data (Varexia SE) is hardcoded in `client/src/lib/data.ts`
- Competency framework is defined in both frontend (`data.ts`) and database (`competency_nodes`)
- Assessment responses, sessions, ratings are persisted to PostgreSQL
- Session identification: `localStorage` UUID (`aestimamus_session_id`) for legacy, `platform_user` sessionStorage for new system
- Auth state: `sessionStorage` for both legacy and new systems

### Build & Development
- `npm run dev` — starts the full-stack dev server (Express + Vite HMR) on port 5000
- `npm run build` — builds client with Vite and server with esbuild into `dist/`
- `npm run start` — runs the production build
- `npm run db:push` — pushes Drizzle schema to PostgreSQL

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection string must be provided via `DATABASE_URL` environment variable.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: ORM, migration tooling, and schema-to-Zod validation
- **pg**: PostgreSQL client driver
- **express**: HTTP server framework (v5)
- **bcryptjs**: Password hashing for access codes and platform users
- **@tanstack/react-query**: Server state management on the frontend
- **recharts**: Charting library for financial visualizations and radar charts
- **framer-motion**: Animation library
- **wouter**: Lightweight React router
- **zod**: Runtime schema validation
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, clsx, tailwind-merge
