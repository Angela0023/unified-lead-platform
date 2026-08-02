# Changelog - Unified Lead Platform

> **All notable changes to this project will be documented in this file.**
>
> **Format:** Keep a Changelog (keepachangelog.com)
> **Versioning:** Semantic Versioning (semver.org)

---

## [Unreleased]

### Added

- **DEPLOYMENT.md** - Comprehensive deployment guide for Sprint 14
  - Complete Vercel setup instructions with screenshots guidance
  - All 7 API keys documented (Apollo, DeepSeek, Firecrawl, Million Verifier, Prospeo, Expandi, BounceBan)
  - Supabase database setup and migration steps
  - Railway Redis + background workers setup
  - Custom domain configuration (leads.corsyx.com via Cloudflare DNS)
  - SSL certificate setup (automatic via Vercel)
  - Troubleshooting guide for common deployment issues
  - Monitoring, backup, and disaster recovery procedures
  - Scaling considerations and cost monitoring
  - Post-MVP multi-source enablement instructions

### Decisions

- **Multi-source infrastructure ready from day 1** - Angela confirmed "Apollo database is not good" based on real-world experience. MVP uses Apollo only (simpler), but all 7 API keys will be added to Vercel environment from start. Infrastructure built to support Prospeo/Expandi/BounceBan fallback - easy to enable post-MVP (no refactoring needed).

### Why These Changes

- **DEPLOYMENT.md creation:** Angela setting up Vercel now (ahead of Sprint 14) to understand deployment process and prepare custom domain. Guide ensures she can complete deployment when MVP ready without surprises.
- **All API keys upfront:** Even though MVP uses Apollo only, adding all keys to Vercel now means post-MVP features (multi-source enrichment) can be enabled with code changes only - no redeployment or environment reconfiguration needed.

### Status

- Environment setup: ✅ Complete (Sprint 2)
- Search form UI: 🔄 In progress (Sprint 3 - DeepSeek building)
- Deployment preparation: ✅ Guide ready, Angela exploring Vercel

---

## [0.3.0] - 2026-08-02

### Added
- **Stage 0: Search form UI** (/search) - industry/location multi-selects, company size, target role, ICP prompt, Gate 0 validation, 4 example prompts
- **Stage 1: Pre-flight checks** - GET /api/preflight (database, Redis, worker heartbeat, all 4 API connections + credit balances)
- **Stage 2: Cost & time estimation** - POST /api/estimates with per-phase breakdown, credit usage, approval UI on /search/confirm
- **Stage 3: Company discovery** - apolloClient.searchCompanies(), 'company-discovery' worker handler, checkpointed batch inserts
- **Stage 4: Company validation** - firecrawlClient.scrape(), deepseekClient.validate() with prompt template, score 1-5 filtering (1=REJECTED, 2-5=VALIDATED), conflicts stored, checkpoints every 50
- **Stage 5: Contact discovery** - apolloClient.findContacts(), de-duplication, max 2 contacts per company
- **Stage 6: Email enrichment** - apolloClient.getEmail(), immediate saves, checkpoints every 50, resumeEmailEnrichment() crash recovery
- **Stage 7: Email validation** - mvClient.uploadBatch()/pollBatch(), VALID/RISKY/INVALID categorization, search auto-completes
- **Stage 9: Reporting** - results API, results table UI (filtering), CSV export (GET /api/searches/:id/download)
- **Progress tracking UI** - /search/:id/progress with 4s polling, phase checklist, live stats, estimated completion
- **POST /api/searches** (create + queue), **GET /api/searches** (recent history on landing page)
- **Modular integration clients** per ARCHITECTURE.md: apollo, deepseek, firecrawl, million-verifier (client/types/errors each)
- **Shared HTTP helper** - timeouts, retryable error normalization, exponential backoff (1s/2s/4s)
- **Demo Mode** (DEMO_MODE=true) - simulated but deterministic data for all integrations so the full product runs without API keys
- Additive migration: Search.estimatedCost/estimatedTimeMinutes, Company.apolloId, Contact.apolloId

### Changed
- Worker now emits a Redis heartbeat (10s interval) for pre-flight health checks
- Landing page shows recent searches
- README status updated to MVP Development

### Fixed
- Redis connection leak in enqueueSearchJob (queue/connection now closed after use)
- Demo data quality (title variants, email/contact name consistency)
- TanStack Query refetchInterval typing

### Testing
- Full end-to-end demo pipeline verified: 15 companies → 12 validated → 16 contacts → 10 emails → 5 valid / 4 risky / 1 invalid, search COMPLETED
- All pages return 200 (/, /search, /search/confirm, /search/:id/progress, /search/:id/results)
- Preflight: all checks OK incl. worker heartbeat
- CSV export verified; estimates API verified
- lint + type-check + production build pass

### Blocked / Pending
- Real API key testing (needs Apollo, DeepSeek, Firecrawl, Million Verifier keys from Angela)
- Production deployment (needs Vercel/Supabase/Railway accounts - see DEPLOYMENT.md)
- Sonnet review before Angela uses it in production

### Next Steps
- Sprint 14 deployment per DEPLOYMENT.md
- Sonnet final verification

---

## [0.2.0] - 2026-08-02

### Added

- **Next.js 14.2.35 project initialized** (App Router, TypeScript, Tailwind CSS 3.4, `/src` directory)
- **Shadcn UI installed** with 15 components (button, input, textarea, label, select, card, badge, tooltip, progress, separator, alert, sonner, table, checkbox, skeleton)
- **ESLint + Prettier** configured (`npm run lint`, `npm run type-check`, `npm run format`)
- **TanStack Query** + app providers (QueryClientProvider, Toaster)
- **Prisma schema** created from ARCHITECTURE.md (Search, Company, Contact, Job models + enums), FK indexes added
- **Initial migration** applied to local PostgreSQL 16 (Homebrew)
- **Seed script** (`prisma/seed.ts`) with test data: 1 search, 5 companies, 5 contacts, 2 jobs
- **BullMQ + Redis** job queue: `src/lib/queue.ts` (queue definitions), `src/workers/index.ts` (worker process, `npm run worker`), `src/scripts/test-queue.ts` (smoke test, `npm run test:queue`)
- **Prisma client singleton** (`src/lib/db.ts`) for Next.js hot-reload safety
- **.env.example** with all documented environment variables + comments
- **docs/SETUP.md** - how to get Apollo, DeepSeek, Firecrawl, Million Verifier API keys
- **VS Code recommended extensions** (.vscode/extensions.json)
- **Landing page** at `/` (placeholder until Stage 0 search form)

### Changed

- README.md repository structure note: code now lives in `/src` (development started)

### Decisions

- Pinned Next.js to v14.2.35 and Prisma to v6.19.3 to match documented architecture exactly (see DECISIONS.md DEV-001, DEV-002)
- Local PostgreSQL + Redis via Homebrew for development (Docker unavailable); Supabase deferred to production deployment (see DECISIONS.md DEV-003)
- Shadcn CLI pinned to v2.3.0 (latest CLI is Tailwind v4-only; project uses Tailwind v3 per architecture)

### Testing

- `npm run lint` - no warnings or errors
- `npm run type-check` - passes
- `npm run build` - production build succeeds
- Dev server verified on http://localhost:3100 (port 3000 occupied by another process)
- Job queue smoke test: job enqueued via `npm run test:queue`, processed by worker, completed (verified in Redis)
- Migration applied + seed verified (1 search, 5 companies, 5 contacts, 2 jobs)

### Blocked / Pending

- API key testing (Sprint 4) - needs keys from Angela
- Supabase setup - needs Angela's account
- Branch protection rules - attempted via gh CLI

### Next Steps

- Implement Stage 0 (search form UI) - Sprint 3

---

## [0.1.0] - 2026-08-02

### Added

- **Complete planning documentation**
  - README.md: Project overview and repository structure
  - PLANNING.md: Comprehensive planning document with all requirements
  - ARCHITECTURE.md: Technical architecture and stack decisions
  - WORKFLOW.md: 11-stage quality gate workflow with checkpoints
  - BOTTLENECKS.md: Risk analysis and mitigation strategies
  - BEST-SCENARIO.md: Success milestones from MVP to market leader
  - QUALITY-GATES.md: Detailed quality gate framework implementation
  - DEVELOPMENT-WORKFLOW.md: Safe development and deployment process
  - CHANGELOG.md: This file, tracking all changes
  - DECISIONS.md: Design decisions and lessons learned log
  - TODO.md: Task tracking and next steps
  - .gitignore: Security (prevent API key commits)

### Decisions

- **Technology Stack Chosen:**
  - Frontend: Next.js 14 (App Router) + Tailwind + Shadcn UI
  - Backend: Next.js API Routes + Node.js background workers
  - Database: PostgreSQL via Supabase (free tier for MVP)
  - Queue: BullMQ + Redis
  - ORM: Prisma
  - Hosting: Vercel (frontend/API) + Railway (workers)

- **MVP Scope Defined:**
  - Core workflow: Stages 0-7, 9 (skip Stage 8, 10, 11 for MVP)
  - Single user: Angela (internal use)
  - Integrations: Apollo, DeepSeek, Firecrawl, Million Verifier
  - Quality gates: Pre-flight checks, cost estimation, checkpointing
  - Target timeline: 2 months to working MVP

- **Quality Gate Framework Adopted:**
  - Inspired by enterprise software deployment processes
  - 11-stage system ensuring reliability and cost control
  - MVP includes critical gates (0-7, 9)
  - Post-MVP enhancements documented for future (8, 10, 11)

- **Cost Transparency Principle:**
  - Always show estimated cost before starting search
  - User must approve before spending credits
  - Detailed cost breakdown in final report

- **Checkpoint Saving Strategy:**
  - Save progress every 50 records (companies, contacts)
  - Enables crash recovery without data loss
  - Prevents duplicate API calls on retry

### Why These Decisions

- **Next.js:** Full-stack framework, great DX, easy deployment to Vercel
- **PostgreSQL:** Relational data fits the domain (searches → companies → contacts)
- **Supabase:** Free tier sufficient for MVP, easy to upgrade later
- **Quality Gates:** Addresses Angela's top concern (stability, no breaking changes)
- **Checkpointing:** Long searches (45-60 min) need crash recovery

### Deferred to Post-MVP

- Multi-source email enrichment (Prospeo, Expandi fallback)
- BounceBan secondary validation
- Alternative contact discovery
- Saved ICP profiles
- Search history browsing
- Multi-user support
- Learning loop (Stage 10)
- Self-healing background (full Stage 11)

### Next Steps

- Set up development environment
- Initialize Next.js project
- Configure database schema with Prisma
- Implement Stage 0 (search form UI)
- Implement Stage 1 (pre-flight checks)

---

## Format Guide

Use this format for future entries:

```markdown
## [Version] - YYYY-MM-DD

### Added

- New features, files, or capabilities

### Changed

- Changes to existing functionality

### Fixed

- Bug fixes

### Removed

- Removed features or files

### Deprecated

- Features that will be removed in future

### Security

- Security fixes or improvements

### Decisions

- Design decisions made and why

### Why These Changes

- Rationale behind the changes

### Deferred

- What was intentionally not done (and why)
```

---

## Version Number Guide

**Format:** MAJOR.MINOR.PATCH

- **MAJOR:** Breaking changes (e.g., API changes, data migration required)
- **MINOR:** New features (backward compatible)
- **PATCH:** Bug fixes (backward compatible)

**Examples:**

- 0.1.0 → Planning complete, no code yet
- 0.2.0 → MVP development started
- 0.3.0 → Search form implemented
- 0.4.0 → Background workflow implemented
- 1.0.0 → MVP complete, Angela using in production
- 1.1.0 → Added multi-source email enrichment
- 1.2.0 → Added search history
- 2.0.0 → Multi-user support (breaking change: auth system added)

---

**Last Updated:** 2026-08-02
**Current Version:** 0.3.0 (MVP Feature Complete - Stages 0-7 + 9)
**Next Version:** 1.0.0 (MVP Release after Sonnet review + deployment)
