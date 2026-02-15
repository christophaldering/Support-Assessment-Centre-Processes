# Replit.md

## Overview

This is **Aestimamus Executive Diagnostics Suite** — a web application that presents fictional corporate case studies (currently "Varexia SE") for executive-level assessment exercises. Users navigate through case materials including strategic briefings, financial visualizations, email communications, a virtual data room, and a structured assessment workspace where they write and save responses to evaluation questions.

The app is a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for persistence via Drizzle ORM.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router) with parameterized case routes (`/case/:id/...`)
- **State/Data fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS v4
- **Charts**: Recharts for financial data visualization
- **Animations**: Framer Motion for page transitions and element animations
- **Fonts**: Playfair Display (serif headers) + Inter (body/data text) loaded from Google Fonts
- **Structure**: Pages in `client/src/pages/`, reusable UI in `client/src/components/ui/`, layout with sidebar navigation in `client/src/components/layout.tsx`
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`, `@assets/` maps to `attached_assets/`

### Backend
- **Framework**: Express 5 on Node.js with TypeScript (run via tsx in dev)
- **API Pattern**: RESTful JSON API under `/api/` prefix
- **Key Endpoints**:
  - `GET /api/assessments/:caseId/:sessionId` — fetch saved assessment responses
  - `POST /api/assessments/save` — upsert a single assessment response
  - `POST /api/assessments/save-all` — bulk upsert assessment responses
- **Validation**: Zod schemas (generated from Drizzle schemas via drizzle-zod)
- **Storage Layer**: `server/storage.ts` defines an `IStorage` interface with a `DatabaseStorage` implementation, providing a clean abstraction over the database
- **Dev Server**: Vite dev server middleware is integrated into Express for HMR during development
- **Production**: Client is built to `dist/public/`, server is bundled with esbuild to `dist/index.cjs`

### Database
- **Database**: PostgreSQL (required, connection via `DATABASE_URL` environment variable)
- **ORM**: Drizzle ORM with `drizzle-orm/node-postgres` driver using a `pg.Pool`
- **Schema Location**: `shared/schema.ts` — shared between frontend and backend
- **Tables**:
  - `users` — id (UUID), username (unique), password
  - `assessment_responses` — id (UUID), caseId, sessionId, phase, questionIndex, question, answer, updatedAt
- **Migrations**: Drizzle Kit configured in `drizzle.config.ts`, output to `./migrations/`. Use `npm run db:push` to push schema changes directly.

### Data Model
- Case study data (Varexia SE business units, financials, emails, assessment questions) is currently hardcoded in `client/src/lib/data.ts` — not stored in the database
- Only assessment responses (user answers) are persisted to PostgreSQL
- Session identification uses `localStorage` with a UUID (`aestimamus_session_id`)

### Build & Development
- `npm run dev` — starts the full-stack dev server (Express + Vite HMR) on port 5000
- `npm run build` — builds client with Vite and server with esbuild into `dist/`
- `npm run start` — runs the production build
- `npm run db:push` — pushes Drizzle schema to PostgreSQL

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connection string must be provided via `DATABASE_URL` environment variable. Used for persisting assessment responses and user data.

### Key NPM Packages
- **drizzle-orm** + **drizzle-kit** + **drizzle-zod**: ORM, migration tooling, and schema-to-Zod validation
- **pg**: PostgreSQL client driver
- **express**: HTTP server framework (v5)
- **@tanstack/react-query**: Server state management on the frontend
- **recharts**: Charting library for financial visualizations
- **framer-motion**: Animation library
- **wouter**: Lightweight React router
- **zod**: Runtime schema validation
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, clsx, tailwind-merge
- **connect-pg-simple**: PostgreSQL session store (available but not actively wired in current routes)

### Replit-Specific Plugins
- `@replit/vite-plugin-runtime-error-modal`: Runtime error overlay in development
- `@replit/vite-plugin-cartographer`: Dev tooling (dev only)
- `@replit/vite-plugin-dev-banner`: Dev banner (dev only)
- Custom `vite-plugin-meta-images`: Updates OpenGraph meta tags with Replit deployment URLs