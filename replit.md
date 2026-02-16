# Executive Diagnostics Platform

## Overview

Enterprise-grade, multi-tenant SaaS platform for hosting executive assessment centers. Currently in **Phase 2 — RBAC, Users, Invitations, Candidate Accounts**.

Tech stack: Next.js 14 (App Router) + TypeScript (strict) + Prisma + PostgreSQL + Tailwind CSS.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle planned)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: copper/terracotta (hsl(14, 48%, 44%)), Playfair Display + Inter, pure white backgrounds
Default passwords: "Christoph" for all access
Footer credit: "© Christoph Aldering · Private initiative / concept"

## Project Structure

```
/app                          → Next.js App Router
  page.tsx                    → Neutral landing page with feature overview
  layout.tsx                  → Root layout with metadata
  globals.css                 → Tailwind + design baseline + Google Fonts
  /admin/login/page.tsx       → Master admin password gate
  /admin/workspaces/page.tsx  → Workspace selector (loads from DB)
  /admin/workspaces/layout.tsx → Server-side master auth guard
  /w/[workspaceSlug]/
    admin/page.tsx            → Workspace admin dashboard (themed)
    admin/users/page.tsx      → User management (create, roles, CSV placeholder)
    admin/users/layout.tsx    → Server-side RBAC guard (users.read)
    login/page.tsx            → User login (email + password)
    change-password/page.tsx  → Forced password change (candidates)
    assessment/page.tsx       → Candidate assessment portal
    reset-password/page.tsx   → Password reset request form
  /api/health/route.ts        → Health check endpoint
  /api/auth/master/route.ts   → Master admin password verification
  /api/auth/workspace/route.ts → Workspace admin password verification
  /api/auth/login/route.ts    → User login (email + password + workspace)
  /api/auth/logout/route.ts   → Logout (clears all session cookies)
  /api/auth/me/route.ts       → Current user info
  /api/auth/change-password/route.ts → Change password (supports forced change)
  /api/auth/reset-request/route.ts   → Password reset token creation
  /api/auth/reset-confirm/route.ts   → Password reset confirmation
  /api/workspaces/route.ts    → List workspaces (master-auth protected)
  /api/w/[workspaceSlug]/
    users/route.ts            → List + create users (RBAC protected)
    users/[userId]/route.ts   → Update + deactivate users (RBAC protected)
    assessments/route.ts      → List assessments (RBAC protected)
/components                   → Reusable React components (empty, ready)
/lib                          → Shared utilities & modules
  db.ts                       → Prisma client singleton
  session.ts                  → Cookie-based auth helpers (master + workspace + user)
  rbac.ts                     → Role-based access control (6 roles, permissions map)
  auth.ts                     → Authentication (stub)
  consent.ts                  → GDPR consent management (stub)
  audit.ts                    → Audit logging (stub)
  ai.ts                       → AI integration helpers (stub)
/prisma
  schema.prisma               → Prisma schema (Workspace, Theme, User, Assessment, PasswordResetToken, HealthCheck)
  seed.ts                     → Seeds aestimamus workspace + admin user + sample assessment
```

## Roles & Permissions

| Role               | Key Permissions                                           |
| ------------------- | --------------------------------------------------------- |
| ADMIN              | Full access: workspace, users, assessments, reports, theme |
| MODERATOR          | Assessments CRUD, candidates, reports, read users          |
| OBSERVER           | Read assessments, candidates, reports                      |
| PROJECT_ASSISTANT  | Assessments read/update, candidates CRUD, read users       |
| HR_CLIENT          | Read assessments, candidates, reports                      |
| CANDIDATE          | Own assessment only                                        |

## Access Control Flow

1. **Landing page** (`/`) — Neutral platform landing, "Administrator Access" button
2. **Master admin gate** (`/admin/login`) — Single password (env var `MASTER_ADMIN_PASSWORD_HASH`, bcrypt)
3. **Workspace selector** (`/admin/workspaces`) — Lists workspaces from DB, protected by master auth cookie
4. **Workspace admin password** — Per-workspace password (bcrypt hash stored on Workspace model)
5. **Workspace dashboard** (`/w/{slug}/admin`) — Themed admin dashboard (master auth OR workspace auth OR user session with internal role)
6. **User login** (`/w/{slug}/login`) — Email + password, workspace-scoped
7. **Candidate flow** — Login → forced password change → assessment portal
8. **User management** (`/w/{slug}/admin/users`) — RBAC protected (requires `users.read` permission)

All default passwords: "Christoph"
Seeded admin user: admin@aestimamus.de

## System Architecture

- **Framework**: Next.js 14 App Router + TypeScript (strict mode)
- **ORM**: Prisma with PostgreSQL
- **Styling**: Tailwind CSS v3 with custom design tokens
- **Auth**: HTTP-only cookies with 4-hour expiry
  - `edp_master_auth` — master admin session
  - `edp_workspace_auth` — workspace admin session
  - `edp_user_session` — user session (JSON: userId, workspaceSlug, roles)
- **Password hashing**: bcryptjs
- **RBAC**: Role-to-permissions map, union of permissions across roles
- **Linting**: ESLint (next/core-web-vitals) + Prettier
- **Port**: 5000 (bound to 0.0.0.0)

## Database

- **Provider**: PostgreSQL (via DATABASE_URL env var)
- **Tables**: `health_check`, `workspaces`, `themes`, `users`, `assessments`, `password_reset_tokens`
- **Seeded data**: aestimamus workspace with copper theme, admin user, sample assessment
- **Schema management**: `npx prisma db push` for development

## Environment Variables

| Variable                      | Description                              |
| ----------------------------- | ---------------------------------------- |
| `DATABASE_URL`                | PostgreSQL connection string (required)  |
| `MASTER_ADMIN_PASSWORD_HASH`  | bcrypt hash of master admin password     |

## Build & Development

- `npm run dev` — Start dev server on port 5000
- `npm run build` — Production build
- `npm run start` — Start production server
- `npm run lint` — ESLint check
- `npm run format` — Prettier format
- `npm run db:push` — Push schema to database
- `npm run db:generate` — Regenerate Prisma client
- `npm run db:seed` — Run seed script

## Design System Baseline

- **Primary**: Dark navy `#0f172a`
- **Accent**: Blue `#3b82f6`
- **Fonts**: Inter (body, sans-serif) + Playfair Display (headings, serif)
- **Backgrounds**: White with subtle slate borders
- **Workspace theming**: Per-workspace colors applied via inline styles on `/w/{slug}/admin`

## External Dependencies

- **PostgreSQL**: Required. Connection via `DATABASE_URL` environment variable.
