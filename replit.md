# Replit.md

## Overview

This is **Aestimamus Executive Diagnostics Suite** — a multi-tenant web platform for hosting executive assessment center exercises. The app is designed as a subpage of aestimamus.com, featuring two-layer password protection (global portal access + per-customer access) and a customer-organized structure for assessment materials.

Currently configured customers: REWE Group, R+V Versicherung, Materna SE. The REWE Group section includes the Varexia SE case study (fully implemented) and a placeholder for behavioral simulations.

The app is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for persistence via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle)
Brand alignment: aestimamus.com aesthetic — pure white backgrounds, near-black text (#1a1a1a), copper/terracotta accent (hsl(14, 48%, 44%)), Playfair Display + Inter fonts
Default passwords: "Christoph" for all access (global + all customers), admin: "aestimamus-admin-2026"

## Recent Changes

- Added EN/DE language toggle (dictionary-based i18n in `client/src/lib/i18n.ts`)
- Added exercise countdown timer (90 min) and session elapsed timer in case study header
- Added progress indicator tracking visited sections with percentage
- Added briefing confirmation gate before assessment access
- Added mobile-responsive sidebar (collapsible drawer for small screens)
- Added admin dashboard at `/admin` with responses viewer, session tracker, access code management, exercise upload, CSV export
- Added per-participant access codes with name/email tracking
- Added uploaded exercises support (admin creates, shown in customer portal)
- Added assessment_sessions and uploaded_exercises DB tables
- Added print stylesheet for PDF export
- Added loading animations between case study sections (Framer Motion)

## System Architecture

### Access Control Flow
1. **Landing page** (`/`) — Global password gate (German, aestimamus.com style)
2. **Customer portal** (`/portal`) — Customer selection (REWE, R&V, Materna) after global auth
3. **Customer exercises** (`/portal/:customerId`) — Per-customer password gate, then exercise listing
4. **Case study** (`/case/:id/*`) — Full assessment environment with sidebar navigation
5. **Admin dashboard** (`/admin`) — Admin login (separate password), manage responses/codes/exercises

Auth state stored in `sessionStorage` (global_auth + per-customer flags + admin_auth). Passwords verified server-side via bcrypt-hashed codes in `access_codes` table.

Default access codes (seeded on first run):
- Global: `Christoph`
- REWE: `Christoph`
- R+V: `Christoph`
- Materna: `Christoph`
- Admin: `aestimamus-admin-2026`

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
  - `/` — Landing page with global password
  - `/portal` — Customer selection
  - `/portal/:customerId` — Customer-specific exercises page
  - `/case/:id/*` — Case study pages with sidebar layout
  - `/admin` — Admin dashboard
- **State/Data fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Charts**: Recharts for financial data visualization
- **Animations**: Framer Motion for page transitions and element animations
- **i18n**: Simple dictionary-based system in `client/src/lib/i18n.ts`, persisted to localStorage
- **Fonts**: Playfair Display (serif headers) + Inter (body/data text) loaded from Google Fonts
- **Structure**: Pages in `client/src/pages/`, reusable UI in `client/src/components/ui/`, layout with sidebar navigation in `client/src/components/layout.tsx`
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `POST /api/auth/verify` — verify access codes (global or customer-specific)
  - `POST /api/auth/admin` — verify admin password
  - `GET /api/assessments/:caseId/:sessionId` — fetch saved assessment responses
  - `POST /api/assessments/save` — upsert a single assessment response
  - `POST /api/assessments/save-all` — bulk upsert assessment responses
  - `POST /api/sessions` — create/get assessment session
  - `GET /api/sessions/:sessionId/:caseId` — fetch session
  - `PATCH /api/sessions/:id` — update session
  - `GET /api/exercises/:customerId` — fetch uploaded exercises for customer
  - `GET /api/admin/responses` — all responses (admin)
  - `GET /api/admin/sessions` — all sessions (admin)
  - `GET/POST/DELETE /api/admin/access-codes` — manage access codes (admin)
  - `GET/POST/DELETE /api/admin/exercises` — manage exercises (admin)
- **Validation**: Zod schemas (generated from Drizzle schemas via drizzle-zod)
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation
- **Dev Server**: Vite dev server middleware is integrated into Express for HMR during development
- **Production**: Client is built to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver using a `pg.Pool`
- **Schema Location**: `shared/schema.ts` — shared between frontend and backend
- **Tables**:
  - `users` — id (UUID), username (unique), password
  - `assessment_responses` — id (UUID), caseId, sessionId, phase, questionIndex, question, answer, updatedAt
  - `access_codes` — id (UUID), scope (global/customer), customerId, codeHash, label, participantName, participantEmail
  - `assessment_sessions` — id (UUID), sessionId, customerId, caseId, participantName, startedAt, completedAt, briefingConfirmed, status
  - `uploaded_exercises` — id (UUID), customerId, title, description, type, fileName, fileData, status, createdAt
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, output to `./migrations/`. Use `npm run db:push` to push schema changes directly.

### Data Model
- Case study data (Varexia SE business units, financials, emails, assessment questions) is currently hardcoded in `client/src/lib/data.ts` — not stored in the database
- Only assessment responses (user answers), access codes, sessions, and uploaded exercises are persisted to PostgreSQL
- Session identification uses `localStorage` with a UUID (`aestimamus_session_id`)
- Auth state uses `sessionStorage` (resets on browser close)
- Timer state uses `sessionStorage` (exercise start time, visited sections)
- Language preference uses `localStorage` (persists between sessions)

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
- **bcryptjs**: Password hashing for access codes
- **@tanstack/react-query**: Server state management on the frontend
- **recharts**: Charting library for financial visualizations
- **framer-motion**: Animation library
- **wouter**: Lightweight React router
- **zod**: Runtime schema validation
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, clsx, tailwind-merge

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)
- Custom `vite-plugin-meta-images`: Updates OpenGraph meta tags with Replit deployment URLs
