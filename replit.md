# Executive Diagnostics Platform

## Overview

The Executive Diagnostics Platform is an enterprise-grade, multi-tenant SaaS solution designed to host executive assessment centers. Its primary purpose is to streamline and enhance executive evaluation through advanced diagnostics, supporting organizational development and talent management. Key capabilities include observer ratings, data consolidation, comprehensive consent management, audio processing (transcription and AI-driven summarization), AI-powered insights and recommendations, robust reporting, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German default with full DE/EN internationalization (Sprint I18N-01 complete)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- Main workspace (Executive Diagnostics Suite): Terrakotta Rot (#A6473B) primary, Wein Rot (#5F1A11) dark, Lagune Türkis (#297587) accent, Tiefsee Türkis (#115560) accent dark, Lagune Medium (#B5D6DE), Lagune Hell (#EFF4F5) light bg, Satoshi font (Fontshare), pure white backgrounds. Full style guide uploaded and analyzed.
Default passwords: "#Sammy2024" for all access
Footer credit: "© Christoph Aldering · Private initiative – for training reasons only – no data from reality so far!"

## System Architecture

The platform is built on a modern full-stack architecture using Next.js 14 (App Router) with TypeScript, Prisma ORM, PostgreSQL, and Tailwind CSS.

*   **Server Wrapper:** `scripts/wrapper.js` manages the Next.js server lifecycle. It spawns the server as a detached process (`detached: true`, `child.unref()`) so the workflow system's process management doesn't kill it. In production mode (when `.next/standalone` exists from `next build`), it runs the standalone server directly on port 5000 for fast startup (~100ms). In dev mode, it runs `next dev` on port 5000. A health check loop every 10 seconds auto-restarts the server if it stops responding. The workflow command is `node scripts/wrapper.js`.
*   **Error Boundaries:** `app/global-error.tsx` and `app/error.tsx` provide auto-recovery for chunk loading failures. `public/chunk-recovery.js` adds JS-level error recovery.

**Key Architectural Decisions:**

*   **UI/UX:** Features a multi-step candidate portal and an enterprise cockpit with detailed project views. It supports per-workspace dual-branding and theming with live preview.
*   **Authentication & Authorization:** Employs HTTP-only cookies and a granular Role-Based Access Control (RBAC) system with seven distinct roles (MASTER_ADMIN, WORKSPACE_ADMIN, MODERATOR, OBSERVER, PROJECT_OFFICE, CLIENT, CANDIDATE) for secure access. Legacy role names (ADMIN, PROJECT_ASSISTANT, HR_CLIENT) are supported via backward-compatible aliases.
*   **Data Processing Pipelines:**
    *   **Observer Rating System:** Offline-first UI with localStorage caching, auto-sync, and conflict resolution.
    *   **Consolidation Engine:** Configurable methods (mean, median, trimmed_mean) for score consolidation.
    *   **Consent Management:** GDPR-compliant system with versioned templates and granular consent records.
    *   **Audio Processing:** Pipeline for uploading, transcribing (via OpenAI), and generating structured AI summaries.
*   **AI Integration:** Leverages OpenAI for competency model generation, behavioral anchor creation, recommendations, and autonomous diagnostics, with RBAC protection, consent verification, and audit logging.
*   **Reporting & Analytics:** Generates comprehensive reports in DOCX, PDF, and PPTX formats, and provides an analytics dashboard with normalized scores and benchmark views.
*   **Module & Content Builders:**
    *   **Modul-Designer:** Allows manual, library-based, or AI-generated creation of assessment modules (exercises). Formerly "Baustein-Builder Hub".
    *   **Case-Studio:** Supports uploading documents for AI-driven structuring or AI-generated case studies based on specified parameters. Formerly "Fallstudien-Builder". Now a top-level menu item alongside Modul-Designer.
    *   **Exercise Library:** Provides CRUD operations for reusable exercises, including AI-powered content analysis for automatic categorization and suggestions.
    *   **Observation Sheet Templates:** Builder module for creating observation sheets, supporting both AI analysis of uploaded documents and AI generation based on user inputs.
*   **Advanced Intelligence Layer:** Includes three AI-powered diagnostic modules: Predictive Success Intelligence, Development Path Generator, and Diagnostic Hypothesis Engine, all with confidence scoring, evidence tracking, and audit logging.
*   **Collaboration:** Features a real-time (polling-based) collaboration system for observers and assessors with live presence indicators, activity feeds, and shared notes.
*   **Portal Scheduling:** Time-based content release system for the candidate portal. Documents and self-assessments can be scheduled with start/end dates or set to "always available". Managed from the Enterprise Cockpit's Portal Management section per assessment.
*   **Versioning & Locking:** MTMM matrices are versioned, with automatic locking upon rating submission to prevent modifications.
*   **Theming & Branding:** Provides a brand rule set management system for defining and applying corporate identity rules, with AI parsing of style guides (restricted to MASTER_ADMIN role).
*   **Exercise Matching:** Implements a scoring algorithm to match library exercises to requirements, with planned AI enhancement for contextual fit and adaptation suggestions.
*   **Feature Flag System:** Module-level release management (`lib/feature-flags.ts`). Each workspace stores `featureFlags` (JSON) controlling which modules are visible to regular users. Admins see all modules with "Kommt bald" badges on unreleased ones. Managed via "Modul-Freigabe" section in dashboard and API at `/api/w/[slug]/feature-flags`. Workspace-scoped authorization enforced.
*   **Release Strategy:** Phased rollout approach — R1 (Login, Users, Assessments), R2 (Requirements, Competencies, Scales), R3 (Exercise Library, Observation Sheets, Observer Rating), R4 (Consolidation, Reports, Analytics), R5 (Portal, Consent, Audio, Collaboration), R6 (Intelligence modules).

## Recent Changes (Feb 2026)

*   **Style Guide integration**: Full corporate design style guide uploaded and analyzed. Theme updated to Terrakotta Rot (#A6473B), Lagune Türkis (#297587), Satoshi font. Brand rule set created. Style Guide upload feature added to Corporate Design page.
*   **Gutachten-Generator**: New standalone module for report/assessment generation with three types (One-Pager, Ergebnisbericht, Gesamtauswertung). Supports PPTX template upload, auto-anonymization, AI structure analysis. API at `/api/w/[slug]/report-templates`.
*   **Exercise scope & scenario linking**: Exercises now have scope (general/client/project/candidate) and can be linked to overarching case study scenarios. Case studies support `isOverarchingScenario` flag. UI filters and badges added.
*   **Rich demo data seeded**: 4 assessments (various statuses), 14+ users (candidates, observers, moderators), 2 competency models with 11 competencies, 2 requirements analyses, 8 exercise library items, 2 observation sheet templates.
*   **Dashboard activity feed**: Live activity timeline on dashboard showing assessment creation, candidate assignments, exercise linking, and rating progress.
*   **Design refresh**: Cockpit header, sidebar, KPI cards, quick actions updated with corporate branding colors and Satoshi font.
*   Feature flag system implemented for phased module releases
*   All R1–R6 modules released: Users, Assessments, Requirements, Competencies, Exercise Library, Modul-Designer, Case-Studio, Observation Sheets, Analytics, Reports, Audio, Consents, Theme, Brand Rules, Intelligence, Gutachten-Generator
*   Login error messages improved (German, specific per error type)
*   Role-based routing fixed (CANDIDATE → portal, OBSERVER → observer view, others → cockpit)
*   Cross-tenant authorization hardened for feature-flags API
*   All user passwords reset to "#Sammy2024", googlemail account given ADMIN role
*   **Candidate Portal Demo Content**: All assessments in the main workspace auto-seeded with portal documents (Willkommen & Ablaufplan, Hinweise zur Vorbereitung, exercise-specific briefings, Feedback-Leitfaden) and self-assessments (Selbsteinschätzung Führungskompetenzen with 5-point Likert, Persönliche Reflexion with open questions). All phases (preparation, execution, followup) unlocked. Admin user linked to first assessment for portal preview.
*   **AI Governance (Phase 1 – Lite, Enterprise-Ready)**: Core LLM adapter in `server/llm/` with single entry point `generateLLMOutput()` and `transcribeAudio()`. ENV-based kill switch (`AI_DISABLED`, `AI_FEATURES_DISABLED`), provider routing via `ACTIVE_LLM_PROVIDER` (openai active, neuland stub, azure_eu placeholder). Strict OpenAI ENV usage (`AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL`). Console logging for all AI requests with route/feature/task metadata. **All 19+ API routes fully migrated** — no direct OpenAI imports outside `server/llm/providers/openai.ts`. `lib/ai.ts` uses adapter internally. `lib/llm/` retained as re-export bridge for Phase 2 features (DB-backed config, Admin UI at `/admin/ai-governance`, audit logging via `ai_system_settings`/`ai_audit_log` tables). Old `lib/llm/providers/` removed (dead code). Architecture designed for Phase 2 extension without refactoring.
*   Shared admin layout: All admin pages use consistent sidebar + terracotta gradient header via `layout.tsx` + `AdminSidebar.tsx`
*   **COMP BDP Evaluation Tool**: Complete self-contained module at `/comp-bdp/` for Business Development Pitch evaluation. Features:
    - Entry point via `/comp-bdp/login` (username + password), `/comp-bdp/gate` redirects to `/comp-bdp/login`
    - Anonymous code system: LIVE (V1-V6, MD1, E1, TN1-TN21, Team1-Team6), DEMO prefixed (D-V1..D-V6, D-MD1, D-E1, D-TN1..D-TN21, D-Team1..D-Team6) to avoid unique constraint conflicts
    - Forced-point scoring (100 pts/criterion across teams per session), server-side validation
    - Session governance: DRAFT → OPEN → CLOSED → RELEASED state machine
    - Individual candidate evaluation (per-criterion prose notes, contribution/presence markers)
    - Admin console: CRUD sessions/teams/participants/observers/criteria, state transitions, transparency mode, tie-break, export, name mappings
    - Individual notes API: `/api/comp-bdp/notes/upsert` with Zod validation, locked in CLOSED/RELEASED
    - Export: CSV aggregate/JSON full (anon/named), print view with "Powered by Executive Diagnostics Suite" footer
    - Export restrictions: admin-only, RELEASED-only, demo excluded by default (environment!="demo")
    - Demo exclusion: default exclude records with environment=="demo"; admin toggle "DEMO einschließen" in export tab
    - Mobile-first UI: bottom nav (Home/Sessions/Bewertung/Auswertung), hamburger menu, DEMO banner
    - DB: Prisma models prefixed `Bdp*` (15 tables), seeded via `prisma/bdp-seed.ts`
    - API: All routes under `app/api/comp-bdp/`, auth via `bdp_session` HTTP-only cookie
    - COMP styling: yellow (#FFD700) accent, black text, warm background (#FFFBF0)
    - QA page at `/comp-bdp/admin/qa` with automated PASS/FAIL checks
    - Admin invitations page at `/comp-bdp/admin/invitations`: 3 tabs (Vorstände/Experte/Teilnehmer), TipTap rich text editor with templates and placeholders ({{CODE}}, {{WORKSPACE}}, {{LINK}}, {{SESSION}}, {{SENDER}}), email storage per recipient via BdpNameMapping, preview & copy mode (SendGrid send disabled for safety), session reference selector, QA checks at bottom
    - Desktop sidebar + mobile hamburger both include "Einladungen" link (admin-only)
    - Demo auto-reset: on logout from demo environment, demo data is automatically reset to hard-coded defaults. Demo banner informs users: "Experimentieren erlaubt! Änderungen werden beim Abmelden zurückgesetzt."
    - **Demo Environment (first-class)**: Strict LIVE/DEMO separation via `bdp_environment` cookie. All GET routes filter by `environment` scope. Admin-only LIVE/DEMO toggle in sidebar + hamburger menu (`data-testid="bdp-env-toggle"`). Demo seed creates 3 RELEASED sessions, 6 teams, 21 TN, 3 observers, full scores (sum=100), tie-break case, sponsor flags, individual notes. Reset via `/comp-bdp/admin/demo` page (`data-testid="bdp-demo-reset"`). LIVE data never touched during reset. API: `/api/comp-bdp/environment` (GET/POST), `/api/comp-bdp/admin/demo-reset` (POST).
    - **Guided Tour System**: Role-specific tour steps (admin=10, observer=8, participant=6) via `lib/comp-bdp-tour.ts`. `TourOverlay.tsx` with SVG spotlight mask, popover positioning, Escape key. Auto-starts on first demo login. "Tour starten" in sidebar + hamburger. Tour restart from profile page clears localStorage and dispatches custom event.
    - **Sprint I18N-01 — Full DE/EN Internationalization**:
      - i18n infrastructure: `lib/i18n/translations.ts` (800+ lines, full DE/EN dictionary), `lib/i18n/language.ts` (cookie+localStorage persistence), `app/providers/LanguageProvider.tsx` (React context + `t()` + `useLanguage()`), `app/components/LanguageToggle.tsx` (DE/EN pill toggle)
      - LanguageProvider wraps: BDP layout (`app/comp-bdp/layout.tsx`), COMP lobby (`app/w/comp/page.tsx`), workspace login (`app/w/[workspaceSlug]/login/page.tsx`)
      - LanguageToggle in: BDP desktop header, BDP mobile header, lobby header, workspace login header
      - All ~25 files internationalized: sessions, bewertung, auswertung, profile, admin, export/print, login/gate redirects, lobby, StandardLanding, AppleLanding, LandingHero, HeroStrategicPanel, LandingCards, LandingCharts, JourneyTimeline, StrategicStoryboard, AmbivalenceDiagram, FrameworkVisual, NotificationBell, TourOverlay, CaseModal
      - Language persists across navigation via `lang` cookie + `comp_lang` localStorage key
      - Brand names (WHU Learning, Board Evaluation, Strategic Relevance, etc.) kept in English as proper nouns
    - **Sprint D4 — Avatar System + Business Case Viewer**:
      - `AvatarCircle.tsx` component: renders user avatar or gold initial circle (sm/md/lg). Used in layout sidebar, mobile header, profile page.
      - Avatar upload API: `/api/comp-bdp/avatar` (POST multipart, GET signed URL). Stores in Object Storage at `.private/avatars/{userId}.{ext}`.
      - Demo SVG avatars: `/public/demo-avatars/` — 9 character-themed SVGs (curie, turing, arendt, lovelace, tesla, beauvoir, woolf, drucker, aurelius). Assigned via `photoUrl` in demo seed.
      - Business Case Viewer: `SlideViewer.tsx` (slide nav with dots), `CaseModal.tsx` (fullscreen modal). Demo cases in `lib/demo-business-cases.ts` with 5 slides per team (Strategic Vision, Market Analysis, Business Model, Financial Planning, Risk Analysis). Content matches character personalities with subtle humor.
      - Business Case API: `/api/comp-bdp/business-case` (GET with teamId). Returns slides for demo-generated or signed PDF URL.
      - Business Case Upload: `/api/comp-bdp/business-case/upload` (POST multipart, PDF only, max 15MB). Admin-only. Updates `BdpTeam.businessCaseUrl` and `businessCaseType="pdf"`.
      - Bewertung integration: "Case" link per team in first criterion row opens CaseModal.
      - Admin teams tab: shows business case type badge, PDF upload input per team.
      - Profile page: working photo upload with preview, tour restart button.
      - `/anmeldung` page removed; all login flows through `/comp-bdp/login`.

    - **Sprint ABCD-CLONE-01 — Anonymized ABCD Workspace Clone**:
      - Full clone of COMP BDP tool at `/abcd-bdp/` + `/w/abcd` with zero COMP branding
      - Multi-tenant data isolation via `workspace` column on BdpUser, BdpSession, BdpTeam, BdpParticipant, BdpCriterion, BdpConfig, BdpNameMapping
      - Compound unique constraints: `@@unique([code, workspace])` for multi-workspace support
      - Auth helpers: `bdpEnvFilter(session)` and `bdpWorkspaceFilter(session)` in `lib/bdp-auth.ts`
      - All COMP API routes updated with workspace filters (backward-compatible, defaults to "comp")
      - ABCD API routes at `/api/abcd-bdp/` with workspace="abcd"
      - ABCD lobby at `/w/abcd` — blue (#0071e3) accent, Apple-inspired clean design
      - ABCD demo teams: Lisbon, Vienna, Prague, Oslo, Valencia, Krakow (EU cities, different from COMP)
      - ABCD demo codes: A-V1..A-V7, A-MD1, A-E1, A-TN1..A-TN22 (A- prefix)
      - ABCD workspace auto-created in `instrumentation.ts`
      - Login flow: `/w/abcd/login` → tryBdpLogin with workspace="abcd" → `/w/abcd`
      - Tour: `lib/abcd-bdp-tour.ts`, localStorage key `abcd_bdp_tourSeen_*`
      - Gate cookie: `abcd_gate_session` (separate from COMP's `comp_gate_session`)
      - No COMP branding leaks: all strings, URLs, colors, cookie names sanitized

## External Dependencies

*   **PostgreSQL**: Primary database.
*   **Replit Object Storage**: Used for documents, audio, and generated reports (leveraging Google Cloud Storage).
*   **OpenAI**: Integrated via Replit AI Integrations for advanced AI functionalities (transcription, summarization, generation).
*   **`docx`**: JavaScript library for DOCX report generation.
*   **`pdfkit`**: JavaScript library for PDF report generation.
*   **`pptxgenjs`**: JavaScript library for PPTX report generation.