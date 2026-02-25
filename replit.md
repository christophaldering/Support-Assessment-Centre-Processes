# Executive Diagnostics Platform

## Overview

The Executive Diagnostics Platform is an enterprise-grade, multi-tenant SaaS solution designed to host executive assessment centers. Its primary purpose is to streamline and enhance executive evaluation through advanced diagnostics, supporting organizational development and talent management. Key capabilities include observer ratings, data consolidation, comprehensive consent management, audio processing (transcription and AI-driven summarization), AI-powered insights and recommendations, robust reporting, and detailed analytics.

## User Preferences

Preferred communication style: Simple, everyday language.
Design language: German (all user-facing portal/landing pages in German, with EN/DE toggle planned)
Dual branding:
- Neutral platform: dark navy (#0f172a), blue accent (#3b82f6), clean/minimal
- aestimamus workspace: Terrakotta Rot (#A6473B) primary, Wein Rot (#5F1A11) dark, Lagune Türkis (#297587) accent, Tiefsee Türkis (#115560) accent dark, Lagune Medium (#B5D6DE), Lagune Hell (#EFF4F5) light bg, Satoshi font (Fontshare), pure white backgrounds. Full style guide uploaded and analyzed.
Default passwords: "Christoph" for all access
Footer credit: "© Christoph Aldering · Private initiative / concept"

## System Architecture

The platform is built on a modern full-stack architecture using Next.js 14 (App Router) with TypeScript, Prisma ORM, PostgreSQL, and Tailwind CSS.

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

*   **aestimamus Style Guide integration**: Full corporate design style guide uploaded and analyzed. Theme updated to Terrakotta Rot (#A6473B), Lagune Türkis (#297587), Satoshi font. Brand rule set created. Style Guide upload feature added to Corporate Design page.
*   **Gutachten-Generator**: New standalone module for report/assessment generation with three types (One-Pager, Ergebnisbericht, Gesamtauswertung). Supports PPTX template upload, auto-anonymization, AI structure analysis. API at `/api/w/[slug]/report-templates`.
*   **Exercise scope & scenario linking**: Exercises now have scope (general/client/project/candidate) and can be linked to overarching case study scenarios. Case studies support `isOverarchingScenario` flag. UI filters and badges added.
*   **Rich demo data seeded**: 4 assessments (various statuses), 14+ users (candidates, observers, moderators), 2 competency models with 11 competencies, 2 requirements analyses, 8 exercise library items, 2 observation sheet templates.
*   **Dashboard activity feed**: Live activity timeline on dashboard showing assessment creation, candidate assignments, exercise linking, and rating progress.
*   **Design refresh**: Cockpit header, sidebar, KPI cards, quick actions updated with aestimamus branding colors and Satoshi font.
*   Feature flag system implemented for phased module releases
*   All R1–R6 modules released: Users, Assessments, Requirements, Competencies, Exercise Library, Modul-Designer, Case-Studio, Observation Sheets, Analytics, Reports, Audio, Consents, Theme, Brand Rules, Intelligence, Gutachten-Generator
*   Login error messages improved (German, specific per error type)
*   Role-based routing fixed (CANDIDATE → portal, OBSERVER → observer view, others → cockpit)
*   Cross-tenant authorization hardened for feature-flags API
*   All user passwords reset to "Christoph", googlemail account given ADMIN role
*   **AI Governance (Phase 1 – Lite, Enterprise-Ready)**: Core LLM adapter in `server/llm/` with single entry point `generateLLMOutput()` and `transcribeAudio()`. ENV-based kill switch (`AI_DISABLED`, `AI_FEATURES_DISABLED`), provider routing via `ACTIVE_LLM_PROVIDER` (openai active, neuland stub, azure_eu placeholder). Strict OpenAI ENV usage (`AI_INTEGRATIONS_OPENAI_API_KEY` + `AI_INTEGRATIONS_OPENAI_BASE_URL`). Console logging for all AI requests with route/feature/task metadata. **All 19+ API routes fully migrated** — no direct OpenAI imports outside `server/llm/providers/openai.ts`. `lib/ai.ts` uses adapter internally. `lib/llm/` retained as re-export bridge for Phase 2 features (DB-backed config, Admin UI at `/admin/ai-governance`, audit logging via `ai_system_settings`/`ai_audit_log` tables). Old `lib/llm/providers/` removed (dead code). Architecture designed for Phase 2 extension without refactoring.
*   Shared admin layout: All admin pages use consistent sidebar + terracotta gradient header via `layout.tsx` + `AdminSidebar.tsx`
*   **ARAG BDP Evaluation Tool**: Complete self-contained module at `/arag-bdp/` for Business Development Pitch evaluation. Features:
    - Entry point via "Direkte Anmeldung im Projekt" button on landing page → Project Gate → Login (Demo/Demo)
    - Anonymous code system (V1-V6 Board, MD1 Management Diagnostics, E1 Expert, TN1-TN21 Participants, Team1-Team6)
    - Forced-point scoring (100 pts/criterion across teams per session), server-side validation
    - Session governance: DRAFT → OPEN → CLOSED → RELEASED state machine
    - Individual candidate evaluation (per-criterion prose notes, contribution/presence markers)
    - Admin console: CRUD sessions/teams/participants/observers/criteria, state transitions, transparency mode, tie-break, export, name mappings
    - Export: CSV/JSON (anon/named), print view with "Powered by aestimamus" footer
    - Mobile-first UI: bottom nav (Home/Sessions/Bewertung/Auswertung), hamburger menu, DEMO banner
    - DB: Prisma models prefixed `Bdp*` (15 tables), seeded via `prisma/bdp-seed.ts`
    - API: All routes under `app/api/arag-bdp/`, auth via `bdp_session` HTTP-only cookie
    - ARAG styling: yellow (#FFD700) accent, black text, warm background (#FFFBF0)
    - QA page at `/arag-bdp/admin/qa` with automated PASS/FAIL checks

## External Dependencies

*   **PostgreSQL**: Primary database.
*   **Replit Object Storage**: Used for documents, audio, and generated reports (leveraging Google Cloud Storage).
*   **OpenAI**: Integrated via Replit AI Integrations for advanced AI functionalities (transcription, summarization, generation).
*   **`docx`**: JavaScript library for DOCX report generation.
*   **`pdfkit`**: JavaScript library for PDF report generation.
*   **`pptxgenjs`**: JavaScript library for PPTX report generation.